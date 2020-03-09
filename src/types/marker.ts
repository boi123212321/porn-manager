import * as database from "../database";
import { generateHash } from "../hash";
import Scene from "./scene";
import CrossReference from "./cross_references";
import * as logger from "../logger";
import { mapAsync } from "./utility";
import Label from "./label";

export default class Marker {
  _id: string;
  name: string;
  addedOn = +new Date();
  favorite: boolean = false;
  bookmark: number | null = null; // TODO: replace with timestamp
  rating: number = 0;
  customFields: any = {};
  scene: string;
  time: number; // Time in scene in seconds
  thumbnail?: string | null = null;

  static async getAll() {
    return (await database.find(database.store.markers, {})) as Marker[];
  }

  static async checkIntegrity() {
    const allMarkers = await Marker.getAll();

    for (const marker of allMarkers) {
      const markerId = marker._id.startsWith("st_")
        ? marker._id
        : `st_${marker._id}`;

      if (typeof marker.bookmark == "boolean") {
        logger.log(`Setting bookmark to timestamp...`);
        const time = marker.bookmark ? marker.addedOn : null;
        await database.update(
          database.store.markers,
          { _id: markerId },
          { $set: { bookmark: time } }
        );
      }
    }
  }

  static async setLabels(marker: Marker, labelIds: string[]) {
    const references = await CrossReference.getBySource(marker._id);

    const oldLabelReferences = references
      .filter(r => r.to.startsWith("la_"))
      .map(r => r._id);

    for (const id of oldLabelReferences) {
      await database.remove(database.store.crossReferences, { _id: id });
    }

    for (const id of [...new Set(labelIds)]) {
      const crossReference = new CrossReference(marker._id, id);
      logger.log("Adding label to marker: " + JSON.stringify(crossReference));
      await database.insert(database.store.crossReferences, crossReference);
    }
  }

  static async getLabels(marker: Marker) {
    const references = await CrossReference.getBySource(marker._id);
    return (
      await mapAsync(
        references.filter(r => r.to.startsWith("la_")),
        r => Label.getById(r.to)
      )
    ).filter(Boolean) as Label[];
  }

  static async filterCustomField(fieldId: string) {
    await database.update(
      database.store.markers,
      {},
      { $unset: { [`customFields.${fieldId}`]: true } }
    );
  }

  constructor(name: string, scene: string, time: number) {
    this._id = "mk_" + generateHash();
    this.name = name;
    this.scene = scene;
    this.time = Math.round(time);
  }

  static async getById(_id: string) {
    return (await database.findOne(database.store.markers, {
      _id
    })) as Marker | null;
  }

  static async remove(_id: string) {
    await database.remove(database.store.markers, { _id });
  }

  static async removeByScene(scene: Scene) {
    await database.remove(database.store.markers, { scene: scene._id });
  }
}
