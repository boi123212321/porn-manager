import ora = require("ora");

import { getConfig } from "../../config";
import { imageCollection, sceneCollection } from "../../database";
import { statAsync, walk } from "../../fs/async";
import * as logger from "../../logger";
import { indexImages } from "../../search/image";
import Image from "../../types/image";
import Scene from "../../types/scene";
import {
  SUPPORTED_IMAGE_EXTENSIONS,
  SUPPORTED_VIDEO_EXTENSIONS,
} from "../constants";
import {
  getFoundImagesCount,
  importImagePaths,
  importVideoPaths,
  resetFoundImagesCount,
} from "../importManager";

export async function checkVideoFolders() {
  const config = getConfig();

  const unknownVideos = [] as string[];

  if (config.EXCLUDE_FILES.length)
    logger.log(`Will ignore files: ${config.EXCLUDE_FILES}.`);

  for (const folder of config.VIDEO_PATHS) {
    logger.message(`Scanning ${folder} for videos...`);
    let numFolderFiles = 0;
    const loader = ora(`Scanned ${numFolderFiles} videos`).start();

    await walk(folder, SUPPORTED_VIDEO_EXTENSIONS, async (path) => {
      loader.text = `Scanned ${++numFolderFiles} videos`;
      unknownVideos.push(path);
    });

    loader.succeed(`${folder} done (${numFolderFiles} videos)`);
  }

  logger.log(`Found ${unknownVideos.length} new videos.`);

  logger.warn(
    `Queued ${unknownVideos.length} new videos for further processing.`
  );

  importVideoPaths(...unknownVideos);
}

export async function checkImageFolders() {
  const config = getConfig();

  logger.log("Checking image folders...");

  resetFoundImagesCount();

  if (!config.READ_IMAGES_ON_IMPORT)
    logger.warn("Reading images on import is disabled.");

  if (config.EXCLUDE_FILES.length)
    logger.log(`Will ignore files: ${config.EXCLUDE_FILES}.`);

  for (const folder of config.IMAGE_PATHS) {
    logger.message(`Scanning ${folder} for images...`);
    let numFolderFiles = 0;
    const loader = ora(`Scanned ${numFolderFiles} images`).start();

    await walk(folder, SUPPORTED_IMAGE_EXTENSIONS, async (path) => {
      loader.text = `Scanned ${++numFolderFiles} images`;
      importImagePaths(path);
    });

    loader.succeed(`${folder} done (${numFolderFiles} images)`);
  }

  logger.warn(`Added ${getFoundImagesCount()} new images`);
}
export async function checkPreviews() {
  const config = getConfig();

  if (!config.GENERATE_PREVIEWS) {
    logger.warn(
      "Not generating previews because GENERATE_PREVIEWS is disabled."
    );
    return;
  }

  const scenes = await sceneCollection.query("preview-index", null);

  logger.log(`Generating previews for ${scenes.length} scenes...`);

  for (const scene of scenes) {
    if (scene.path) {
      const loader = ora("Generating previews...").start();

      try {
        let preview = await Scene.generatePreview(scene);

        if (preview) {
          let image = new Image(scene.name + " (preview)");
          const stats = await statAsync(preview);
          image.path = preview;
          image.scene = scene._id;
          image.meta.size = stats.size;

          await imageCollection.upsert(image._id, image);
          // await database.insert(database.store.images, image);
          await indexImages([image]);

          scene.thumbnail = image._id;
          await sceneCollection.upsert(scene._id, scene);

          loader.succeed("Generated preview for " + scene._id);
        } else {
          loader.fail(`Error generating preview.`);
        }
      } catch (error) {
        logger.error(error);
        loader.fail(`Error generating preview.`);
      }
    }
  }
}
