import Scene from "../../types/scene";
import Image from "../../types/image";
import Actor from "../../types/actor";
import Label from "../../types/label";

export default {
  actors(scene: Scene) {
    return scene.actors.map(id => Actor.getById(id));
  },
  images(scene: Scene) {
    return Image.getByScene(scene.id);
  },
  labels(scene: Scene) {
    return scene.labels.map(id => Label.getById(id));
  },
  thumbnail(scene: Scene) {
    if (scene.thumbnail)
      return Image.getById(scene.thumbnail);
    return null;
  }
}