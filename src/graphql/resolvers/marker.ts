import Image from "../../types/image";
import Label from "../../types/label";
import Marker from "../../types/marker";

export default {
  async labels(marker: Marker): Promise<Label[]> {
    return await Marker.getLabels(marker);
  },
  async thumbnail(marker: Marker): Promise<Image | null> {
    if (marker.thumbnail) return await Image.getById(marker.thumbnail);
    return null;
  },
};
