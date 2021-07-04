import { imageCollection } from "../../database";
import Actor from "../../types/actor";
import Image from "../../types/image";
import Label from "../../types/label";
import Movie from "../../types/movie";
import Scene from "../../types/scene";
import Studio from "../../types/studio";

export default {
  async frontCover(movie: Movie): Promise<Image | null> {
    if (!movie.frontCover) {
      return null;
    }

    const image = await Image.getById(movie.frontCover);
    if (!image) {
      return null;
    }

    // Pre 0.27 compatibility: add image dimensions on demand and save to db
    if (await Image.addDimensions(image)) {
      await imageCollection.upsert(image._id, image);
    }

    return image;
  },

  async backCover(movie: Movie): Promise<Image | null> {
    if (!movie.backCover) {
      return null;
    }
    const image = await Image.getById(movie.backCover);
    if (!image) {
      return null;
    }

    // Pre 0.27 compatibility: add image dimensions on demand and save to db
    if (await Image.addDimensions(image)) {
      await imageCollection.upsert(image._id, image);
    }

    return image;
  },

  async spineCover(movie: Movie): Promise<Image | null> {
    if (!movie.spineCover) {
      return null;
    }
    const image = await Image.getById(movie.spineCover);
    if (!image) {
      return null;
    }

    // Pre 0.27 compatibility: add image dimensions on demand and save to db
    if (await Image.addDimensions(image)) {
      await imageCollection.upsert(image._id, image);
    }

    return image;
  },

  scenes(movie: Movie): Promise<Scene[]> {
    return Movie.getScenes(movie);
  },

  async actors(movie: Movie): Promise<Actor[]> {
    const actors = await Movie.getActors(movie);
    return actors.sort((a, b) => a.name.localeCompare(b.name));
  },

  async labels(movie: Movie): Promise<Label[]> {
    const labels = await Movie.getLabels(movie);
    return labels.sort((a, b) => a.name.localeCompare(b.name));
  },

  async rating(movie: Movie): Promise<number> {
    return await Movie.getRating(movie);
  },

  async duration(movie: Movie): Promise<number | null> {
    return await Movie.calculateDuration(movie);
  },

  async size(movie: Movie): Promise<number | null> {
    const scenesWithSource = (await Movie.getScenes(movie)).filter(
      (scene) => scene.meta && scene.path
    );

    if (!scenesWithSource.length) return null;

    return scenesWithSource.reduce((dur, scene) => dur + <number>scene.meta.size, 0);
  },

  async studio(movie: Movie): Promise<Studio | null> {
    if (movie.studio) return Studio.getById(movie.studio);
    return null;
  },
};
