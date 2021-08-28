import axios from "axios";
import { green } from "chalk";
import { Presets, SingleBar } from "cli-progress";
import { createWriteStream, existsSync } from "fs";
import { Stream } from "stream";

import { logger } from "../utils/logger";
import { Dictionary } from "../utils/types";

function downloadSpeed(bytes: number, secs: number) {
  return bytes / secs;
}

/**
 *
 * @param url - the url to the file
 * @param file - path to save to
 * @returns false if a file already exists at the path, otherwise true
 */
export async function downloadFile(url: string, file: string): Promise<boolean> {
  if (existsSync(file)) {
    return false;
  }

  logger.info(`Downloading ${url} to ${file}...`);

  const downloadBar = new SingleBar(
    {
      format: `Fetching |${green(
        "{bar}"
      )}| {percentage}% | {loaded}/{totalSize} MB | Speed: {speed}kB/s`,
    },
    Presets.shades_classic
  );
  downloadBar.start(100, 0, {
    percentage: "0",
    loaded: 0,
    totalSize: 0,
    speed: "N/A",
  });

  const response = await axios({
    url: url,
    method: "GET",
    responseType: "stream",
  });
  const stream = response.data as Stream;

  const writer = createWriteStream(file);

  const start = +new Date();
  const totalSize = parseInt((<Dictionary<string>>response.headers)["content-length"]);
  let loaded = 0;

  stream.on("data", (data: Buffer) => {
    loaded += Buffer.byteLength(data);
    const percent = ((loaded / totalSize) * 100).toFixed(0);
    const bytesPerSec = downloadSpeed(loaded, (Date.now() - start) / 1000);
    downloadBar.update(parseInt(percent), {
      percentage: percent,
      loaded: (loaded / 1000 / 1000).toFixed(2),
      totalSize: (totalSize / 1000 / 1000).toFixed(2),
      speed: Math.round(bytesPerSec / 1000),
    });
  });

  stream.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", (err) => {
      logger.error(`Error while downloading ${url}`);
      downloadBar.stop();
      reject(err);
    });
  });

  downloadBar.stop();
  return true;
}
