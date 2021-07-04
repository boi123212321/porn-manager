import Jimp from "jimp";
import { basename } from "path";

import { getConfig } from "../config";
import { imageCollection } from "../database";
import { extractActors, extractLabels, extractScenes } from "../extractor";
import { indexImages } from "../search/image";
import Image from "../types/image";
import Scene from "../types/scene";
import { walk } from "../utils/fs/async";
import { handleError, logger } from "../utils/logger";
import { libraryPath } from "../utils/path";
import ora = require("ora");

const VIDEO_EXTENSIONS = [
  ".m4v",
  ".mp4",
  ".mov",
  ".wmv",
  ".avi",
  ".mpg",
  ".mpeg",
  ".rmvb",
  ".rm",
  ".flv",
  ".asf",
  ".mkv",
  ".webm",
];

export async function checkVideoFolders(): Promise<void> {
  const config = getConfig();

  logger.warn("Scanning video folders...");

  const unknownVideos = [] as string[];

  if (config.scan.excludeFiles.length) {
    logger.debug(`Will ignore files: ${JSON.stringify(config.scan.excludeFiles)}.`);
  }

  for (const folder of config.import.videos) {
    logger.verbose(`Scanning ${folder} for videos...`);
    let numFiles = 0;
    const loader = ora(`Scanned ${numFiles} videos`).start();

    await walk({
      dir: folder,
      exclude: config.scan.excludeFiles,
      extensions: VIDEO_EXTENSIONS,
      cb: async (path) => {
        loader.text = `Scanned ${++numFiles} videos`;
        if (basename(path).startsWith(".")) {
          logger.debug(`Ignoring file ${path}`);
        } else {
          logger.debug(`Found matching file ${path}`);
          const existingScene = await Scene.getByPath(path);
          logger.debug(`Scene with that path exists already: ${!!existingScene}`);
          if (!existingScene) unknownVideos.push(path);
        }
      },
    });

    loader.succeed(`${folder} done (${numFiles} videos)`);
  }

  logger.info(`Found ${unknownVideos.length} new videos.`);

  for (const videoPath of unknownVideos) {
    try {
      await Scene.onImport(videoPath);
    } catch (error) {
      handleError(`Error importing ${videoPath}`, error);
    }
  }

  logger.info(`Queued ${unknownVideos.length} new videos for further processing.`);
}

async function imageWithPathExists(path: string) {
  const image = await Image.getByPath(path);
  return !!image;
}

async function processImage(imagePath: string, readImage = true, generateThumb = true) {
  try {
    const imageName = basename(imagePath);
    const image = new Image(imageName);
    image.path = imagePath;

    let jimpImage: Jimp | undefined;
    if (readImage) {
      jimpImage = await Jimp.read(imagePath);
      image.meta.dimensions.width = jimpImage.bitmap.width;
      image.meta.dimensions.height = jimpImage.bitmap.height;
      image.hash = jimpImage.hash();
    }

    // Extract scene
    const extractedScenes = await extractScenes(imagePath);
    logger.verbose(`Found ${extractedScenes.length} scenes in image path.`);
    image.scene = extractedScenes[0] || null;

    // Extract actors
    const extractedActors = await extractActors(imagePath);
    logger.verbose(`Found ${extractedActors.length} actors in image path.`);
    await Image.setActors(image, [...new Set(extractedActors)]);

    // Extract labels
    const extractedLabels = await extractLabels(imagePath);
    logger.verbose(`Found ${extractedLabels.length} labels in image path.`);
    await Image.setLabels(image, [...new Set(extractedLabels)]);

    if (generateThumb) {
      if (!jimpImage) {
        jimpImage = await Jimp.read(imagePath);
      }
      // Small image thumbnail
      logger.verbose("Creating image thumbnail");
      if (jimpImage.bitmap.width > jimpImage.bitmap.height && jimpImage.bitmap.width > 320) {
        jimpImage.resize(320, Jimp.AUTO);
      } else if (jimpImage.bitmap.height > 320) {
        jimpImage.resize(Jimp.AUTO, 320);
      }
      image.thumbPath = libraryPath(`thumbnails/images/${image._id}.jpg`);
      await jimpImage.writeAsync(image.thumbPath);
    }

    await imageCollection.upsert(image._id, image);
    await indexImages([image]);
  } catch (error) {
    logger.error(error);
    logger.error(`Failed to add image '${imagePath}'.`);
  }
}

export async function checkImageFolders(): Promise<void> {
  const config = getConfig();

  logger.info("Scanning image folders...");

  let numAddedImages = 0;

  if (!config.processing.readImagesOnImport) {
    logger.verbose("Reading images on import is disabled.");
  }

  if (config.scan.excludeFiles.length) {
    logger.debug(`Will ignore files: ${JSON.stringify(config.scan.excludeFiles)}.`);
  }

  for (const folder of config.import.images) {
    logger.verbose(`Scanning ${folder} for images...`);
    let numFiles = 0;
    const loader = ora(`Scanned ${numFiles} images`).start();

    await walk({
      dir: folder,
      extensions: [".jpg", ".jpeg", ".png", ".gif"],
      exclude: config.scan.excludeFiles,
      cb: async (path) => {
        loader.text = `Scanned ${++numFiles} images`;
        if (basename(path).startsWith(".")) return;

        if (!(await imageWithPathExists(path))) {
          await processImage(
            path,
            config.processing.readImagesOnImport,
            config.processing.generateImageThumbnails
          );
          numAddedImages++;
          logger.verbose(`Added image '${path}'`);
        } else {
          logger.debug(`Image '${path}' already exists`);
        }
      },
    });

    loader.succeed(`${folder} done`);
  }

  logger.info(`Added ${numAddedImages} new images`);
}
