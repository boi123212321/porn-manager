import { database } from "../../database";
import Actor from "../../types/actor";
import Label from "../../types/label";
import { ReadStream, createWriteStream, statSync, existsSync } from "fs";
import path, { extname } from "path";
import Scene from "../../types/scene";
import ffmpeg from "fluent-ffmpeg";
import * as logger from "../../logger";
import Image from "../../types/image";
import config from "../../config";
import { extractLabels, extractActors } from "../../extractor";
import { Dictionary, isValidUrl, libraryPath } from "../../types/utility";

export default {
  addScene(parent, args: Dictionary<any>) {
    for (const actor of args.actors || []) {
      const actorInDb = Actor.getById(actor);

      if (!actorInDb)
        throw new Error(`Actor ${actor} not found`);
    }

    for (const label of args.labels || []) {
      const labelInDb = Label.getById(label);

      if (!labelInDb)
        throw new Error(`Label ${label} not found`);
    }

    const sceneName = args.name;
    const scene = new Scene(sceneName);

    if (args.actors) {
      scene.actors = args.actors;
    }

    // Extract actors
    const extractedActors = extractActors(scene.name);
    logger.LOG(`Found ${extractedActors.length} actors in scene title.`)
    scene.actors.push(...extractedActors);
    scene.actors = [...new Set(scene.actors)];

    if (args.labels) {
      scene.labels = args.labels;
    }

    // Extract labels
    const extractedLabels = extractLabels(scene.name);
    logger.LOG(`Found ${extractedLabels.length} labels in scene title.`)
    scene.labels.push(...extractedLabels);
    scene.labels = [...new Set(scene.labels)];

    database
      .get('scenes')
      .push(scene)
      .write();

    logger.SUCCESS(`SUCCESS: Scene '${sceneName}' done.`);
    return scene;
  },

  async uploadScene(parent, args: Dictionary<any>) {
    for (const actor of args.actors || []) {
      const actorInDb = Actor.getById(actor);

      if (!actorInDb)
        throw new Error(`Actor ${actor} not found`);
    }

    for (const label of args.labels || []) {
      const labelInDb = Label.getById(label);

      if (!labelInDb)
        throw new Error(`Label ${label} not found`);
    }

    const { filename, mimetype, createReadStream } = await args.file;
    const ext = extname(filename);
    const fileNameWithoutExtension = filename.split(".")[0];

    let sceneName = fileNameWithoutExtension;

    if (args.name)
      sceneName = args.name;

    if (!mimetype.includes("video/"))
      throw new Error("Invalid file");

    if (!existsSync(config.FFMPEG_PATH)) {
      logger.ERROR("ERROR: FFMPEG not found")
      throw new Error("FFMPEG not found");
    }

    if (!existsSync(config.FFPROBE_PATH)) {
      logger.ERROR("ERROR: FFPROBE not found")
      throw new Error("FFPROBE not found");
    }

    const scene = new Scene(sceneName);

    const sourcePath =  `scenes/${scene.id}${ext}`;
    scene.path = sourcePath;

    logger.LOG(`Getting file...`);

    const read = createReadStream() as ReadStream;
    const write = createWriteStream(
      libraryPath(sourcePath)
    );

    const pipe = read.pipe(write);

    await new Promise((resolve, reject) => {
      pipe.on("close", () => resolve());
    });

    // File written, now process
    logger.SUCCESS(`SUCCESS: File written to ${sourcePath}.`);

    await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(sourcePath, (err, data) => {
        const meta = data.streams[0];
        const { size } = statSync(sourcePath);

        if (meta) {
          scene.meta.dimensions = {
            width: meta.width,
            height: meta.height,
          }
          scene.meta.duration = parseInt(meta.duration);
        }
        else {
          logger.WARN("WARN: Could not get video meta data.");
        }

        scene.meta.size = size;
        resolve();
      })
    })

    if (args.actors) {
      scene.actors = args.actors;
    }

    // Extract actors
    const extractedActors = extractActors(scene.name);
    logger.LOG(`Found ${extractedActors.length} actors in scene title.`)
    scene.actors.push(...extractedActors);
    scene.actors = [...new Set(scene.actors)];

    if (args.labels) {
      scene.labels = args.labels;
    }

    // Extract labels
    const extractedLabels = extractLabels(scene.name);
    logger.LOG(`Found ${extractedLabels.length} labels in scene title.`)
    scene.labels.push(...extractedLabels);
    scene.labels = [...new Set(scene.labels)];

    const thumbnailFiles = await scene.generateThumbnails();
    thumbnailFiles
    for (let i = 0; i < thumbnailFiles.length; i++) {
      const file = thumbnailFiles[i];
      const image = new Image(`${sceneName} ${i + 1}`);
      image.path = file.path;
      image.scene = scene.id;
      image.meta.size = file.size;
      image.actors = scene.actors;
      image.labels = scene.labels;
      database
        .get('images')
        .push(image)
        .write();
    }

    logger.SUCCESS(`SUCCESS: Created ${thumbnailFiles.length} images.`);

    database
      .get('scenes')
      .push(scene)
      .write();

    // Done

    logger.SUCCESS(`SUCCESS: Scene '${sceneName}' done.`);

    return scene;
  },

  setSceneName(parent, args: Dictionary<any>) {
    const scenes = Scene.getById(args.id);

    if (scenes) {
      scenes.name = args.name;
      database.get('scenes')
        .find({ id: scenes.id })
        .assign({ name: args.name })
        .write();
      return scenes;
    }
    else {
      throw new Error(`Scene ${args.id} not found`);
    }
  },

  setSceneRating(parent, args: Dictionary<any>) {
    const scene = Scene.getById(args.id);

    if (scene) {
      scene.rating = args.rating;
      database.get('scenes')
        .find({ id: scene.id })
        .assign({ rating: args.rating })
        .write();
      return scene;
    }
    else {
      throw new Error(`Scene ${args.id} not found`);
    }
  },

  removeScene(parent, args: Dictionary<any>) {
    const scene = Scene.getById(args.id);

    if (scene) {
      Scene.remove(scene.id);
      return true;
    }
    else {
      throw new Error(`Scene ${args.id} not found`);
    }
  },

  setSceneLabels(parent, args: Dictionary<any>) {
    const scene = Scene.getById(args.id);

    for (const label of args.labels) {
      const labelInDb = Label.getById(label);

      if (!labelInDb)
        throw new Error(`Label ${label} not found`);
    }

    if (scene) {
      scene.labels = args.labels;
      database.get('scenes')
        .find({ id: scene.id })
        .assign({ labels: args.labels })
        .write();
      return scene;
    }
    else {
      throw new Error(`Scene ${args.id} not found`);
    }
  },

  setSceneStreamLinks(parent, args: Dictionary<any>) {
    const scene = Scene.getById(args.id);

    for (const url of args.urls) {
      if (!isValidUrl(url))
        throw new Error(`Link ${url} is invalid`);
    }

    if (scene) {
      scene.streamLinks = args.urls;
      database.get('scenes')
        .find({ id: scene.id })
        .assign({ streamLinks: args.urls })
        .write();
      return scene;
    }
    else {
      throw new Error(`Scene ${args.id} not found`);
    }
  },

  setSceneActors(parent, args: Dictionary<any>) {
    const scene = Scene.getById(args.id);

    for (const actor of args.actors) {
      const actorInDb = Label.getById(actor);

      if (!actorInDb)
        throw new Error(`Actor ${actor} not found`);
    }

    if (scene) {
      scene.actors = args.actors;
      database.get('scenes')
        .find({ id: scene.id })
        .assign({ streamLinks: args.actors })
        .write();
      return scene;
    }
    else {
      throw new Error(`Scene ${args.id} not found`);
    }
  },

  setSceneFavorite(parent, args: Dictionary<any>) {
    const scene = Scene.getById(args.id);

    if (scene) {
      scene.favorite = args.bool;
      database.get('scenes')
        .find({ id: scene.id })
        .assign({ favorite: args.bool })
        .write();
      return scene;
    }
    else {
      throw new Error(`Scene ${args.id} not found`);
    }
  },

  setSceneBookmark(parent, args: Dictionary<any>) {
    const scene = Scene.getById(args.id);

    if (scene) {
      scene.bookmark = args.bool;
      database.get('scenes')
        .find({ id: scene.id })
        .assign({ bookmark: args.bool })
        .write();
      return scene;
    }
    else {
      throw new Error(`Scene ${args.id} not found`);
    }
  },

  setSceneThumbnail(parent, args: Dictionary<any>) {
    const scene = Scene.getById(args.id);

    const imageInDb = Image.getById(args.image);

    if (!imageInDb)
      throw new Error(`Image ${args.image} not found`);

    if (scene) {
      scene.thumbnail = args.image;
      database.get('scenes')
        .find({ id: scene.id })
        .assign({ thumbnail: args.image })
        .write();
      return scene;
    }
    else {
      throw new Error(`Scene ${args.id} not found`);
    }
  }
}