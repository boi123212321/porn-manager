import { readFileSync, existsSync, writeFileSync } from "fs";
import * as logger from "../logger";

let config: any;

const defaultConfig = {
  "FFMPEG_PATH": "",
  "FFPROBE_PATH": "",
  "THUMBNAIL_INTERVAL": 60
};

if (existsSync("config.json")) {
  config = JSON.parse(readFileSync("config.json", "utf-8"));

  let defaultOverride = false;
  for (const key in defaultConfig) {
    if (config[key] === undefined) {
      config[key] = defaultConfig[key];
      defaultOverride = true;
    }
  }

  if (defaultOverride) {
    writeFileSync("config.json", JSON.stringify(config), "utf-8");
  }
}
else {
  config = defaultConfig;
  writeFileSync("config.json", JSON.stringify(config), "utf-8");
  logger.WARN("Created config.json. Please edit.")
}

export default config;