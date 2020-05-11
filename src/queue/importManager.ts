import * as logger from "../logger";
import { addImagePathToQueue } from "./image/imageQueue";
import { addVideoPathToQueue } from "./video/videoQueue";

export type onQueueEmptied = () => void;

let oldNumFoundVideoPaths = 0;
let numFoundVideoPaths = 0;

let oldNumFoundImagePaths = 0;
let numFoundImagePaths = 0;

/**
 * @param paths - the image and/or video paths to import
 */
export function importPaths(...paths: string[]) {
  importVideoPaths(...paths);
  importImagePaths(...paths);
}

/**
 * @param paths - the video paths to import
 */
export function importVideoPaths(...addedPaths: string[]) {
  for (const addedPath of addedPaths) {
    logger.log(`[importManager]: handling new video path ${addedPath}`);

    numFoundVideoPaths++;
    addVideoPathToQueue(addedPath);
  }
}

/**
 * @param paths - the image paths to import
 */
export function importImagePaths(...addedPaths: string[]) {
  for (const addedPath of addedPaths) {
    logger.log(`[importManager]: handling new image path ${addedPath}`);

    numFoundImagePaths++;
    addImagePathToQueue(addedPath);
  }
}

export function resetFoundVideosCount() {
  oldNumFoundVideoPaths = numFoundVideoPaths;
  numFoundVideoPaths = 0;
}

export function getFoundVideosCount() {
  return numFoundVideoPaths;
}

export function getOldFoundVideosCount() {
  return oldNumFoundVideoPaths;
}

export function resetFoundImagesCount() {
  oldNumFoundImagePaths = numFoundVideoPaths;
  numFoundImagePaths = 0;
}

export function getFoundImagesCount() {
  return numFoundImagePaths;
}

export function getOldFoundImagesCount() {
  return oldNumFoundImagePaths;
}
