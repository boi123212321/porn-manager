import { queue } from "async";

import * as logger from "../../logger";
import Scene from "../../types/scene";
import { isImportableVideo } from "./utility";

const onVideoQueueEmptiedListeners: (() => void)[] = [];

export function onVideoQueueEmptied(fn: () => void) {
  onVideoQueueEmptiedListeners.push(fn);
}

const videoProcessingQueue = queue(importVideoFromPath, 1);
videoProcessingQueue.drain(onImportQueueEmptied);
videoProcessingQueue.error(onImportQueueError);

/**
 * Handles a new path in the video folders.
 * If it is a supported video, adds it to the processing queue
 *
 * @param path - the path newly added to the watch video
 * folders
 */
export async function addVideoPathToQueue(path: string) {
  if (!isImportableVideo(path)) {
    logger.log(`[videoQueue]: Ignoring file ${path}`);
    return;
  }

  logger.log(`[videoQueue]: Found matching file ${path}`);

  const existingScene = await Scene.getSceneByPath(path);
  logger.log(
    "[videoQueue]: Scene with that path exists already ?: " + !!existingScene
  );

  if (!existingScene) {
    videoProcessingQueue.push(path);
    logger.log(`[videoQueue]: Added video to processing queue '${path}'.`);
  }
}

/**
 * Processes a path in the queue by importing the scene
 *
 * @param path - the path to process
 * @param callback - callback to execute once the path is processed
 */
async function importVideoFromPath(path: string, callback: () => void) {
  try {
    await Scene.onImport(path);
  } catch (error) {
    logger.log(error.stack);
    logger.error("[videoQueue]:Error when importing " + path);
    logger.warn(error.message);
  }

  callback();
}

function onImportQueueEmptied() {
  logger.log("[videoQueue]: Processing queue empty");

  for (const listener of onVideoQueueEmptiedListeners) {
    listener();
  }
}

function onImportQueueError(error: Error, task: string) {
  logger.error("[videoQueue]: path processing encountered an error");
  logger.error(error);
}

export function getVideoImportQueueLength() {
  return videoProcessingQueue.length();
}

export function isVideoImportQueueRunning() {
  return videoProcessingQueue.running();
}
