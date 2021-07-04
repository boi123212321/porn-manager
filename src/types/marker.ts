import * as path from "path";

import { actorCollection, imageCollection, markerCollection } from "../database";
import { singleScreenshot } from "../ffmpeg/screenshot";
import { searchMarkers } from "../search/marker";
import { generateHash } from "../utils/hash";
import { logger } from "../utils/logger";
import { libraryPath } from "../utils/path";
import Actor from "./actor";
import ActorReference from "./actor_reference";
import { iterate } from "./common";
import Image from "./image";
import Label from "./label";
import Scene from "./scene";

export default class Marker {
  _id: string;
  name: string;
  addedOn = +new Date();
  favorite = false;
  bookmark: number | null = null;
  rating = 0;
  customFields: Record<string, boolean | string | number | string[] | null> = {};
  scene: string;
  time: number; // Time in scene in seconds
  thumbnail?: string | null = null;

  static async iterate(
    func: (scene: Marker) => void | unknown | Promise<void | unknown>,
    extraFilter: unknown[] = []
  ) {
    return iterate(searchMarkers, Marker.getBulk, func, "marker", extraFilter);
  }

  static async getAll(): Promise<Marker[]> {
    return markerCollection.getAll();
  }

  // Function has side effects
  static async createMarkerThumbnail(marker: Marker): Promise<void> {
    const scene = await Scene.getById(marker.scene);
    if (!scene || !scene.path) {
      return;
    }

    logger.verbose(`Creating thumbnail for marker ${marker._id}`);
    const image = new Image(`${marker.name} (thumbnail)`);
    const imagePath = `${path.join(libraryPath("thumbnails/markers"), image._id)}.jpg`;
    image.path = imagePath;
    image.scene = marker.scene;
    marker.thumbnail = image._id;

    const actors = (await Scene.getActors(scene)).map((l) => l._id);
    await Image.setActors(image, actors);

    const labels = (await Marker.getLabels(marker)).map((l) => l._id);
    await Image.setLabels(image, labels);

    await singleScreenshot(scene.path, imagePath, marker.time + 15, 480);
    await imageCollection.upsert(image._id, image);
  }

  static async getActors(marker: Marker): Promise<Actor[]> {
    const references = await ActorReference.getByItem(marker._id);
    return (await actorCollection.getBulk(references.map((r) => r.actor))).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  static async setActors(marker: Marker, actorIds: string[]): Promise<void> {
    return Actor.setForItem(marker._id, actorIds, "marker");
  }

  static async addActors(marker: Marker, actorIds: string[]): Promise<void> {
    return Actor.addForItem(marker._id, actorIds, "marker");
  }

  static async addLabels(marker: Marker, labelIds: string[]): Promise<void> {
    return Label.addForItem(marker._id, labelIds, "marker");
  }

  static async setLabels(marker: Marker, labelIds: string[]): Promise<void> {
    return Label.setForItem(marker._id, labelIds, "marker");
  }

  static async getLabels(marker: Marker): Promise<Label[]> {
    return Label.getForItem(marker._id);
  }

  constructor(name: string, scene: string, time: number) {
    this._id = `mk_${generateHash()}`;
    this.name = name;
    this.scene = scene;
    this.time = Math.round(time);
  }

  static async getAtTime(sceneId: string, time: number, threshold: number) {
    const markers = await Marker.getByScene(sceneId);
    return markers.find((m) => Math.abs(m.time - time) < threshold);
  }

  static async getByScene(sceneId: string): Promise<Marker[]> {
    return markerCollection.query("scene-index", sceneId);
  }

  static async getById(_id: string): Promise<Marker | null> {
    return markerCollection.get(_id);
  }

  static getBulk(_ids: string[]): Promise<Marker[]> {
    return markerCollection.getBulk(_ids);
  }

  static async remove(_id: string): Promise<void> {
    await markerCollection.remove(_id);
  }

  static async removeByScene(sceneId: string): Promise<void> {
    for (const marker of await Marker.getByScene(sceneId)) {
      await Marker.remove(marker._id);
    }
  }
}
