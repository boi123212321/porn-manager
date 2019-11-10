import Scene from "../../types/scene";
import Image from "../../types/image";
import Label from "../../types/label";
import Actor from "../../types/actor";

export default {
  actors(image: Image) {
    return image.actors.map(id => Actor.getById(id));
  },
  scene(image: Image) {
    if (image.scene)
      return Scene.getById(image.scene);
    return null;
  },
  labels(image: Image) {
    return image.labels.map(id => Label.getById(id));
  }
}