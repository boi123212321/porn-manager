import * as database from "../database";
import { generateHash } from "../hash";
import Label from "./label";
import Actor from "./actor";
import Scene from "./scene";
import Movie from "./movie";

export default class Studio {
  _id: string;
  name: string;
  description: string | null = null;
  thumbnail: string | null = null;
  addedOn: number = +new Date();
  favorite: boolean = false;
  bookmark: boolean = false;
  parent: string | null = null;

  constructor(name: string) {
    this._id = generateHash();
    this.name = name;
  }

  static async remove(studio: Studio) {
    await database.remove(database.store.studios, { _id: studio._id });
  }

  static async filterStudio(studioId: string) {
    await database.update(
      database.store.studios,
      { parent: studioId },
      { $set: { parent: null } }
    );
  }

  static async filterImage(thumbnail: string) {
    await database.update(
      database.store.studios,
      { thumbnail },
      { $set: { thumbnail: null } }
    );
  }

  static async filterLabel(label: string) {
    await database.update(
      database.store.scenes,
      {},
      { $pull: { labels: label } }
    );
  }

  static async getById(_id: string) {
    return (await database.findOne(database.store.studios, {
      _id
    })) as Studio | null;
  }

  static async getAll() {
    return (await database.find(database.store.studios, {})) as Studio[];
  }

  static async getScenes(studio: Studio) {
    return await Scene.getByStudio(studio._id);
  }

  static async getMovies(studio: Studio) {
    return await Movie.getByStudio(studio._id);
  }

  static async getActors(studio: Studio) {
    const scenes = await Studio.getScenes(studio);
    const actorIds = [...new Set(scenes.map(scene => scene.actors).flat())];

    const actors = [] as Actor[];

    for (const id of actorIds) {
      const actor = await Actor.getById(id);
      if (actor) actors.push(actor);
    }

    return actors;
  }

  static async getLabels(studio: Studio) {
    const scenes = await Studio.getScenes(studio);
    const labelIds = [...new Set(scenes.map(scene => scene.labels).flat())];

    const labels = [] as Label[];

    for (const id of labelIds) {
      const label = await Label.getById(id);
      if (label) labels.push(label);
    }

    return labels;
  }
}
