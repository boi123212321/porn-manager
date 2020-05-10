import chokidar, { FSWatcher, WatchOptions } from "chokidar";

import * as logger from "../logger";

interface WatcherOptions {
  pollingInterval?: number;
}

const DEFAULT_OPTIONS = {
  pollingInterval: 2 * 1000,
};

/**
 * Watches paths for any changes
 */
export default class Watcher {
  private watcher: FSWatcher;
  private watchOptions: WatchOptions;

  /**
   * @param watchPaths - the paths to watch
   * @param excludePaths - paths to exclude from emitting events for
   * @param onPathAdded - callback for when a new path is discovered
   * @param onReadyCallback - called when the initial scan is complete
   */
  constructor(
    watch: string[],
    exclude: string[],
    onPathAdded: (path: string) => void,
    onReadyCallback: () => void,
    options: WatcherOptions
  ) {
    // Clone arrays to prevent mutation on original
    const watchPaths = [...watch];
    const excludePaths = [...exclude];

    const mergedOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    this.watchOptions = {
      ignored: excludePaths,
      usePolling: mergedOptions.pollingInterval > 0, // Helps to avoid overloading a network device
      interval: mergedOptions.pollingInterval,
      binaryInterval: mergedOptions.pollingInterval,
      awaitWriteFinish: true,
    };

    logger.log(`[watcher]: Will watch folders: ${watchPaths}.`);

    if (excludePaths.length) {
      logger.log(`[watcher]: Will ignore files: ${excludePaths}.`);
    }

    this.watcher = chokidar.watch(watchPaths, this.watchOptions);
    this.watcher.on("add", (path) => {
      onPathAdded(path);
    });

    this.watcher.on("ready", () => {
      logger.log(`[watcher]: initial scan complete for ${watchPaths}`);

      onReadyCallback();
    });
  }

  /**
   * Stops watching what was passed in the constructor
   * of this instance
   *
   * @returns resolves once all the files are unwatched
   */
  public async stopWatching(): Promise<void> {
    logger.log("[watcher]: Stopping watch");
    await this.watcher.close();
    logger.log("[watcher]: Did stop watching");
  }
}
