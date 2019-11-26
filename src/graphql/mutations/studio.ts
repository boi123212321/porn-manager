import * as database from "../../database";
import Studio from "../../types/studio";

type IStudioUpdateOpts = Partial<{
  name: string;
  description: string;
  thumbnail: string;
  favorite: boolean;
  bookmark: boolean;
  parent: string;
}>;

export default {
  async addStudio(_, { name }: { name: string }) {
    const studio = new Studio(name);
    await database.insert(database.store.studios, studio);
    return studio;
  },

  async updateStudios(
    _,
    { ids, opts }: { ids: string[]; opts: IStudioUpdateOpts }
  ) {
    const updatedStudios = [] as Studio[];

    for (const id of ids) {
      const studio = await Studio.getById(id);

      if (studio) {
        if (typeof opts.name == "string") studio.name = opts.name.trim();

        if (typeof opts.description == "string")
          studio.description = opts.description.trim();

        if (typeof opts.thumbnail == "string")
          studio.thumbnail = opts.thumbnail;

        if (typeof opts.parent == "string") studio.parent = opts.parent;

        if (typeof opts.bookmark == "boolean") studio.bookmark = opts.bookmark;

        if (typeof opts.favorite == "boolean") studio.favorite = opts.favorite;

        await database.update(
          database.store.studios,
          { _id: studio._id },
          studio
        );
        updatedStudios.push(studio);
      }
    }

    return updatedStudios;
  }
};
