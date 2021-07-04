import { getConfig } from "../../config";
import { labelCollection } from "../../database";
import { buildExtractor } from "../../extractor";
import { indexActors } from "../../search/actor";
import { indexImages } from "../../search/image";
import { indexScenes } from "../../search/scene";
import { indexStudios } from "../../search/studio";
import Actor from "../../types/actor";
import Image from "../../types/image";
import Label from "../../types/label";
import LabelledItem from "../../types/labelled_item";
import Scene from "../../types/scene";
import Studio from "../../types/studio";
import { formatMessage, logger } from "../../utils/logger";
import { filterInvalidAliases } from "../../utils/misc";
import { isHexColor } from "../../utils/string";

type ILabelUpdateOpts = Partial<{
  name: string;
  aliases: string[];
  thumbnail: string;
  color: string;
}>;

export default {
  async attachLabels(
    _: unknown,
    { item, labels }: { item: string; labels: string[] }
  ): Promise<true> {
    if (item.startsWith("sc_")) {
      const scene = await Scene.getById(item);
      if (scene) {
        await Scene.addLabels(scene, labels);
        await indexScenes([scene]);
      }
    } else if (item.startsWith("im_")) {
      const image = await Image.getById(item);
      if (image) {
        await Image.addLabels(image, labels);
        await indexImages([image]);
      }
    } else if (item.startsWith("st_")) {
      const studio = await Studio.getById(item);
      if (studio) {
        await Studio.addLabels(studio, labels);
        await indexStudios([studio]);
      }
    } else if (item.startsWith("ac_")) {
      const actor = await Actor.getById(item);
      if (actor) {
        await Actor.addLabels(actor, labels);
        await indexActors([actor]);
      }
    }

    return true;
  },

  // TODO: bad name, rename; label is not removed, but rather a label reference between 1 label and 1 item
  async removeLabel(_: unknown, { item, label }: { item: string; label: string }): Promise<true> {
    await LabelledItem.remove(item, label);

    if (item.startsWith("sc_")) {
      const scene = await Scene.getById(item);
      if (scene) {
        await indexScenes([scene]);
      }
    } else if (item.startsWith("im_")) {
      const image = await Image.getById(item);
      if (image) {
        await indexImages([image]);
      }
    } else if (item.startsWith("st_")) {
      const studio = await Studio.getById(item);
      if (studio) {
        await indexStudios([studio]);
      }
    } else if (item.startsWith("ac_")) {
      const actor = await Actor.getById(item);
      if (actor) {
        await indexActors([actor]);
      }
    }

    return true;
  },

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
    const aliases = filterInvalidAliases(args.aliases || []);
    const label = new Label(args.name, aliases);

    const config = getConfig();

    if (config.matching.matchCreatedLabels) {
      const localExtractLabels = await buildExtractor(
        () => [label],
        (label) => [label.name, ...label.aliases],
        false
      );
      await Scene.iterate(async (scene) => {
        if (localExtractLabels(scene.path || scene.name).includes(label._id)) {
          await Scene.addLabels(scene, [label._id]);
          await indexScenes([scene]);
          logger.debug(`Updated labels of ${scene._id}.`);
        }
      });
    }

    /* for (const image of await Image.getAll()) {
      if (isBlacklisted(image.name)) continue;

      if (isMatchingItem(image.path || image.name, label, false)) {
        const labels = (await Image.getLabels(image)).map((l) => l._id);
        labels.push(label._id);
        await Image.setLabels(image, labels);
        await indexImages([image]);
        logger.debug(`Updated labels of ${image._id}.`);
      } 
    } */

    logger.debug(`Created label, ${formatMessage(label)}`);
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
        if (Array.isArray(opts.aliases)) {
          label.aliases = [...new Set(filterInvalidAliases(opts.aliases))];
        }

        if (opts.name) {
          label.name = opts.name.trim();
        }

        if (opts.thumbnail) {
          label.thumbnail = opts.thumbnail;
        }

        if (opts.color && isHexColor(opts.color)) {
          label.color = opts.color;
        } else if (opts.color === "") {
          label.color = null;
        }

        await labelCollection.upsert(label._id, label);
        updatedLabels.push(label);
      } else {
        throw new Error(`Label ${id} not found`);
      }
    }

    return updatedLabels;
  },
};
