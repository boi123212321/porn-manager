import { getConfig } from "../../config";
import * as logger from "../../logger";
import {
  SUPPORTED_IMAGE_EXTENSIONS,
  SUPPORTED_VIDEO_EXTENSIONS,
} from "../constants";
import Watcher from "./watcher";
import ImportManager from "../importManager";

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

export default class LibraryWatcher {
  private watcher: Watcher;

  /**
   *
   * @param importManager - manager to handle newly found paths
   * @param onInitialScanCompleted - Called when the initial scan of the library
   * is complete
   */
  constructor(
    importManager: ImportManager,
    onInitialScanCompleted?: () => void
  ) {
    const config = getConfig();

    const watchPaths = createWatchPaths(config.VIDEO_PATHS, config.IMAGE_PATHS);

    this.watcher = new Watcher(
      {
        includePaths: watchPaths,
        excludePaths: config.EXCLUDE_FILES,
        pollingInterval: config.WATCH_POLLING_INTERVAL,
      },
      (addedPath) => {
        logger.log(`[libraryWatcher]: found path ${addedPath}`);

        importManager.importPaths(addedPath);
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
  public async stopWatching() {
    logger.log("[libraryWatcher]: Stopping watch");
    await this.watcher.stopWatching();
    logger.log("[libraryWatcher]: Did stop watching");
  }
}
