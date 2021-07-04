import { Router } from "express";
import { existsSync } from "fs";
import path from "path";

import { getConfig } from "../config";
import Image from "../types/image";
import { logger } from "../utils/logger";
import sceneRouter from "./scene";

const router = Router();

router.use("/scene", sceneRouter);

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
    res.redirect(`/api/media/image/${image._id}?password=${config.auth.password}`);
  } else {
    res.redirect("/assets/broken.png");
  }
});

export default router;
