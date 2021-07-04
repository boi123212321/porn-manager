import Marker from "../types/marker";
import Scene from "../types/scene";
import { mapAsync } from "../utils/async";
import {
  bookmark,
  excludeFilter,
  favorite,
  getActorNames,
  includeFilter,
  ISearchResults,
  performSearch,
  ratingFilter,
  searchQuery,
  shuffle,
  shuffleSwitch,
} from "./common";
import { getClient, indexMap } from "./index";
import { addSearchDocs, buildIndex, indexItems, ProgressCallback } from "./internal/buildIndex";

export interface IMarkerSearchDoc {
  id: string;
  addedOn: number;
  name: string;
  rawName: string;
  actors: string[];
  actorNames: string[];
  labels: string[];
  labelNames: string[];
  rating: number;
  bookmark: number | null;
  favorite: boolean;
  scene: string;
  sceneName: string;
  custom: Record<string, boolean | string | number | string[] | null>;
  numActors: number;
}

export async function createMarkerSearchDoc(marker: Marker): Promise<IMarkerSearchDoc> {
  const labels = await Marker.getLabels(marker);
  const scene = await Scene.getById(marker.scene);
  const actors = await Marker.getActors(marker);

  return {
    id: marker._id,
    addedOn: marker.addedOn,
    name: marker.name,
    rawName: marker.name,
    actors: actors.map((a) => a._id),
    actorNames: [...new Set(actors.map(getActorNames).flat())],
    labels: labels.map((l) => l._id),
    labelNames: labels.map((l) => l.name),
    scene: scene ? scene._id : "",
    sceneName: scene ? scene.name : "",
    rating: marker.rating,
    bookmark: marker.bookmark,
    favorite: marker.favorite,
    custom: marker.customFields,
    numActors: actors.length,
  };
}

async function addMarkerSearchDocs(docs: IMarkerSearchDoc[]): Promise<void> {
  return addSearchDocs(indexMap.markers, docs);
}

export async function removeMarker(markerId: string): Promise<void> {
  await getClient().delete({
    index: indexMap.markers,
    id: markerId,
    type: "_doc",
    refresh: "wait_for",
  });
}

export async function removeMarkers(markerIds: string[]): Promise<void> {
  await mapAsync(markerIds, removeMarker);
}

export async function indexMarkers(
  markers: Marker[],
  progressCb?: ProgressCallback
): Promise<number> {
  return indexItems(markers, createMarkerSearchDoc, addMarkerSearchDocs, progressCb);
}

export async function buildMarkerIndex(): Promise<void> {
  await buildIndex(indexMap.markers, Marker.getAll, indexMarkers);
}

export interface IMarkerSearchQuery {
  query: string;
  favorite?: boolean;
  bookmark?: boolean;
  rating: number;
  include?: string[];
  exclude?: string[];
  sortBy?: string;
  sortDir?: string;
  skip?: number;
  take?: number;
  page?: number;

  rawQuery?: unknown;
}

export async function searchMarkers(
  options: Partial<IMarkerSearchQuery>,
  shuffleSeed = "default",
  extraFilter: unknown[] = []
): Promise<ISearchResults> {
  const query = searchQuery(options.query, ["name", "actorNames^1.5", "labelNames", "sceneName"]);
  const _shuffle = shuffle(shuffleSeed, query, options.sortBy);

  return performSearch<IMarkerSearchDoc, typeof options>({
    index: indexMap.markers,
    options,
    query: options.rawQuery || {
      bool: {
        ...shuffleSwitch(query, _shuffle),
        filter: [
          ...ratingFilter(options.rating),
          ...bookmark(options.bookmark),
          ...favorite(options.favorite),

          ...includeFilter(options.include),
          ...excludeFilter(options.exclude),

          ...extraFilter,
        ],
      },
    },
  });
}
