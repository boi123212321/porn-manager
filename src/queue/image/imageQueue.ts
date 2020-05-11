import { queue } from "async";

import { getConfig } from "../../config";
import * as logger from "../../logger";
import {
  imageWithPathExists,
  isImportableImage,
  processImage,
} from "./utility";

const onImageQueueEmptiedListeners: (() => void)[] = [];

export function onImageQueueEmptied(fn: () => void) {
  onImageQueueEmptiedListeners.push(fn);
}

const imageProcessingQueue = queue(importImageFromPath, 1);
imageProcessingQueue.drain(onImportQueueEmptied);
imageProcessingQueue.error(onImportQueueError);

/**
 * Processes a path in the queue by importing the image
 *
 * @param path - the path to process
 * @param callback - callback to execute once the path is processed
 */
async function importImageFromPath(imagePath: string, callback: () => void) {
  try {
    const config = getConfig();
    await processImage(imagePath, config.READ_IMAGES_ON_IMPORT);
  } catch (error) {
    logger.log(error.stack);
    logger.error("[imageQueue]: Error when importing " + imagePath);
    logger.warn(error.message);
  }

  callback();
}

function onImportQueueEmptied() {
  logger.log("[imageQueue]: Processing queue empty");

  for (const listener of onImageQueueEmptiedListeners) {
    listener();
  }
}

function onImportQueueError(error: Error, task: string) {
  logger.error("[imageQueue]: path processing encountered an error");
  logger.error(error);
}

/**
 * Handles a new path in the image folders.
 * If it is a supported image, adds it to the processing queue
 *
 * @param path - the path newly added to the watch image
 * folders
 */
export async function addImagePathToQueue(path: string) {
  if (!isImportableImage(path)) {
    logger.log(`[imageQueue]: Ignoring file ${path}`);
    return;
  }

  logger.log(`[imageQueue]: Found matching file ${path}`);

  const existingImage = await imageWithPathExists(path);
  logger.log(
    "[imageQueue]: Scene with that path exists already ?: " + !!existingImage
  );

  if (!existingImage) {
    imageProcessingQueue.push(path);
    logger.log(`[imageQueue]: Added image to processing queue '${path}'.`);
  }
}

export function getImageImportQueueLength() {
  return imageProcessingQueue.length();
}

export function isImageImportQueueRunning() {
  return imageProcessingQueue.running();
}
