import { FfprobeData } from "fluent-ffmpeg";

import { getConfig } from "../../config";
import { ApplyActorLabelsEnum, ApplyStudioLabelsEnum } from "../../config/schema";
import { imageCollection, sceneCollection } from "../../database";
import { extractActors, extractLabels } from "../../extractor";
import { onSceneCreate } from "../../plugins/events/scene";
import { removeSceneFromQueue } from "../../queue/processing";
import { indexImages, removeImage } from "../../search/image";
import { indexScenes, removeScene } from "../../search/scene";
import Actor from "../../types/actor";
import ActorReference from "../../types/actor_reference";
import Image from "../../types/image";
import Label from "../../types/label";
import LabelledItem from "../../types/labelled_item";
import Marker from "../../types/marker";
import MovieScene from "../../types/movie_scene";
import Scene from "../../types/scene";
import Studio from "../../types/studio";
import { mapAsync } from "../../utils/async";
import { formatMessage, handleError, logger } from "../../utils/logger";
import { Dictionary } from "../../utils/types";

type ISceneUpdateOpts = Partial<{
  favorite: boolean;
  bookmark: number;
  actors: string[];
  name: string;
  description: string;
  rating: number;
  labels: string[];
  streamLinks: string[];
  thumbnail: string;
  releaseDate: number;
  studio: string | null;
  customFields: Dictionary<string[] | boolean | string | null>;
  path: string;
}>;

async function runScenePlugins(id: string): Promise<Scene | null> {
  let scene = await Scene.getById(id);

  if (scene) {
    const labels = (await Scene.getLabels(scene)).map((l) => l._id);
    const actors = (await Scene.getActors(scene)).map((a) => a._id);

    const result = await onSceneCreate(scene, labels, actors, "sceneCustom");
    scene = result.scene;

    await Scene.setLabels(scene, labels);
    await Scene.setActors(scene, actors);
    await sceneCollection.upsert(scene._id, scene);
    await indexScenes([scene]);
    await result.commit();
  }

  return scene;
}

export default {
  async runScenePlugins(_: unknown, { id }: { id: string }): Promise<Scene> {
    logger.debug(`Mutation: runScenePlugins, for scene ${id}`);
    const result = await runScenePlugins(id);
    if (!result) {
      throw new Error("Scene not found");
    }
    return result;
  },

  async screenshotScene(
    _: unknown,
    { id, sec }: { id: string; sec: number }
  ): Promise<Image | null> {
    const scene = await Scene.getById(id);

    if (scene) {
      const image = await Scene.screenshot(scene, sec);
      return image;
    }
    return null;
  },

  async unwatchScene(_: unknown, { id }: { id: string }): Promise<Scene | null> {
    const scene = await Scene.getById(id);

    if (scene) {
      await Scene.unwatch(scene);
      return scene;
    }
    return null;
  },

  async watchScene(_: unknown, { id }: { id: string }): Promise<Scene | null> {
    const scene = await Scene.getById(id);

    if (scene) {
      await Scene.watch(scene);
      return scene;
    }
    return null;
  },

  async addScene(
    _: unknown,
    args: { actors: string[]; labels: string[]; name: string }
  ): Promise<Scene> {
    for (const actor of args.actors || []) {
      const actorInDb = await Actor.getById(actor);
      if (!actorInDb) {
        throw new Error(`Actor ${actor} not found`);
      }
    }

    for (const label of args.labels || []) {
      const labelInDb = await Label.getById(label);
      if (!labelInDb) {
        throw new Error(`Label ${label} not found`);
      }
    }

    const config = getConfig();

    const sceneName = args.name;
    const scene = new Scene(sceneName);

    let actorIds = [] as string[];
    if (args.actors) {
      actorIds = args.actors;
    }

    // Extract actors
    const extractedActors = await extractActors(scene.name);
    logger.verbose(`Found ${extractedActors.length} actors in scene title.`);
    actorIds.push(...extractedActors);
    await Scene.setActors(scene, actorIds);

    let labels = [] as string[];
    if (args.labels) {
      labels = args.labels;
    }

    // Extract labels
    const extractedLabels = await extractLabels(scene.name);
    logger.verbose(`Found ${extractedLabels.length} labels in scene title.`);
    labels.push(...extractedLabels);

    if (
      config.matching.applyActorLabels.includes(ApplyActorLabelsEnum.enum["event:scene:create"])
    ) {
      logger.verbose("Applying actor labels to scene");
      const actors = await Actor.getBulk(actorIds);
      const actorLabels = (
        await mapAsync(actors, async (actor) => (await Actor.getLabels(actor)).map((l) => l._id))
      ).flat();
      labels.push(...actorLabels);
    }

    await Scene.setLabels(scene, labels);
    await sceneCollection.upsert(scene._id, scene);
    logger.verbose(`Scene '${sceneName}' done.`);
    return scene;
  },

  async updateScenes(
    _: unknown,
    { ids, opts }: { ids: string[]; opts: ISceneUpdateOpts }
  ): Promise<Scene[]> {
    const config = getConfig();
    const updatedScenes: Scene[] = [];

    for (const id of ids) {
      logger.silly(`Updating scene ${id}`);
      const scene = await Scene.getById(id);

      if (scene) {
        const labelsToApply = (await Scene.getLabels(scene)).map((l) => l._id);
        if (typeof opts.name === "string") {
          scene.name = opts.name.trim();
        }

        if (typeof opts.description === "string") {
          scene.description = opts.description.trim();
        }

        if (typeof opts.thumbnail === "string") {
          scene.thumbnail = opts.thumbnail;
        }

        if (typeof opts.path === "string") {
          await Scene.changePath(scene, opts.path);
        }

        if (opts.studio !== undefined) {
          scene.studio = opts.studio;

          if (opts.studio) {
            const studio = await Studio.getById(opts.studio);

            if (studio) {
              if (
                config.matching.applyStudioLabels.includes(
                  ApplyStudioLabelsEnum.enum["event:scene:update"]
                )
              ) {
                const studioLabels = (await Studio.getLabels(studio)).map((l) => l._id);
                logger.verbose("Applying studio labels to scene");
                labelsToApply.push(...studioLabels);
              }
            }
          }
        }

        if (Array.isArray(opts.labels)) {
          // If the update sets labels, use those and ignore the existing
          labelsToApply.push(...opts.labels);
        } else {
          const existingLabels = (await Scene.getLabels(scene)).map((l) => l._id);
          labelsToApply.push(...existingLabels);
        }
        if (Array.isArray(opts.actors)) {
          const actorIds = [...new Set(opts.actors)];
          await Scene.setActors(scene, actorIds);

          if (
            config.matching.applyActorLabels.includes(
              ApplyActorLabelsEnum.enum["event:scene:update"]
            )
          ) {
            const actors = await Actor.getBulk(actorIds);
            const actorLabelIds = (await mapAsync(actors, Actor.getLabels))
              .flat()
              .map((l) => l._id);

            logger.verbose("Applying actor labels to scene");
            labelsToApply.push(...actorLabelIds);
          }
        }
        await Scene.setLabels(scene, labelsToApply);

        if (Array.isArray(opts.streamLinks)) {
          scene.streamLinks = [...new Set(opts.streamLinks)];
        }

        if (typeof opts.bookmark === "number" || opts.bookmark === null) {
          scene.bookmark = opts.bookmark;
        }

        if (typeof opts.favorite === "boolean") {
          scene.favorite = opts.favorite;
        }

        if (typeof opts.rating === "number") {
          scene.rating = opts.rating;
        }

        if (opts.releaseDate !== undefined) {
          scene.releaseDate = opts.releaseDate;
        }

        if (opts.customFields) {
          for (const key in opts.customFields) {
            const value = opts.customFields[key] !== undefined ? opts.customFields[key] : null;
            logger.debug(`Set scene custom.${key} to ${JSON.stringify(value)}`);
            opts.customFields[key] = value;
          }
          scene.customFields = opts.customFields;
        }

        await sceneCollection.upsert(scene._id, scene);
        updatedScenes.push(scene);
      }
    }

    await indexScenes(updatedScenes);
    return updatedScenes;
  },

  async removeScenes(
    _: unknown,
    { ids, deleteImages }: { ids: string[]; deleteImages?: boolean }
  ): Promise<boolean> {
    for (const id of ids) {
      const scene = await Scene.getById(id);

      if (scene) {
        await Scene.remove(scene);
        await removeScene(scene._id);

        if (deleteImages) {
          await Image.iterateByScene(scene._id, async (image) => {
            await Image.remove(image);
            await removeImage(image._id);
            await LabelledItem.removeByItem(image._id);
            await ActorReference.removeByItem(image._id);
          });
          logger.verbose(`Deleted images of scene ${scene._id}`);
        } else {
          await Image.iterateByScene(scene._id, async (image) => {
            image.scene = null;
            await imageCollection.upsert(image._id, image);
            await indexImages([image]);
          });
          logger.verbose(`Removed scene ${scene._id} from images`);
        }

        await Marker.removeByScene(scene._id);

        logger.info(`Deleted scene ${scene._id}`);

        await LabelledItem.removeByItem(scene._id);
        await ActorReference.removeByItem(scene._id);
        await MovieScene.removeByScene(scene._id);

        try {
          logger.debug("Deleting scene from queue (if needed)");
          await removeSceneFromQueue(scene._id);
        } catch (err) {
          handleError(
            `Could not delete scene ${scene._id} from queue (ignore if 404, just means that the deleted scene wasn't going to be processed)`,
            err
          );
        }
      }
    }
    return true;
  },

  async runFFProbe(
    _: unknown,
    { id }: { id: string }
  ): Promise<null | { scene: Scene; ffprobe: string }> {
    const scene = await Scene.getById(id);
    if (!scene) {
      return null;
    }
    let ffprobe: FfprobeData | null = null;

    try {
      logger.verbose(`Extracting video metadata of ${scene._id}`);
      ffprobe = await Scene.runFFProbe(scene);
      logger.silly(`Scene ${scene._id} metadata is now ${formatMessage(scene.meta)}`);

      await sceneCollection.upsert(scene._id, scene);
    } catch (err) {
      handleError(`Could not extract metadata of ${scene._id}`, err);
    }

    return {
      ffprobe: JSON.stringify(ffprobe),
      scene,
    };
  },
};
