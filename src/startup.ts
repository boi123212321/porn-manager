import Jimp from "jimp";

import args from "./args";
import { deleteIzzy, ensureIzzyExists, izzyVersion, resetIzzy, spawnIzzy } from "./binaries/izzy";
import { checkConfig, findAndLoadConfig, getConfig } from "./config";
import { IConfig } from "./config/schema";
import { imageCollection, loadImageStore } from "./database";
import { loadEnv } from "./env";
import { applyExitHooks } from "./exit";
import { queueLoop } from "./queue_loop";
import { isBlacklisted } from "./search/image";
import startServer from "./server";
import Image from "./types/image";
import { handleError, logger } from "./utils/logger";
import { printMaxMemory } from "./utils/mem";
import { libraryPath } from "./utils/path";

function skipImage(image: Image) {
  if (!image.path) {
    logger.warn(`Image ${image._id}: no path`);
    return true;
  }
  if (image.thumbPath) {
    return true;
  }
  if (isBlacklisted(image.name)) {
    return true;
  }
  return false;
}

export async function startup() {
  loadEnv();

  logger.debug("Startup...");
  logger.debug(args);

  printMaxMemory();

  let config: IConfig;

  try {
    const shouldRestart = await findAndLoadConfig();
    if (shouldRestart) {
      process.exit(0);
    }

    config = getConfig();
    checkConfig(config);
  } catch (err) {
    return handleError(`Error during startup`, err, true);
  }

  if (args["generate-image-thumbnails"]) {
    if (await izzyVersion()) {
      logger.info("Izzy already running, clearing...");
      await resetIzzy();
    } else {
      await spawnIzzy();
    }
    await loadImageStore();
    await imageCollection.compact();
    applyExitHooks();

    const images = await Image.getAll();

    let i = 0;
    let amountImagesToBeProcessed = 0;

    images.forEach((image) => {
      if (!skipImage(image)) {
        amountImagesToBeProcessed++;
      }
    });

    for (const image of images) {
      try {
        if (skipImage(image)) {
          continue;
        }
        i++;
        const jimpImage = await Jimp.read(image.path!);
        // Small image thumbnail
        logger.verbose(
          `${i}/${amountImagesToBeProcessed}: Creating image thumbnail for ${image._id}`
        );
        if (jimpImage.bitmap.width > jimpImage.bitmap.height && jimpImage.bitmap.width > 320) {
          jimpImage.resize(320, Jimp.AUTO);
        } else if (jimpImage.bitmap.height > 320) {
          jimpImage.resize(Jimp.AUTO, 320);
        }
        image.thumbPath = libraryPath(`thumbnails/images/${image._id}.jpg`);
        await jimpImage.writeAsync(image.thumbPath);
        await imageCollection.upsert(image._id, image);
      } catch (error) {
        handleError(`${image._id} (${image.path}) failed`, error);
      }
    }
    process.exit(0);
  }

  if (args["process-queue"]) {
    await queueLoop(config);
  } else {
    if (args["update-izzy"]) {
      await deleteIzzy();
    }

    try {
      let downloadedBins = 0;
      downloadedBins += await ensureIzzyExists();
      if (downloadedBins > 0) {
        logger.warn("Binaries downloaded. Please restart.");
        process.exit(0);
      }
      applyExitHooks();
      await startServer();
    } catch (err) {
      handleError(`Startup error`, err, true);
    }
  }
}
