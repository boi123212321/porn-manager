import { getConfig } from "../../config";
import * as logger from "../../logger";
import {
  SUPPORTED_IMAGE_EXTENSIONS,
  SUPPORTED_VIDEO_EXTENSIONS,
} from "../constants";
import { importPaths } from "../importManager";
import Watcher from "./watcher";

/**
 * Generates an array of glob paths to watch for the library
 *
 * @param videoPaths - paths to watch for videos
 * @param imagePaths - paths to watch for images
 */
const createWatchPaths = (videoPaths, imagePaths) => {
  const videoGlobs = videoPaths.flatMap((path) => {
    return SUPPORTED_VIDEO_EXTENSIONS.map(
      (extension) => `${path}/**/*${extension}`
    );
  });

  const imageGlobs = imagePaths.flatMap((path) => {
    return SUPPORTED_IMAGE_EXTENSIONS.map(
      (extension) => `${path}/**/*${extension}`
    );
  });

  // Return unique globs
  return [...new Set([...videoGlobs, ...imageGlobs])];
};

let watcher: Watcher | null = null;

/**
 *
 * @param onInitialScanCompleted - Called when the initial scan of the library
 * is complete
 */
export function initLibraryWatcher(onInitialScanCompleted?: () => void) {
  if (watcher) {
    logger.message("Already watching library, will not recreate watcher");
  }

  const config = getConfig();

  const watchPaths = createWatchPaths(config.VIDEO_PATHS, config.IMAGE_PATHS);

  watcher = new Watcher(
    {
      includePaths: watchPaths,
      excludePaths: config.EXCLUDE_FILES,
      pollingInterval: config.WATCH_POLLING_INTERVAL,
    },
    (addedPath) => {
      logger.log(`[libraryWatcher]: found path ${addedPath}`);

      importPaths(addedPath);
    },
    () => {
      if (onInitialScanCompleted) {
        onInitialScanCompleted();
      }
    }
  );
}
/**
 * Stops watching what was passed in the constructor
 * of this instance
 *
 * @returns resolves once all the files are unwatched
 */
export async function stopWatchingLibrary() {
  logger.log("[libraryWatcher]: Stopping watch");
  await watcher?.stopWatching();
  logger.log("[libraryWatcher]: Did stop watching");
  watcher = null;
}

export function isWatchingLibrary() {
  return !!watcher;
}
