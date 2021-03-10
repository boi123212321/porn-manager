import { labelCollection, studioCollection } from "../../database";
import { getLength, isProcessing } from "../../queue/processing";
import { getClient, indexMap } from "../../search";
import Actor from "../../types/actor";
import CustomField, { CustomFieldTarget } from "../../types/custom_field";
import Image from "../../types/image";
import Label from "../../types/label";
import Movie from "../../types/movie";
import Scene from "../../types/scene";
import Studio from "../../types/studio";
import SceneView from "../../types/watch";
import { actorCollection } from "./../../database";
import { getActors, getUnwatchedActors } from "./search/actor";
import { getImages } from "./search/image";
import { getMarkers } from "./search/marker";
import { getMovies } from "./search/movie";
import { getScenes } from "./search/scene";
import { getStudios } from "./search/studio";

export default {
  async getWatches(
    _: void,
    { min, max }: { min: number | null; max: number | null }
  ): Promise<SceneView[]> {
    return (await SceneView.getAll()).filter(
      (w) => w.date >= (min || -99999999999999) && w.date <= (max || 99999999999999)
    );
  },

  async getScenesWithoutStudios(_: unknown, opts: { num: number }): Promise<Scene[]> {
    const numStudios = await studioCollection.count();
    if (numStudios === 0) {
      return [];
    }

    const numWanted = opts.num || 12;
    const scenes: Scene[] = [];

    await Scene.iterate(
      (scene) => {
        scenes.push(scene);
        return scenes.length >= numWanted;
      },
      [
        {
          bool: {
            must_not: {
              exists: {
                field: "studioName",
              },
            },
          },
        },
      ]
    );

    return scenes;
  },

  async getScenesWithoutLabels(_: unknown, opts: { num: number }): Promise<Scene[]> {
    const numStudios = await studioCollection.count();
    if (numStudios === 0) {
      return [];
    }

    const numWanted = opts.num || 12;
    const scenes: Scene[] = [];

    await Scene.iterate(
      (scene) => {
        scenes.push(scene);
        return scenes.length >= numWanted;
      },
      [
        {
          range: {
            numLabels: {
              lte: 0,
            },
          },
        },
      ]
    );

    return scenes;
  },

  async getActorsWithoutLabels(_: unknown, opts: { num: number }): Promise<Actor[]> {
    const numActors = await actorCollection.count();
    if (numActors === 0) {
      return [];
    }

    const numWanted = opts.num || 12;
    const actors: Actor[] = [];

    await Actor.iterate(
      (actor) => {
        actors.push(actor);
        return actors.length >= numWanted;
      },
      [
        {
          range: {
            numLabels: {
              lte: 0,
            },
          },
        },
      ]
    );

    return actors;
  },

  async getScenesWithoutActors(_: unknown, opts: { num: number }): Promise<Scene[]> {
    const numStudios = await studioCollection.count();
    if (numStudios === 0) {
      return [];
    }

    const numWanted = opts.num || 12;
    const scenes: Scene[] = [];

    await Scene.iterate(
      (scene) => {
        scenes.push(scene);
        return scenes.length >= numWanted;
      },
      [
        {
          range: {
            numActors: {
              lte: 0,
            },
          },
        },
      ]
    );

    return scenes;
  },

  async getActorsWithoutScenes(_: unknown, opts: { num: number }): Promise<Actor[]> {
    const numActors = await actorCollection.count();
    if (numActors === 0) {
      return [];
    }

    const numWanted = opts.num || 12;
    const actors: Actor[] = [];

    await Actor.iterate(
      (actor) => {
        actors.push(actor);
        return actors.length >= numWanted;
      },
      [
        {
          range: {
            numScenes: {
              lte: 0,
            },
          },
        },
      ]
    );

    return actors;
  },

  async topActors(
    _: unknown,
    { skip, take }: { skip: number; take: number }
  ): Promise<(Actor | null)[]> {
    return Actor.getTopActors(skip, take);
  },

  getUnwatchedActors,

  async getQueueInfo(): Promise<{
    length: number;
    processing: boolean;
  }> {
    return {
      length: await getLength(),
      processing: isProcessing(),
    };
  },

  getStudios,
  getMovies,
  getActors,
  getScenes,
  getImages,
  getMarkers,

  async getImageById(_: unknown, { id }: { id: string }): Promise<Image | null> {
    return await Image.getById(id);
  },

  async getSceneById(_: unknown, { id }: { id: string }): Promise<Scene | null> {
    return await Scene.getById(id);
  },

  async getActorById(_: unknown, { id }: { id: string }): Promise<Actor | null> {
    return await Actor.getById(id);
  },

  async getMovieById(_: unknown, { id }: { id: string }): Promise<Movie | null> {
    return await Movie.getById(id);
  },

  async getStudioById(_: unknown, { id }: { id: string }): Promise<Studio | null> {
    return await Studio.getById(id);
  },

  async getLabelById(_: unknown, { id }: { id: string }): Promise<Label | null> {
    return await Label.getById(id);
  },
  async getCustomFields(
    _: unknown,
    { target }: { target: CustomFieldTarget }
  ): Promise<CustomField[]> {
    const allFields = await CustomField.getAll();
    if (target) {
      return allFields.filter((field) => field.target.includes(target));
    }
    return allFields;
  },
  async getLabels(): Promise<Label[]> {
    const labels = await Label.getAll();
    return labels.sort((a, b) => a.name.localeCompare(b.name));
  },
  async numScenes(): Promise<number> {
    const res = await getClient().count({
      index: indexMap.scenes,
    });
    return res.count;
  },
  async numActors(): Promise<number> {
    const res = await getClient().count({
      index: indexMap.actors,
    });
    return res.count;
  },
  async numMovies(): Promise<number> {
    const res = await getClient().count({
      index: indexMap.movies,
    });
    return res.count;
  },
  async numLabels(): Promise<number> {
    return labelCollection.count();
  },
  async numStudios(): Promise<number> {
    const res = await getClient().count({
      index: indexMap.studios,
    });
    return res.count;
  },
  async numImages(): Promise<number> {
    const res = await getClient().count({
      index: indexMap.images,
    });
    return res.count;
  },
};
