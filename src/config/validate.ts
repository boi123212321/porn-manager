import { existsAsync } from "../fs/async";
import * as logger from "../logger";
import { IConfig } from "../config/index";

export async function validateFFMPEGPaths(config: IConfig) {
  if (config.FFMPEG_PATH) {
    const found = await existsAsync(config.FFMPEG_PATH);
    if (!found) {
      logger.error(`FFMPEG binary not found at ${config.FFMPEG_PATH}`);
      process.exit(1);
    }
  } else {
    logger.error(`No FFMPEG path defined in config.json`);
    process.exit(1);
  }

  if (config.FFPROBE_PATH) {
    const found = await existsAsync(config.FFPROBE_PATH);
    if (!found) {
      logger.error(`FFPROBE binary not found at ${config.FFPROBE_PATH}`);
      process.exit(1);
    }
  } else {
    logger.error(`No FFPROBE path defined in config.json`);
    process.exit(1);
  }
}
