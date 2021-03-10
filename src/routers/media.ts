import { Router } from "express";
import { existsSync } from "fs";
import path from "path";

import { getConfig } from "../config";
import Image from "../types/image";
import Scene from "../types/scene";
import { logger } from "../utils/logger";

const router = Router();

router.get("/scene/:scene", async (req, res, next) => {
  const scene = await Scene.getById(req.params.scene);

  if (scene && scene.path) {
    const resolved = path.resolve(scene.path);
    res.sendFile(resolved);
  } else next(404);
});

router.get("/image/path/:path", async (req, res) => {
  const pathParam = (req.query as Record<string, string>).path;
  if (!pathParam) return res.sendStatus(400);

  const img = await Image.getByPath(pathParam);

  if (img && img.path) {
    const resolved = path.resolve(img.path);
    if (!existsSync(resolved)) res.redirect("/assets/broken.png");
    else {
      res.sendFile(resolved);
    }
  } else {
    res.sendStatus(404);
  }
});

router.get("/image/:image", async (req, res) => {
  const image = await Image.getById(req.params.image);

  if (image && image.path) {
    const resolved = path.resolve(image.path);
    if (!existsSync(resolved)) res.redirect("/assets/broken.png");
    else {
      res.sendFile(resolved);
    }
  } else {
    res.redirect("/assets/broken.png");
  }
});

router.get("/image/:image/thumbnail", async (req, res) => {
  const image = await Image.getById(req.params.image);

  if (image && image.thumbPath) {
    const resolved = path.resolve(image.thumbPath);
    if (!existsSync(resolved)) {
      res.redirect("/assets/broken.png");
    } else {
      res.sendFile(resolved);
    }
  } else if (image) {
    const config = getConfig();
    logger.debug(`${req.params.image}'s thumbnail does not exist (yet)`);
    res.redirect(`/media/image/${image._id}?password=${config.auth.password}`);
  } else {
    res.redirect("/assets/broken.png");
  }
});

export default router;
