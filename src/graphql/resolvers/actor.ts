import { ICountry } from "../../data/countries";
import Actor from "../../types/actor";
import { getNationality } from "../../types/countries";
import CustomField, { CustomFieldTarget } from "../../types/custom_field";
import Image from "../../types/image";
import Label from "../../types/label";
import Movie from "../../types/movie";
import Scene from "../../types/scene";
import { createObjectSet } from "../../types/utility";

export default {
  async scenes(actor: Actor): Promise<Scene[]> {
    return await Scene.getByActor(actor._id);
  },
  async labels(actor: Actor): Promise<Label[]> {
    return await Actor.getLabels(actor);
  },
  async avatar(actor: Actor): Promise<Image | null> {
    if (actor.avatar) return await Image.getById(actor.avatar);
    return null;
  },
  async thumbnail(actor: Actor): Promise<Image | null> {
    if (actor.thumbnail) return await Image.getById(actor.thumbnail);
    return null;
  },
  async altThumbnail(actor: Actor): Promise<Image | null> {
    if (actor.altThumbnail) return await Image.getById(actor.altThumbnail);
    return null;
  },
  async hero(actor: Actor): Promise<Image | null> {
    if (actor.hero) return await Image.getById(actor.hero);
    return null;
  },
  async watches(actor: Actor): Promise<number[]> {
    const watches = await Actor.getWatches(actor);
    return watches.map((w) => w.date);
  },
  async numScenes(actor: Actor): Promise<number> {
    return (await Scene.getByActor(actor._id)).length;
  },
  async availableFields(): Promise<CustomField[]> {
    const fields = await CustomField.getAll();
    return fields.filter((field) => field.target.includes(CustomFieldTarget.ACTORS));
  },
  age(actor: Actor): number | null {
    return Actor.getAge(actor);
  },
  async movies(actor: Actor): Promise<Movie[]> {
    return Actor.getMovies(actor);
  },
  async collabs(actor: Actor): Promise<Actor[]> {
    const collabs = await Actor.getCollabs(actor);
    const actors = collabs.map((c) => c.actors).flat();
    return createObjectSet(actors, "_id");
  },
  nationality(actor: Actor): ICountry | null {
    if (!actor.nationality) return null;
    return getNationality(actor.nationality);
  },
};
