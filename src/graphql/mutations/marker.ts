import { getConfig } from "../../config/index";
import { markerCollection } from "../../database";
import { extractLabels } from "../../extractor";
import { indexMarkers, removeMarker } from "../../search/marker";
import Actor from "../../types/actor";
import LabelledItem from "../../types/labelled_item";
import Marker from "../../types/marker";
import Scene from "../../types/scene";
import { logger } from "../../utils/logger";

interface ICreateMarkerArgs {
  scene: string;
  name: string;
  time: number;
  rating?: number | null;
  favorite?: boolean | null;
  bookmark?: number | null;
  labels?: string[] | null;
  actors?: string[] | null;
}

type IMarkerUpdateOpts = Partial<{
  favorite: boolean;
  bookmark: number;
  actors: string[];
  name: string;
  rating: number;
  labels: string[];
}>;

export default {
  async updateMarkers(
    _: unknown,
    { ids, opts }: { ids: string[]; opts: IMarkerUpdateOpts }
  ): Promise<Marker[]> {
    const updatedMarkers: Marker[] = [];

    for (const id of ids) {
      const marker = await Marker.getById(id);

      if (marker) {
        if (typeof opts.name === "string") {
          marker.name = opts.name.trim();
        }

        if (Array.isArray(opts.labels)) {
          await Marker.setLabels(marker, opts.labels);
        }

        if (Array.isArray(opts.actors)) {
          await Marker.setActors(marker, opts.actors);
        }

        if (typeof opts.bookmark === "number" || opts.bookmark === null) {
          marker.bookmark = opts.bookmark;
        }

        if (typeof opts.favorite === "boolean") {
          marker.favorite = opts.favorite;
        }

        if (typeof opts.rating === "number") {
          marker.rating = opts.rating;
        }

        await markerCollection.upsert(marker._id, marker);
        updatedMarkers.push(marker);
      }
    }

    await indexMarkers(updatedMarkers);
    return updatedMarkers;
  },

  async createMarker(
    _: unknown,
    { scene, name, time, rating, favorite, bookmark, labels, actors }: ICreateMarkerArgs
  ): Promise<Marker> {
    const _scene = await Scene.getById(scene);
    if (!_scene) {
      throw new Error("Scene not found");
    }

    const marker = new Marker(name, scene, time);

    if (typeof rating === "number") {
      if (rating < 0 || rating > 10) {
        throw new Error("BAD_REQUEST");
      }
      marker.rating = rating;
    }

    if (typeof favorite === "boolean") {
      marker.favorite = favorite;
    }

    if (typeof bookmark === "number") {
      marker.bookmark = bookmark;
    }

    await markerCollection.upsert(marker._id, marker);

    // Extract labels
    const existingLabels = labels || [];
    const extractedLabels = await extractLabels(marker.name);
    existingLabels.push(...extractedLabels);
    logger.verbose(`Found ${extractedLabels.length} labels in marker name`);
    await Marker.setLabels(marker, existingLabels);

    // Set actors
    if (actors) {
      await Marker.setActors(marker, actors);

      const config = getConfig();
      if (config.matching.applyActorLabels.includes("plugin:marker:create")) {
        for (const actorId of actors) {
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

    await Marker.createMarkerThumbnail(marker);
    await markerCollection.upsert(marker._id, marker);
    await indexMarkers([marker]);

    return marker;
  },

  async removeMarkers(_: unknown, { ids }: { ids: string[] }): Promise<boolean> {
    for (const id of ids) {
      const marker = await Marker.getById(id);

      if (marker) {
        await Marker.remove(marker._id);
        await removeMarker(marker._id);
        await LabelledItem.removeByItem(marker._id);
      }
    }
    return true;
  },
};
