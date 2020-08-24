import { labelledItemCollection } from "../database/index";
import { generateHash } from "../hash";

export default class LabelledItem {
  _id: string;
  label: string;
  item: string;
  type: string;

  constructor(item: string, label: string, type: string) {
    this._id = "li_" + generateHash();
    this.item = item;
    this.label = label;
    this.type = type;
  }

  static async getAll(): Promise<LabelledItem[]> {
    return labelledItemCollection.getAll();
  }

  static async getByLabel(label: string): Promise<LabelledItem[]> {
    return labelledItemCollection.query("label-index", label);
  }

  static async getByItem(item: string): Promise<LabelledItem[]> {
    return labelledItemCollection.query("item-index", item);
  }

  static async getByType(type: string): Promise<LabelledItem[]> {
    return labelledItemCollection.query("type-index", type);
  }

  static async get(from: string, to: string): Promise<LabelledItem | undefined> {
    const fromReferences = await labelledItemCollection.query("item-index", from);
    return fromReferences.find((r) => r.label === to);
  }

  static async removeByLabel(id: string): Promise<void> {
    for (const ref of await LabelledItem.getByLabel(id)) {
      await LabelledItem.removeById(ref._id);
    }
  }

  static async removeByItem(id: string): Promise<void> {
    for (const ref of await LabelledItem.getByItem(id)) {
      await LabelledItem.removeById(ref._id);
    }
  }

  static async removeById(_id: string): Promise<void> {
    await labelledItemCollection.remove(_id);
  }
}
