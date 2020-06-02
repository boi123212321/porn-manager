import { actorReferenceCollection } from "../database/index";
import { generateHash } from "../hash";

export default class ActorReference {
  _id: string;
  item: string;
  actor: string;
  type: string;

  constructor(item: string, actor: string, type: string) {
    this._id = "ar_" + generateHash();
    this.item = item;
    this.actor = actor;
    this.type = type;
  }

  static async getAll(): Promise<ActorReference[]> {
    return actorReferenceCollection.getAll();
  }

  static async getByActor(label: string): Promise<ActorReference[]> {
    return actorReferenceCollection.query("actor-index", label);
  }

  static async getByItem(item: string): Promise<ActorReference[]> {
    return actorReferenceCollection.query("item-index", item);
  }

  static async getByType(type: string): Promise<ActorReference[]> {
    return actorReferenceCollection.query("type-index", type);
  }

  static async get(from: string, to: string): Promise<ActorReference | undefined> {
    const fromReferences = await actorReferenceCollection.query("item-index", from);
    return fromReferences.find((r) => r.actor === to);
  }

  static async removeByActor(id: string): Promise<void> {
    for (const ref of await ActorReference.getByActor(id)) {
      await ActorReference.removeById(ref._id);
    }
  }

  static async removeByItem(id: string): Promise<void> {
    for (const ref of await ActorReference.getByItem(id)) {
      await ActorReference.removeById(ref._id);
    }
  }

  static async removeById(_id: string): Promise<void> {
    await actorReferenceCollection.remove(_id);
  }
}
