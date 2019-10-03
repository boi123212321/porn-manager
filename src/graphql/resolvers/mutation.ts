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

interface HashMap<T> {
  [key: string]: T;
}

type AnyMap = HashMap<any>;

export default {
  updateLabel(parent, args: AnyMap) {
    const label = Label.getById(args.id);

    if (args.name)
      if (!args.name.length)
        throw new Error(`Invalid label name`);

    if (label) {
      label.name = args.name || label.name;
      label.aliases = args.aliases || label.aliases;

      label.aliases = label.aliases.filter(s => s && s.length);

      database.get('labels')
        .find({ id: label.id })
        .assign(label)
        .write();

      return label;
    }
    else {
      throw new Error(`Label ${args.id} not found`);
    }
  },

  removeLabel(parent, args: AnyMap) {
    const label = Label.getById(args.id);

    if (label) {
      Label.remove(label.id);

      Actor.filterLabel(label.id);
      Image.filterLabel(label.id);
      Scene.filterLabel(label.id);

      return true;
    }
    else {
      throw new Error(`Label ${args.id} not found`);
    }
  },

  setSceneLabels(parent, args: AnyMap) {
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

  setActorLabels(parent, args: AnyMap) {
    const actor = Actor.getById(args.id);

    for (const label of args.labels) {
      const labelInDb = Label.getById(label);

      if (!labelInDb)
        throw new Error(`Label ${label} not found`);
    }

    if (actor) {
      actor.labels = args.labels;
      database.get('actors')
        .find({ id: actor.id })
        .assign({ labels: args.labels })
        .write();
      return actor;
    }
    else {
      throw new Error(`Actor ${args.id} not found`);
    }
  },

  addScene(parent, args: AnyMap) {
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

  async uploadScene(parent, args: AnyMap) {
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

    const sourcePath = path.resolve(
      process.cwd(),
      `./library/scenes/${scene.id}${ext}`
    );
    scene.path = sourcePath;

    logger.LOG(`Getting file...`);

    const read = createReadStream() as ReadStream;
    const write = createWriteStream(sourcePath);

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

    for (let i = 0; i < thumbnailFiles.length; i++) {
      const file = thumbnailFiles[i];
      const image = new Image(`${sceneName} ${i}`, file.path, scene.id);
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
  addActor(parent, args: AnyMap) {
    const actor = new Actor(args.name, args.aliases)

    database
      .get('actors')
      .push(actor)
      .write();

    return actor;
  },
  addLabel(parent, args: AnyMap) {
    const label = new Label(args.name, args.aliases);

    database
      .get("labels")
      .push(label)
      .write();

    return label;
  },
}