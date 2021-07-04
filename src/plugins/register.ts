// typescript needs to be bundled with the executable
import "typescript";

import chokidar, { FSWatcher } from "chokidar";
import { resolve } from "path";
import semver from "semver";
import { register } from "ts-node";

import { IConfig } from "../config/schema";
import { handleError, logger } from "../utils/logger";
import version from "../version";
import { UnknownPlugin } from "./types";

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

export let registeredPlugins: Record<string, UnknownPlugin> = {};
let pluginWatchers: FSWatcher[] = [];

export function getPlugin(name: string): UnknownPlugin {
  logger.debug(`Getting plugin "${name}" from registered plugins`);
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

// Throws error if argument validation fails
function validatePluginVersion(name: string, plugin: UnknownPlugin): true {
  const required = plugin.requiredVersion;
  if (required) {
    const baseVersion = semver.coerce(version) || version;
    if (!semver.satisfies(baseVersion, required)) {
      throw new Error(`Plugin "${name}" requires Porn Vault version ${required}`);
    }
  }

  return true;
}

// Throws error if argument validation fails
function validatePluginArguments(name: string, plugin: UnknownPlugin, args: unknown): true {
  if (!plugin.validateArguments) {
    return true;
  }

  if (!plugin.validateArguments(args)) {
    throw new Error(`Argument validation for "${name}" failed: ${JSON.stringify(args, null, 2)}`);
  }

  return true;
}

// Loads the plugin without any validation
export function loadPlugin(name: string, path: string): UnknownPlugin {
  logger.debug(`Loading plugin "${name}" from "${path}"`);
  const required = requireUncached(path);
  if (typeof required !== "function") {
    throw new Error(`Invalid plugin format for plugin "${name}": ${typeof required}`);
  }
  return <UnknownPlugin>required;
}

// Returns an array of plugins, without doing any validation
export function loadPlugins(
  config: IConfig
): [string, string, Record<string, unknown>, UnknownPlugin][] {
  logger.verbose("Loading plugins");

  const plugins: [string, string, Record<string, unknown>, UnknownPlugin][] = [];
  for (const name in config.plugins.register) {
    const { path, args } = config.plugins.register[name];
    plugins.push([name, path, args || {}, loadPlugin(name, path)]);
  }

  return plugins;
}

export function initializePlugins(config: IConfig) {
  logger.verbose("Initializing plugins");

  clearPluginWatchers();
  registeredPlugins = {};

  const plugins = loadPlugins(config);

  for (const [name, _path, args, plugin] of plugins) {
    validatePluginVersion(name, plugin);
    validatePluginArguments(name, plugin, args);

    for (const eventName in config.plugins.events) {
      const event = config.plugins.events[eventName];
      for (const pluginItem of event) {
        if (typeof pluginItem === "string") {
          // Nothing to validate
        } else {
          const [_pluginName, pluginArgs] = pluginItem;
          validatePluginArguments(name, plugin, pluginArgs);
        }
      }
    }
  }

  for (const [name, _path, _args, plugin] of plugins) {
    registeredPlugins[name] = plugin;
    let str = `Registered plugin "${name}"`;
    if (plugin.info) {
      str += ` v${plugin.info.version}`;
    } else {
      logger.warn(`Plugin "${name}" does not contain metadata. May be outdated?`);
    }

    logger.debug(str);
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
        logger.verbose(`Plugin "${pluginName}" changed, reinitializing plugins`);
        initializePlugins(config);
      })
      .on("unlink", () => {
        logger.verbose(`Plugin "${pluginName}" deleted, reinitializing plugins`);
        initializePlugins(config);
      });
    pluginWatchers.push(watcher);
  }
}
