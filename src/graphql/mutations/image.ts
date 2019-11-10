import { database } from "../../database";
import Actor from "../../types/actor";
import Label from "../../types/label";
import Scene from "../../types/scene";
import Image from "../../types/image";
import { ReadStream, createWriteStream, statSync } from "fs";
import path, { extname } from "path";
import * as logger from "../../logger";
import { extractLabels, extractActors } from "../../extractor";
import { Dictionary} from "../../types/utility";

export default {
  async uploadImage(parent, args: Dictionary<any>) {
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

    if (args.scene) {
      const sceneInDb = Scene.getById(args.scene);

      if (!sceneInDb)
        throw new Error(`Scene ${args.scene} not found`);
    }

    const { filename, mimetype, createReadStream } = await args.file;
    const ext = extname(filename);
    const fileNameWithoutExtension = filename.split(".")[0];

    let imageName = fileNameWithoutExtension;

    if (args.name)
      imageName = args.name;

    if (!mimetype.includes("image/"))
      throw new Error("Invalid file");

    const image = new Image(imageName);

    const sourcePath = path.resolve(
      process.cwd(),
      `./library/images/${image.id}${ext}`
    );
    image.path = sourcePath;

    logger.LOG(`Getting file...`);

    const read = createReadStream() as ReadStream;
    const write = createWriteStream(sourcePath);

    const pipe = read.pipe(write);

    await new Promise((resolve, reject) => {
      pipe.on("close", () => resolve());
    });

    const { size } = statSync(sourcePath);
    image.meta.size = size;

    // TODO: extract image dimensions

    // File written, now process
    logger.SUCCESS(`SUCCESS: File written to ${sourcePath}.`);

    if (args.actors) {
      image.actors = args.actors;
    }

    // Extract actors
    const extractedActors = extractActors(image.name);
    logger.LOG(`Found ${extractedActors.length} actors in scene title.`)
    image.actors.push(...extractedActors);
    image.actors = [...new Set(image.actors)];

    if (args.labels) {
      image.labels = args.labels;
    }

    // Extract labels
    const extractedLabels = extractLabels(image.name);
    logger.LOG(`Found ${extractedLabels.length} labels in image title.`)
    image.labels.push(...extractedLabels);
    image.labels = [...new Set(image.labels)];

    database
      .get('images')
      .push(image)
      .write();

    // Done

    logger.SUCCESS(`SUCCESS: Image '${imageName}' done.`);

    return image;
  },

  setImageFavorite(parent, args: Dictionary<any>) {
    const image = Image.getById(args.id);

    if (image) {
      image.favorite = args.bool;
      database.get('images')
        .find({ id: image.id })
        .assign({ favorite: args.bool })
        .write();
      return image;
    }
    else {
      throw new Error(`Image ${args.id} not found`);
    }
  },

  setImageBookmark(parent, args: Dictionary<any>) {
    const image = Image.getById(args.id);

    if (image) {
      image.bookmark = args.bool;
      database.get('images')
        .find({ id: image.id })
        .assign({ bookmark: args.bool })
        .write();
      return image;
    }
    else {
      throw new Error(`Image ${args.id} not found`);
    }
  },

  setImageName(parent, args: Dictionary<any>) {
    const image = Image.getById(args.id);

    if (image) {
      image.name = args.name;
      database.get('images')
        .find({ id: image.id })
        .assign({ name: args.name })
        .write();
      return image;
    }
    else {
      throw new Error(`Image ${args.id} not found`);
    }
  },

  setImageRating(parent, args: Dictionary<any>) {
    const image = Image.getById(args.id);

    if (image) {
      image.rating = args.rating;
      database.get('images')
        .find({ id: image.id })
        .assign({ rating: args.rating })
        .write();
      return image;
    }
    else {
      throw new Error(`Image ${args.id} not found`);
    }
  },

  setImageLabels(parent, args: Dictionary<any>) {
    const image = Image.getById(args.id);

    for (const label of args.labels) {
      const labelInDb = Label.getById(label);

      if (!labelInDb)
        throw new Error(`Label ${label} not found`);
    }

    if (image) {
      image.labels = args.labels;
      database.get('images')
        .find({ id: image.id })
        .assign({ labels: args.labels })
        .write();
      return image;
    }
    else {
      throw new Error(`Image ${args.id} not found`);
    }
  },

  setImageActors(parent, args: Dictionary<any>) {
    const image = Scene.getById(args.id);

    for (const actor of args.actors) {
      const actorInDb = Label.getById(actor);

      if (!actorInDb)
        throw new Error(`Actor ${actor} not found`);
    }

    if (image) {
      image.actors = args.actors;
      database.get('images')
        .find({ id: image.id })
        .assign({ streamLinks: args.actors })
        .write();
      return image;
    }
    else {
      throw new Error(`Image ${args.id} not found`);
    }
  },

  removeImage(parent, args: Dictionary<any>) {
    const image = Image.getById(args.id);

    if (image) {
      Image.remove(image.id);
      return true;
    }
    else {
      throw new Error(`Image ${args.id} not found`);
    }
  },
}