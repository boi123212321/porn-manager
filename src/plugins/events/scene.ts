import { getConfig } from "../../config";
import { ApplyActorLabelsEnum, ApplyStudioLabelsEnum } from "../../config/schema";
import {
  actorCollection,
  imageCollection,
  labelCollection,
  markerCollection,
  movieCollection,
  studioCollection,
} from "../../database";
import {
  buildActorExtractor,
  buildFieldExtractor,
  buildLabelExtractor,
  extractLabels,
  extractMovies,
  extractStudios,
} from "../../extractor";
import { runPluginsSerial } from "../../plugins";
import { indexActors } from "../../search/actor";
import { indexImages } from "../../search/image";
import { indexMarkers } from "../../search/marker";
import { indexMovies } from "../../search/movie";
import { indexStudios } from "../../search/studio";
import Actor from "../../types/actor";
import Image from "../../types/image";
import Label from "../../types/label";
import Marker from "../../types/marker";
import Movie from "../../types/movie";
import Scene from "../../types/scene";
import Studio from "../../types/studio";
import SceneView from "../../types/watch";
import { mapAsync } from "../../utils/async";
import { handleError, logger } from "../../utils/logger";
import { validRating } from "../../utils/misc";
import { isNumber } from "../../utils/types";
import { createImage, createLocalImage } from "../context";
import { onActorCreate } from "./actor";
import { onMovieCreate } from "./movie";
import { onStudioCreate } from "./studio";

export async function createMarker(
  sceneId: string,
  name: string,
  seconds: number
): Promise<Marker | null> {
  const config = getConfig();
  const existingMarker = await Marker.getAtTime(
    sceneId,
    seconds,
    config.plugins.markerDeduplicationThreshold
  );
  if (existingMarker) {
    // Prevent duplicate markers
    return null;
  }
  const marker = new Marker(name, sceneId, seconds);
  await Marker.createMarkerThumbnail(marker);
  await markerCollection.upsert(marker._id, marker);
  return marker;
}

function injectServerFunctions(scene: Scene, createdImages: Image[], createdMarkers: Marker[]) {
  let actors: Actor[], labels: Label[], watches: SceneView[];
  let studio: Studio | null, movies: Movie[];
  return {
    $getActors: async () => (actors ??= await Scene.getActors(scene)),
    $getLabels: async () => (labels ??= await Scene.getLabels(scene)),
    $getWatches: async () => (watches ??= await SceneView.getByScene(scene._id)),
    $getStudio: async () => (studio ??= scene.studio ? await Studio.getById(scene.studio) : null),
    $getMovies: async () => (movies ??= await Movie.getByScene(scene._id)),
    $createMarker: async (name: string, seconds: number) => {
      const marker = await createMarker(scene._id, name, seconds);
      if (marker) {
        createdMarkers.push(marker);
        return marker._id;
      }
      return null;
    },
    $createLocalImage: async (path: string, name: string, thumbnail?: boolean) => {
      const img = await createLocalImage(path, name, thumbnail);
      img.scene = scene._id;
      await imageCollection.upsert(img._id, img);
      if (!thumbnail) {
        createdImages.push(img);
      }
      return img._id;
    },
    $createImage: async (url: string, name: string, thumbnail?: boolean) => {
      const img = await createImage(url, name, thumbnail);
      img.scene = scene._id;
      await imageCollection.upsert(img._id, img);
      if (!thumbnail) {
        createdImages.push(img);
      }
      return img._id;
    },
  };
}

// This function has side effects
export async function onSceneCreate(
  scene: Scene,
  sceneLabels: string[],
  sceneActors: string[],
  event: "sceneCustom" | "sceneCreated" = "sceneCreated"
): Promise<{ scene: Scene; commit: () => Promise<void> }> {
  const config = getConfig();

  const createdImages = [] as Image[];
  const createdMarkers = [] as Marker[];

  const pluginResult = await runPluginsSerial(config, event, {
    scene: JSON.parse(JSON.stringify(scene)) as Scene,
    sceneName: scene.name,
    scenePath: scene.path,
    ...injectServerFunctions(scene, createdImages, createdMarkers),
  });

  if (
    typeof pluginResult.thumbnail === "string" &&
    pluginResult.thumbnail.startsWith("im_") &&
    (!scene.thumbnail || config.plugins.allowSceneThumbnailOverwrite)
  ) {
    scene.thumbnail = pluginResult.thumbnail;
  }

  if (typeof pluginResult.name === "string") {
    scene.name = pluginResult.name;
  }

  if (typeof pluginResult.path === "string") {
    await Scene.changePath(scene, pluginResult.path);
  }

  if (typeof pluginResult.description === "string") {
    scene.description = pluginResult.description;
  }

  if (typeof pluginResult.releaseDate === "number") {
    scene.releaseDate = new Date(pluginResult.releaseDate).valueOf();
  }

  if (typeof pluginResult.addedOn === "number") {
    scene.addedOn = new Date(pluginResult.addedOn).valueOf();
  }

  const viewArray: unknown = pluginResult.views || pluginResult.watches;
  if (Array.isArray(viewArray) && viewArray.every(isNumber)) {
    for (const viewTime of viewArray) {
      await Scene.watch(scene, viewTime);
    }
  }

  if (pluginResult.custom && typeof pluginResult.custom === "object") {
    const localExtractFields = await buildFieldExtractor();
    for (const key in pluginResult.custom) {
      const fields = localExtractFields(key);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      if (fields.length) scene.customFields[fields[0]] = pluginResult.custom[key];
    }
  }

  if (validRating(pluginResult.rating)) {
    scene.rating = pluginResult.rating;
  }

  if (typeof pluginResult.favorite === "boolean") {
    scene.favorite = pluginResult.favorite;
  }

  if (typeof pluginResult.bookmark === "number") {
    scene.bookmark = pluginResult.bookmark;
  }

  if (pluginResult.actors && Array.isArray(pluginResult.actors)) {
    const actorIds = [] as string[];
    const shouldApplyActorLabels =
      (event === "sceneCreated" &&
        config.matching.applyActorLabels.includes(
          ApplyActorLabelsEnum.enum["plugin:scene:create"]
        )) ||
      (event === "sceneCustom" &&
        config.matching.applyActorLabels.includes(
          ApplyActorLabelsEnum.enum["plugin:scene:custom"]
        ));

    const localExtractActors = await buildActorExtractor();
    for (const actorName of pluginResult.actors) {
      const extractedIds = localExtractActors(actorName);
      if (extractedIds.length) {
        actorIds.push(...extractedIds);
      } else if (config.plugins.createMissingActors) {
        let actor = new Actor(actorName);
        actorIds.push(actor._id);
        const actorLabels = [] as string[];
        const pluginResult = await onActorCreate(actor, actorLabels);
        actor = pluginResult.actor;
        await Actor.setLabels(actor, actorLabels);
        await actorCollection.upsert(actor._id, actor);
        if (config.matching.matchCreatedActors) {
          await Actor.findUnmatchedScenes(actor, shouldApplyActorLabels ? actorLabels : []);
        }
        await indexActors([actor]);
        await pluginResult.commit();
        logger.debug(`Created actor ${actor.name}`);
      }

      if (shouldApplyActorLabels) {
        const actors = await Actor.getBulk(actorIds);
        const actorLabelIds = (await mapAsync(actors, Actor.getLabels)).flat().map((l) => l._id);
        logger.verbose("Applying actor labels to scene");
        sceneLabels.push(...actorLabelIds);
      }
    }
    sceneActors.push(...actorIds);
  }

  if (pluginResult.labels && Array.isArray(pluginResult.labels)) {
    const labelIds = [] as string[];
    const localExtractLabels = await buildLabelExtractor();
    for (const labelName of pluginResult.labels) {
      const extractedIds = localExtractLabels(labelName);
      if (extractedIds.length) {
        labelIds.push(...extractedIds);
        logger.verbose(`Found ${extractedIds.length} labels for ${<string>labelName}:`);
        logger.debug(extractedIds);
      } else if (config.plugins.createMissingLabels) {
        const label = new Label(labelName);
        labelIds.push(label._id);
        await labelCollection.upsert(label._id, label);
        logger.debug(`Created label ${label.name}`);
      }
    }
    sceneLabels.push(...labelIds);
  }

  if (!scene.studio && pluginResult.studio && typeof pluginResult.studio === "string") {
    let studioLabels: string[] = [];
    const studioId = (await extractStudios(pluginResult.studio))[0] || null;
    const shouldApplyStudioLabels =
      (event === "sceneCreated" &&
        config.matching.applyStudioLabels.includes(
          ApplyStudioLabelsEnum.enum["plugin:scene:create"]
        )) ||
      (event === "sceneCustom" &&
        config.matching.applyStudioLabels.includes(
          ApplyStudioLabelsEnum.enum["plugin:scene:custom"]
        ));

    if (studioId) {
      scene.studio = studioId;
      if (shouldApplyStudioLabels) {
        const studio = await Studio.getById(studioId);
        if (studio) {
          studioLabels = (await Studio.getLabels(studio)).map((l) => l._id);
        }
      }
    } else if (config.plugins.createMissingStudios) {
      let studio = new Studio(pluginResult.studio);
      scene.studio = studio._id;

      try {
        studio = await onStudioCreate(studio, studioLabels);
      } catch (error) {
        handleError(`Error running studio plugin for new studio, in scene plugin`, error);
      }

      await Studio.findUnmatchedScenes(studio, shouldApplyStudioLabels ? studioLabels : []);
      await studioCollection.upsert(studio._id, studio);
      await indexStudios([studio]);
      logger.debug(`Created studio ${studio.name}`);
    }
    if (shouldApplyStudioLabels) {
      logger.verbose("Applying actor labels to scene");
      sceneLabels.push(...studioLabels);
    }
  }

  if (pluginResult.movie && typeof pluginResult.movie === "string") {
    const movieId = (await extractMovies(pluginResult.movie))[0] || null;

    if (movieId) {
      const movie = <Movie>await Movie.getById(movieId);
      const sceneIds = (await Movie.getScenes(movie)).map((sc) => sc._id);
      await Movie.setScenes(movie, sceneIds.concat(scene._id));
      await indexMovies([movie]);
    } else if (config.plugins.createMissingMovies) {
      let movie = new Movie(pluginResult.movie);

      try {
        movie = await onMovieCreate(movie, "movieCreated");
      } catch (error) {
        handleError(`onMovieCreate error`, error);
      }

      await movieCollection.upsert(movie._id, movie);
      logger.debug(`Created movie ${movie.name}`);
      await Movie.setScenes(movie, [scene._id]);
      logger.debug(`Attached ${scene.name} to movie ${movie.name}`);
      await indexMovies([movie]);
    }
  }

  return {
    scene,
    commit: async () => {
      logger.debug("Committing plugin result");

      for (const image of createdImages) {
        if (config.matching.applySceneLabels) {
          await Image.setLabels(image, sceneLabels);
        }
        await Image.setActors(image, sceneActors);
      }
      await indexImages(createdImages);

      for (const marker of createdMarkers) {
        await Marker.setActors(marker, sceneActors);

        // Extract labels
        const extractedLabels = await extractLabels(marker.name);
        logger.verbose(`Found ${extractedLabels.length} labels in marker name`);
        await Marker.setLabels(marker, extractedLabels);

        if (config.matching.applyActorLabels.includes("plugin:marker:create")) {
          for (const actorId of sceneActors) {
            const actor = await Actor.getById(actorId);

            if (actor) {
              const actorLabels = await Actor.getLabels(actor);
              await Marker.addLabels(
                marker,
                actorLabels.map((l) => l._id)
              );
            }
          }
        }
      }
      await indexMarkers(createdMarkers);
    },
  };
}
