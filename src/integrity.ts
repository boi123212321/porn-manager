import { existsAsync } from "./fs/async";
import Scene from "./types/scene";
import Image from "./types/image";
import * as database from "./database/index";
import * as logger from "./logger/index";

export async function checkSceneSources() {
  logger.log("Checking scene sources...");
  const scenes = await Scene.getAll();

  for (const scene of scenes) {
    if (scene.path != null) {
      const sourceExists = await existsAsync(scene.path);

      if (!sourceExists) {
        await database.update(
          database.store.scenes,
          { _id: scene._id },
          { $set: { path: null } }
        );
        logger.log("Removed file reference from " + scene._id);
      }
    }
  }
  logger.log("Scene source check done.");
}

export async function checkImageSources() {
  logger.log("Checking image sources...");
  const images = await Image.getAll();

  for (const image of images) {
    if (image.path != null) {
      const sourceExists = await existsAsync(image.path);

      if (!sourceExists) {
        await database.remove(database.store.images, { _id: image._id });
        logger.log("Removed image " + image._id);
      }
    } else {
      await database.remove(database.store.images, { _id: image._id });
      logger.log("Removed image " + image._id);
    }
  }
  logger.log("Image source check done.");
}
