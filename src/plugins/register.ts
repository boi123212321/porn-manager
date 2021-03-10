// typescript needs to be bundled with the executable
import "typescript";

import chokidar, { FSWatcher } from "chokidar";
import { resolve } from "path";
import { register } from "ts-node";

import { IConfig } from "../config/schema";
import { handleError, logger } from "../utils/logger";

let didRegisterTsNode = false;

export function requireUncached(modulePath: string): unknown {
  if (!didRegisterTsNode && modulePath.endsWith(".ts")) {
    register({
      emit: false,
      skipProject: true, // Do not use this projects tsconfig.json
      transpileOnly: true, // Disable type checking
      compilerHost: true,
      compilerOptions: {
        allowJs: true,
        target: "es6",
        module: "commonjs",
        lib: ["es6", "dom", "es2016", "es2018"],
        sourceMap: true,
        removeComments: false,
        esModuleInterop: true,
        checkJs: false,
        isolatedModules: false,
      },
    });
    didRegisterTsNode = true;
  }

  const fullPath = resolve(modulePath);
  try {
    delete require.cache[require.resolve(fullPath)];
    return <unknown>require(fullPath);
  } catch (err) {
    handleError(`Error requiring "${fullPath}"`, err);
    throw err;
  }
}

type Plugin = Function;

export let registeredPlugins: Record<string, Plugin> = {};
let pluginWatchers: FSWatcher[] = [];

export function getPlugin(name: string): Plugin {
  logger.debug(`Getting plugin "${name}" from plugin cache`);
  return registeredPlugins[name];
}

export function clearPluginWatchers(): void {
  logger.debug(`Clearing ${pluginWatchers.length} plugin watchers`);
  for (const watcher of pluginWatchers) {
    watcher.close().catch((err) => {
      handleError("Error while closing file watcher", err);
    });
  }
  pluginWatchers = [];
}

export function cachePlugin(name: string, path: string): void {
  logger.debug(`Loading plugin "${name}" from "${path}"`);
  const pluginFunction = requireUncached(path);
  if (typeof pluginFunction !== "function") {
    throw new Error(`Invalid plugin format for plugin "${name}": ${typeof pluginFunction}`);
  }
  registeredPlugins[name] = pluginFunction;
}

export function initializePlugins(config: IConfig) {
  logger.verbose("Loading plugins");
  clearPluginWatchers();
  registeredPlugins = {};
  for (const pluginName in config.plugins.register) {
    const { path } = config.plugins.register[pluginName];
    cachePlugin(pluginName, path);
  }
  watchPlugins(config);
}

export function watchPlugins(config: IConfig) {
  logger.verbose("Watching plugins for change");
  for (const pluginName in config.plugins.register) {
    const { path } = config.plugins.register[pluginName];
    logger.debug(`Watching plugin source "${pluginName}" @ "${path}"`);

    const watcher = chokidar
      .watch(path, {
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 100,
        },
      })
      .on("change", () => {
        logger.verbose(`Plugin "${pluginName}" changed, reloading...`);
        cachePlugin(pluginName, path);
      })
      .on("unlink", () => {
        logger.verbose(`Plugin "${pluginName}" deleted, reinitializing plugins`);
        initializePlugins(config);
      });
    pluginWatchers.push(watcher);
  }
}
