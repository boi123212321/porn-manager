import { existsSync } from "fs";

import { IConfig } from "../config/index";
import * as logger from "../logger";

export function validateFFMPEGPaths(config: IConfig): void {
  if (config.FFMPEG_PATH) {
    const found = existsSync(config.FFMPEG_PATH);
    if (!found) {
      logger.error(`FFMPEG binary not found at ${config.FFMPEG_PATH}`);
      process.exit(1);
    }
  } else {
    logger.error(`No FFMPEG path defined in config.json`);
    process.exit(1);
  }

  if (config.FFPROBE_PATH) {
    const found = existsSync(config.FFPROBE_PATH);
    if (!found) {
      logger.error(`FFPROBE binary not found at ${config.FFPROBE_PATH}`);
      process.exit(1);
    }
  } else {
    logger.error(`No FFPROBE path defined in config.json`);
    process.exit(1);
  }
}
