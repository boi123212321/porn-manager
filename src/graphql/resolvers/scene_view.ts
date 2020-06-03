import Scene from "../../types/scene";
import SceneView from "../../types/watch";

export default {
  async scene(view: SceneView): Promise<Scene | null> {
    return await Scene.getById(view.scene);
  },
};
