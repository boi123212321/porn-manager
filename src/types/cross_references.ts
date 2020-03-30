import * as database from "../database";
import { generateHash } from "../hash";
import * as logger from "../logger";
import { crossReferenceCollection } from "../database";

export default class CrossReference {
  _id: string;
  from: string;
  to: string;

  constructor(from: string, to: string) {
    this._id = "cr_" + generateHash();
    this.from = from;
    this.to = to;
  }

  static async checkIntegrity() {
    const allReferences = await CrossReference.getAll();

    for (const ref of allReferences) {
      if (!ref.to || !ref.from) {
        await CrossReference.removeById(ref._id);
        logger.warn("Removed cross reference " + ref._id);
      }
    }
  }

  static async getAll() {
    return crossReferenceCollection.getAll();
  }

  static async clear(id: string) {
    await CrossReference.removeBySource(id);
    await CrossReference.removeByDest(id);
  }

  static async removeByDest(id: string) {
    for (const ref of await CrossReference.getByDest(id)) {
      await CrossReference.removeById(ref._id);
    }
  }

  static async removeBySource(id: string) {
    for (const ref of await CrossReference.getBySource(id)) {
      await CrossReference.removeById(ref._id);
    }
  }

  static async removeById(_id: string) {
    await crossReferenceCollection.remove(_id);
  }

  static async remove(from: string, to: string) {
    const reference = await CrossReference.get(from, to);
    if (reference) await CrossReference.removeById(reference._id);
  }

  static async getByDest(to: string) {
    return crossReferenceCollection.query("to-index", to);
  }

  static async getBySource(from: string) {
    return crossReferenceCollection.query("from-index", from);
  }

  static async get(from: string, to: string) {
    const fromReferences = await crossReferenceCollection.query(
      "from-index",
      from
    );
    return fromReferences.find(r => r.to == to);
  }
}
