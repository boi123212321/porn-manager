import { markerCollection } from "../../database";
import { extractLabels } from "../../extractor";
import { indexMarkers, removeMarker } from "../../search/marker";
import LabelledItem from "../../types/labelled_item";
import Marker from "../../types/marker";
import { logger } from "../../utils/logger";

interface ICreateMarkerArgs {
  scene: string;
  name: string;
  time: number;
  rating?: number | null;
  favorite?: boolean | null;
  bookmark?: number | null;
  labels?: string[] | null;
}

type IMarkerUpdateOpts = Partial<{
  favorite: boolean;
  bookmark: number;
  // actors: string[];
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
    { scene, name, time, rating, favorite, bookmark, labels }: ICreateMarkerArgs
  ): Promise<Marker> {
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

    await Marker.createMarkerThumbnail(marker);

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
