import { readFileSync, existsSync } from "fs";

let config: any;

if (existsSync("config.json")) {
  config = JSON.parse(readFileSync("config.json", "utf-8"))
}
else {
  config = {
    "FFMPEG_PATH": "__SET__HERE__",
    "FFPROBE_PATH": "__SET__HERE__",
    "THUMBNAIL_INTERVAL": 60
  };
}

export default config;