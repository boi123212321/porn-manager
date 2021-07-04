import Actor from "../../types/actor";
import Image from "../../types/image";
import Label from "../../types/label";
import Marker from "../../types/marker";
import Scene from "../../types/scene";

export default {
  async actors(marker: Marker): Promise<Actor[]> {
    const actors = await Marker.getActors(marker);
    return actors.sort((a, b) => a.name.localeCompare(b.name));
  },
  async labels(marker: Marker): Promise<Label[]> {
    const labels = await Marker.getLabels(marker);
    return labels.sort((a, b) => a.name.localeCompare(b.name));
  },
  async thumbnail(marker: Marker): Promise<Image | null> {
    if (marker.thumbnail) return await Image.getById(marker.thumbnail);
    return null;
  },
  async scene(marker: Marker): Promise<Scene | null> {
    return Scene.getById(marker.scene);
  },
};
