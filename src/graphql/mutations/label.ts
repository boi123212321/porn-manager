import { labelCollection } from "../../database";
import { isMatchingItem } from "../../extractor";
import * as logger from "../../logger";
import { updateScenes } from "../../search/scene";
import Label from "../../types/label";
import LabelledItem from "../../types/labelled_item";
import Scene from "../../types/scene";

type ILabelUpdateOpts = Partial<{
  name: string;
  aliases: string[];
  thumbnail: string;
}>;

export default {
  async removeLabels(_: unknown, { ids }: { ids: string[] }): Promise<boolean> {
    for (const id of ids) {
      const label = await Label.getById(id);

      if (label) {
        await Label.remove(label._id);
        await LabelledItem.removeByLabel(id);
      }
    }
    return true;
  },

  async addLabel(_: unknown, args: { name: string; aliases?: string[] }): Promise<Label> {
    const label = new Label(args.name, args.aliases);

    for (const scene of await Scene.getAll()) {
      if (isMatchingItem(scene.path || scene.name, label, false)) {
        const labels = (await Scene.getLabels(scene)).map((l) => l._id);
        labels.push(label._id);
        await Scene.setLabels(scene, labels);
        await updateScenes([scene]);
        logger.log(`Updated labels of ${scene._id}.`);
      }
    }

    /* for (const image of await Image.getAll()) {
      if (isBlacklisted(image.name)) continue;

      if (isMatchingItem(image.path || image.name, label, false)) {
        const labels = (await Image.getLabels(image)).map((l) => l._id);
        labels.push(label._id);
        await Image.setLabels(image, labels);
        await updateImages([image]);
        logger.log(`Updated labels of ${image._id}.`);
      }
    } */

    await labelCollection.upsert(label._id, label);
    return label;
  },

  async updateLabels(
    _: unknown,
    { ids, opts }: { ids: string[]; opts: ILabelUpdateOpts }
  ): Promise<Label[]> {
    const updatedLabels = [] as Label[];

    for (const id of ids) {
      const label = await Label.getById(id);

      if (label) {
        if (Array.isArray(opts.aliases)) label.aliases = [...new Set(opts.aliases)];

        if (typeof opts.name === "string") label.name = opts.name.trim();

        if (typeof opts.thumbnail === "string") label.thumbnail = opts.thumbnail;

        await labelCollection.upsert(label._id, label);
        updatedLabels.push(label);
      } else {
        throw new Error(`Label ${id} not found`);
      }
    }

    return updatedLabels;
  },
};
