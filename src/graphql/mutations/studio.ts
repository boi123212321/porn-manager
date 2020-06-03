import * as database from "../../database";
import { studioCollection } from "../../database";
import { stripStr } from "../../extractor";
import * as logger from "../../logger";
import { updateScenes } from "../../search/scene";
import { index as studioIndex, indexStudios } from "../../search/studio";
import Image from "../../types/image";
import LabelledItem from "../../types/labelled_item";
import Movie from "../../types/movie";
import Scene from "../../types/scene";
import Studio from "../../types/studio";

type IStudioUpdateOpts = Partial<{
  name: string;
  description: string;
  thumbnail: string;
  favorite: boolean;
  bookmark: boolean;
  parent: string | null;
  labels: string[];
  aliases: string[];
}>;

export default {
  async addStudio(_, { name }: { name: string }): Promise<Studio> {
    const studio = new Studio(name);

    for (const scene of await Scene.getAll()) {
      const perms = stripStr(scene.path || scene.name);

      if (scene.studio === null && perms.includes(stripStr(studio.name))) {
        scene.studio = studio._id;
        await database.sceneCollection.upsert(scene._id, scene);
        await updateScenes([scene]);
        logger.log(`Updated scene ${scene._id}`);
      }
    }

    await studioCollection.upsert(studio._id, studio);
    await indexStudios([studio]);
    return studio;
  },

  async updateStudios(
    _,
    { ids, opts }: { ids: string[]; opts: IStudioUpdateOpts }
  ): Promise<Studio[]> {
    const updatedStudios = [] as Studio[];

    for (const id of ids) {
      const studio = await Studio.getById(id);

      if (studio) {
        if (Array.isArray(opts.aliases)) studio.aliases = [...new Set(opts.aliases)];

        if (typeof opts.name === "string") studio.name = opts.name.trim();

        if (typeof opts.description === "string") studio.description = opts.description.trim();

        if (typeof opts.thumbnail === "string") studio.thumbnail = opts.thumbnail;

        if (opts.parent !== undefined) studio.parent = opts.parent;

        if (typeof opts.bookmark === "number" || opts.bookmark === null)
          studio.bookmark = opts.bookmark;

        if (typeof opts.favorite === "boolean") studio.favorite = opts.favorite;

        if (Array.isArray(opts.labels)) await Studio.setLabels(studio, opts.labels);

        await studioCollection.upsert(studio._id, studio);
        updatedStudios.push(studio);
      }

      await indexStudios(updatedStudios);
    }

    return updatedStudios;
  },

  async removeStudios(_, { ids }: { ids: string[] }): Promise<boolean> {
    for (const id of ids) {
      const studio = await Studio.getById(id);

      if (studio) {
        await studioCollection.remove(studio._id);
        await studioIndex.remove([studio._id]);
        await Studio.filterStudio(studio._id);
        await Scene.filterStudio(studio._id);
        await Movie.filterStudio(studio._id);
        await Image.filterStudio(studio._id);

        await LabelledItem.removeByItem(studio._id);
      }
    }
    return true;
  },
};
