import ffmpeg from "fluent-ffmpeg";
import { existsSync } from "fs";
import path from "path";

import { IConfig } from "../config/schema";
import { checkUnusedPlugins, prevalidatePlugins } from "../plugins/validate";
import { logger } from "../utils/logger";
import { isRegExp } from "../utils/types";

export function validateFFMPEGPaths(config: IConfig): void {
  if (config.binaries.ffmpeg) {
    const found = existsSync(config.binaries.ffmpeg);
    if (!found) {
      throw new Error(
        `FFMPEG binary not found at "${config.binaries.ffmpeg}" for "config.binaries.ffmpeg"`
      );
    }
  } else {
    throw new Error(`No FFMPEG path defined in config.json for "config.binaries.ffmpeg"`);
  }

  if (config.binaries.ffprobe) {
    const found = existsSync(config.binaries.ffprobe);
    if (!found) {
      throw new Error(
        `FFPROBE binary not found at "${config.binaries.ffprobe}" for "config.binaries.ffprobe"`
      );
    }
  } else {
    throw new Error(`No FFPROBE path defined in config.json for "config.binaries.ffprobe"`);
  }
}

/**
 * Does extra validation on the config.
 * Exits if invalid.
 * Sets the ffmpeg binary paths to the ones in the config
 *
 * @param config - the config the check
 * @throws
 */
export function validateConfigExtra(config: IConfig): void {
  prevalidatePlugins(config);
  checkUnusedPlugins(config);

  logger.info(`Registered plugins: ${JSON.stringify(Object.keys(config.plugins.register))}`);
  logger.debug("Loaded config:");
  logger.debug(config);

  if (config.scan.excludeFiles && config.scan.excludeFiles.length) {
    for (const regStr of config.scan.excludeFiles) {
      if (!isRegExp(regStr)) {
        throw new Error(`Invalid regex: "${regStr}" at "config.scan.excludeFiles".`);
      }
    }
  }

  validateFFMPEGPaths(config);

  const ffmpegPath = path.resolve(config.binaries.ffmpeg);
  const ffprobePath = path.resolve(config.binaries.ffprobe);

  ffmpeg.setFfmpegPath(ffmpegPath);
  ffmpeg.setFfprobePath(ffprobePath);

  logger.verbose(`FFMPEG set to "${ffmpegPath}"`);
  logger.verbose(`FFPROBE set to "${ffprobePath}"`);
}
