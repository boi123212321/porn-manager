import { viewCollection } from "../database/index";
import { generateHash } from "../hash";

export default class SceneView {
  _id: string;
  date: number;
  scene: string;

  static async getByScene(sceneId: string) {
    const items = await viewCollection.query("scene-index", sceneId);
    return items.sort((a, b) => a.date - b.date);
  }

  static async getCount(sceneId: string) {
    return (await SceneView.getByScene(sceneId)).length;
  }

  static async getAll(): Promise<SceneView[]> {
    const items = await viewCollection.getAll();
    return items.sort((a, b) => a.date - b.date);
  }

  constructor(sceneId: string, date: number) {
    this._id = "sc_" + generateHash();
    this.date = date;
    this.scene = sceneId;
  }
}
