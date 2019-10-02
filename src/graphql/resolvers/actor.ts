import Scene from "../../types/scene";

export default {
  scenes(obj) {
    return Scene.getByActor(obj.id);
  },
}