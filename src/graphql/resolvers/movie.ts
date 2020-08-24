import Actor from "../../types/actor";
import Image from "../../types/image";
import Label from "../../types/label";
import Movie from "../../types/movie";
import Scene from "../../types/scene";
import Studio from "../../types/studio";

export default {
  frontCover(movie: Movie): Promise<Image | null> | null {
    if (movie.frontCover) return Image.getById(movie.frontCover);
    return null;
  },

  backCover(movie: Movie): Promise<Image | null> | null {
    if (movie.backCover) return Image.getById(movie.backCover);
    return null;
  },

  spineCover(movie: Movie): Promise<Image | null> | null {
    if (movie.spineCover) return Image.getById(movie.spineCover);
    return null;
  },

  scenes(movie: Movie): Promise<Scene[]> {
    return Movie.getScenes(movie);
  },

  actors(movie: Movie): Promise<Actor[]> {
    return Movie.getActors(movie);
  },

  labels(movie: Movie): Promise<Label[]> {
    return Movie.getLabels(movie);
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
