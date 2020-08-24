import Actor from "../../types/actor";
import Image from "../../types/image";
import Label from "../../types/label";
import Scene from "../../types/scene";
import Studio from "../../types/studio";

export default {
  async actors(image: Image): Promise<Actor[]> {
    return await Image.getActors(image);
  },
  async scene(image: Image): Promise<Scene | null> {
    if (image.scene) return await Scene.getById(image.scene);
    return null;
  },
  async labels(image: Image): Promise<Label[]> {
    return await Image.getLabels(image);
  },
  async studio(image: Image): Promise<Studio | null> {
    if (image.studio) return Studio.getById(image.studio);
    return null;
  },
  color(image: Image): string | null {
    return Image.color(image) || null;
  },
};
