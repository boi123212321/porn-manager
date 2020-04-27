import Scene from "../../types/scene";
import SceneView from "../../types/watch";

export default {
  async scene(view: SceneView) {
    return await Scene.getById(view.scene);
  },
};
