import Scene from "../../types/scene";
import Image from "../../types/image";
import Actor from "../../types/actor";
import Label from "../../types/label";

export default {
  scenes(actor: Actor) {
    return Scene.getByActor(actor.id);
  },
  images(actor: Actor) {
    return Image.getByActor(actor.id);
  },
  labels(actor: Actor) {
    return actor.labels.map(id => Label.getById(id));
  },
  thumbnail(actor: Actor) {
    if (actor.thumbnail)
      return Image.getById(actor.thumbnail);
    return null;
  }
}