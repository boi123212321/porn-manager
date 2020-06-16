import { Router } from "express";

import { imageCollection, sceneCollection } from "./database/index";
import * as logger from "./logger";
import { getHead, removeSceneFromQueue } from "./queue/processing";
import { indexImages } from "./search/image";
import { updateScenes } from "./search/scene";
import Image from "./types/image";
import Scene from "./types/scene";

const router = Router();

router.delete("/:id", async (req, res) => {
  await removeSceneFromQueue(req.params.id);
  res.json(null);
});

router.post("/:id", async (req, res) => {
  await removeSceneFromQueue(req.params.id);
  const scene = await Scene.getById(req.params.id);

  const reqBody = req.body as Record<string, unknown>;

  if (scene) {
    if (reqBody.scene) {
      Object.assign(scene, reqBody.scene);
      logger.log("Merging scene data:", reqBody.scene);
      await sceneCollection.upsert(req.params.id, scene);
      await updateScenes([scene]);
    }
    if (reqBody.images) {
      for (const image of <Image[]>reqBody.images) {
        logger.log("New image!", image);
        await imageCollection.upsert(image._id, image);
        await indexImages([image]);
        const actors = await Scene.getActors(scene);
        const labels = await Scene.getLabels(scene);
        await Image.setActors(
          image,
          actors.map((a) => a._id)
        );
        await Image.setLabels(
          image,
          labels.map((a) => a._id)
        );
      }
    }
    if (reqBody.thumbs) {
      for (const thumb of <Image[]>reqBody.thumbs) {
        logger.log("New thumbnail!", thumb);
        await imageCollection.upsert(thumb._id, thumb);
      }
    }
  }

  res.json(null);
});

router.get("/head", async (req, res) => {
  const queueHead = await getHead();
  if (!queueHead) return res.json(null);

  const scene = await Scene.getById(queueHead._id);
  if (!scene) return res.json(null);

  res.json(scene);
});

export default router;
