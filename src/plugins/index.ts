import * as nodepath from "path";
import { inspect } from "util";

import { IConfig } from "../config/schema";
import { getMatcher, getMatcherByType } from "../matching/matcher";
import { walk } from "../utils/fs/async";
import { createPluginLogger, formatMessage, handleError, logger } from "../utils/logger";
import { libraryPath } from "../utils/path";
import { Dictionary } from "../utils/types";
import VERSION from "../version";
import { modules } from "./context";
import { getPlugin, requireUncached } from "./register";
import { createPluginStoreAccess } from "./store";

export function resolvePlugin(
  item: string | [string, Record<string, unknown>]
): [string, Record<string, unknown> | undefined] {
  if (typeof item === "string") {
    return [item, undefined];
  }
  return item;
}

export async function runPluginsSerial(
  config: IConfig,
  event: string,
  inject?: Dictionary<unknown>
): Promise<Record<string, unknown>> {
  const result = {} as Dictionary<unknown>;
  if (!config.plugins.events[event]) {
    logger.warn(`No plugins defined for event ${event}.`);
    return result;
  }

  logger.info(`Running plugin event: ${event}`);

  let numErrors = 0;

  for (const pluginItem of config.plugins.events[event]) {
    const [pluginName, pluginArgs] = resolvePlugin(pluginItem);

    try {
      const pluginResult = await runPlugin(config, pluginName, {
        data: <typeof result>JSON.parse(JSON.stringify(result)),
        event,
        ...inject,
        pluginArgs,
      });
      Object.assign(result, pluginResult);
    } catch (error) {
      handleError(`Plugin error`, error);
      numErrors++;
    }
  }

  const len = config.plugins.events[event].length;
  if (!numErrors) {
    logger.info(`Ran ${len} plugins (${len} successful)`);
  } else {
    logger.error(`Ran ${len} plugins (${len - numErrors} successful, ${numErrors} errors)`);
  }
  logger.debug("Plugin series result");
  logger.debug(inspect(result, true, null, true));
  return result;
}

export async function runPlugin(
  config: IConfig,
  pluginName: string,
  inject?: Dictionary<unknown>,
  args?: Dictionary<unknown>
): Promise<unknown> {
  const pluginDefinition = config.plugins.register[pluginName];

  if (!pluginDefinition) {
    throw new Error(`${pluginName}: plugin not found.`);
  }

  const func = getPlugin(pluginName);

  const pluginArgs = JSON.parse(JSON.stringify(args || pluginDefinition.args || {}));
  const pluginLogger = createPluginLogger(pluginName, config.log.writeFile);

  const pluginVersion = func.info?.version ? `v${func.info?.version}` : "unknown version";
  logger.info(`Running plugin ${pluginName} ${pluginVersion}`);
  logger.debug(formatMessage(pluginDefinition));

  const result = await func({
    // MAIN CONTEXT
    $config: JSON.parse(JSON.stringify(config)) as IConfig,
    $cwd: process.cwd(),
    $formatMessage: formatMessage,
    $getMatcher: getMatcherByType,
    $library: libraryPath(""),
    $log: (...msgs: unknown[]) => {
      logger.warn(`$log is deprecated, use $logger instead`);
      pluginLogger.info(msgs.map(formatMessage).join(" "));
    },
    $logger: pluginLogger,
    $matcher: getMatcher(),
    $require: (partial: string) => {
      if (typeof partial !== "string") {
        throw new TypeError("$require: String required");
      }
      return requireUncached(nodepath.resolve(pluginDefinition.path, partial));
    },
    // Persistent in-memory data store
    $store: createPluginStoreAccess(pluginName),
    $throw: (...msgs: unknown[]) => {
      const msg = msgs.map(formatMessage).join(" ");
      pluginLogger.error(msg);
      throw new Error(msg);
    },
    $version: VERSION,
    $walk: walk,
    // PLUGIN
    args: pluginArgs,
    $args: pluginArgs,
    $pluginName: pluginName,
    $pluginPath: nodepath.resolve(pluginDefinition.path),
    ...inject,
    ...modules,
  });

  if (typeof result !== "object") {
    throw new Error(`${pluginName}: malformed output.`);
  }

  logger.debug("Plugin result:");
  logger.debug(inspect(result, true, null, true));
  return result || {};
}
