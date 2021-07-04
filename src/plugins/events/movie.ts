import { getConfig } from "../../config";
import { ApplyStudioLabelsEnum } from "../../config/schema";
import { imageCollection, studioCollection } from "../../database";
import { buildFieldExtractor, extractStudios } from "../../extractor";
import { runPluginsSerial } from "../../plugins";
import { indexImages } from "../../search/image";
import { indexStudios } from "../../search/studio";
import Actor from "../../types/actor";
import Image from "../../types/image";
import Label from "../../types/label";
import Movie from "../../types/movie";
import Scene from "../../types/scene";
import Studio from "../../types/studio";
import { logger } from "../../utils/logger";
import { validRating } from "../../utils/misc";
import { createImage, createLocalImage } from "../context";
import { onStudioCreate } from "./studio";

function injectServerFunctions(movie: Movie) {
  let actors: Actor[], labels: Label[], scenes: Scene[], rating: number;
  return {
    $getActors: async () => (actors ??= await Movie.getActors(movie)),
    $getLabels: async () => (labels ??= await Movie.getLabels(movie)),
    $getScenes: async () => (scenes ??= await Movie.getScenes(movie)),
    $getRating: async () => (rating ??= await Movie.getRating(movie)),
    $createLocalImage: async (path: string, name: string, thumbnail?: boolean) => {
      const img = await createLocalImage(path, name, thumbnail);
      await imageCollection.upsert(img._id, img);

      if (!thumbnail) {
        await indexImages([img]);
      }

      return img._id;
    },
    $createImage: async (url: string, name: string, thumbnail?: boolean) => {
      const img = await createImage(url, name, thumbnail);
      await imageCollection.upsert(img._id, img);
      if (!thumbnail) {
        await indexImages([img]);
      }
      return img._id;
    },
  };
}

// This function has side effects
export async function onMovieCreate(
  movie: Movie,
  event: "movieCreated" = "movieCreated"
): Promise<Movie> {
  const config = getConfig();

  const pluginResult = await runPluginsSerial(config, event, {
    movie: JSON.parse(JSON.stringify(movie)) as Movie,
    movieName: movie.name,
    ...injectServerFunctions(movie),
  });

  if (
    typeof pluginResult.frontCover === "string" &&
    pluginResult.frontCover.startsWith("im_") &&
    (!movie.frontCover || config.plugins.allowMovieThumbnailOverwrite)
  ) {
    const image = await Image.getById(pluginResult.frontCover);
    if (image && (await Image.addDimensions(image))) {
      await imageCollection.upsert(image._id, image);
    }
    movie.frontCover = pluginResult.frontCover;
  }

  if (
    typeof pluginResult.backCover === "string" &&
    pluginResult.backCover.startsWith("im_") &&
    (!movie.backCover || config.plugins.allowMovieThumbnailOverwrite)
  ) {
    const image = await Image.getById(pluginResult.backCover);
    if (image && (await Image.addDimensions(image))) {
      await imageCollection.upsert(image._id, image);
    }
    movie.backCover = pluginResult.backCover;
  }

  if (
    typeof pluginResult.spineCover === "string" &&
    pluginResult.spineCover.startsWith("im_") &&
    (!movie.spineCover || config.plugins.allowMovieThumbnailOverwrite)
  ) {
    const image = await Image.getById(pluginResult.spineCover);
    if (image && (await Image.addDimensions(image))) {
      await imageCollection.upsert(image._id, image);
    }
    movie.spineCover = pluginResult.spineCover;
  }

  if (typeof pluginResult.name === "string") {
    movie.name = pluginResult.name;
  }

  if (typeof pluginResult.description === "string") {
    movie.description = pluginResult.description;
  }

  if (typeof pluginResult.releaseDate === "number") {
    movie.releaseDate = new Date(pluginResult.releaseDate).valueOf();
  }

  if (typeof pluginResult.addedOn === "number") {
    movie.addedOn = new Date(pluginResult.addedOn).valueOf();
  }

  if (validRating(pluginResult.rating)) {
    movie.rating = pluginResult.rating;
  }

  if (typeof pluginResult.favorite === "boolean") {
    movie.favorite = pluginResult.favorite;
  }

  if (typeof pluginResult.bookmark === "number") {
    movie.bookmark = pluginResult.bookmark;
  }

  if (pluginResult.custom && typeof pluginResult.custom === "object") {
    const localExtractFields = await buildFieldExtractor();
    for (const key in pluginResult.custom) {
      const fields = localExtractFields(key);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      if (fields.length) movie.customFields[fields[0]] = pluginResult.custom[key];
    }
  }

  if (!movie.studio && pluginResult.studio && typeof pluginResult.studio === "string") {
    const studioId = (await extractStudios(pluginResult.studio))[0] || null;

    if (studioId) movie.studio = studioId;
    else if (config.plugins.createMissingStudios) {
      const studioLabels: string[] = [];
      let studio = new Studio(pluginResult.studio);
      movie.studio = studio._id;

      studio = await onStudioCreate(studio, studioLabels, "studioCreated");
      await studioCollection.upsert(studio._id, studio);
      await Studio.findUnmatchedScenes(
        studio,
        config.matching.applyStudioLabels.includes(
          ApplyStudioLabelsEnum.enum["event:studio:create"]
        )
          ? studioLabels
          : []
      );
      await indexStudios([studio]);

      logger.debug(`Created studio ${studio.name}`);
    }
  }

  return movie;
}
