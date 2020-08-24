import Actor from "../../types/actor";
import Image from "../../types/image";
import Label from "../../types/label";
import Movie from "../../types/movie";
import Scene from "../../types/scene";
import Studio from "../../types/studio";

export default {
  thumbnail(studio: Studio): Promise<Image | null> | null {
    if (studio.thumbnail) return Image.getById(studio.thumbnail);
    return null;
  },

  scenes(studio: Studio): Promise<Scene[]> {
    return Studio.getScenes(studio);
  },

  actors(studio: Studio): Promise<Actor[]> {
    return Studio.getActors(studio);
  },

  labels(studio: Studio): Promise<Label[]> {
    return Studio.getLabels(studio);
  },

  movies(studio: Studio): Promise<Movie[]> {
    return Studio.getMovies(studio);
  },

  async rating(studio: Studio): Promise<number | null> {
    const scenesWithScore = (await Studio.getScenes(studio)).filter((scene) => !!scene.rating);

    if (!scenesWithScore.length) return null;

    return Math.round(
      scenesWithScore.reduce((rating, scene) => rating + scene.rating, 0) / scenesWithScore.length
    );
  },

  async parent(studio: Studio): Promise<Studio | null> {
    if (studio.parent) return await Studio.getById(studio.parent);
    return null;
  },

  async substudios(studio: Studio): Promise<Studio[]> {
    return await Studio.getSubStudios(studio._id);
  },

  async numScenes(studio: Studio): Promise<number> {
    return (await Studio.getScenes(studio)).length;
  },
};
