import * as database from "../database";
import { generateHash } from "../hash";
import Actor from "./actor";
import Label from "./label";
import * as logger from "../logger/index";
import { unlinkAsync } from "../fs/async";
import { mapAsync } from "./utility";

export class ImageDimensions {
  width: number | null = null;
  height: number | null = null;
}

export class ImageMeta {
  size: number | null = null;
  dimensions = new ImageDimensions();
}

export default class Image {
  _id: string;
  name: string;
  path: string | null = null;
  scene: string | null = null;
  addedOn = +new Date();
  favorite: boolean = false;
  bookmark: boolean = false;
  rating: number = 0;
  customFields: any = {};
  labels: string[] = [];
  meta = new ImageMeta();
  actors: string[] = [];
  studio: string | null = null;
  hash: string | null = null;

  static async remove(image: Image) {
    await database.remove(database.store.images, { _id: image._id });
    try {
      if (image.path) await unlinkAsync(image.path);
    } catch (error) {
      logger.warn("Could not delete source file for image " + image._id);
    }
  }

  static async filterStudio(studioId: string) {
    await database.update(
      database.store.images,
      { studio: studioId },
      { $set: { studio: null } }
    );
  }

  static async filterScene(scene: string) {
    await database.update(
      database.store.images,
      { scene },
      { $set: { scene: null } }
    );
  }

  static async filterActor(actor: string) {
    await database.update(
      database.store.images,
      {},
      { $pull: { actors: actor } }
    );
  }

  static async filterLabel(label: string) {
    await database.update(
      database.store.images,
      {},
      { $pull: { labels: label } }
    );
  }

  static async getByScene(id: string) {
    return (await database.find(database.store.images, {
      scenes: id
    })) as Image[];
  }

  static async getByActor(id: string) {
    return (await database.find(database.store.images, {
      actors: id
    })) as Image[];
  }

  static async getById(_id: string) {
    return (await database.findOne(database.store.images, {
      _id
    })) as Image | null;
  }

  static async getAll() {
    return (await database.find(database.store.images, {})) as Image[];
  }

  static async getActors(image: Image) {
    return (await mapAsync(image.actors, Actor.getById)).filter(
      Boolean
    ) as Actor[];
  }

  static async getLabels(image: Image) {
    return (await mapAsync(image.labels, Label.getById)).filter(
      Boolean
    ) as Label[];
  }

  static async getImageByPath(path: string) {
    return (await database.findOne(database.store.images, {
      path
    })) as Image | null;
  }

  constructor(name: string) {
    this._id = generateHash();
    this.name = name.trim();
  }
}
