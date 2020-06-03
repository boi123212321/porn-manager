import Image from "../../types/image";
import Label from "../../types/label";

export default {
  async thumbnail(label: Label): Promise<Image | null> {
    if (label.thumbnail) return await Image.getById(label.thumbnail);
    return null;
  },
};
