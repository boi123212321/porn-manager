import { SearchIndex, tokenize } from "./index";
import Studio from "../types/studio";

export interface IStudioSearchDoc {
  _id: string;
  addedOn: number;
  name: string;
  labels: { _id: string; name: string; aliases: string[] }[];
  bookmark: boolean;
  favorite: boolean;
  // rating: number;
  numScenes: number;
}

export async function createStudioSearchDoc(
  studio: Studio
): Promise<IStudioSearchDoc> {
  const labels = await Studio.getLabels(studio);
  // const actors = await Studio.getActors(studio);

  return {
    _id: studio._id,
    addedOn: studio.addedOn,
    name: studio.name,
    labels: labels.map(l => ({
      _id: l._id,
      name: l.name,
      aliases: l.aliases
    })),
    // rating: studio.rating,
    bookmark: studio.bookmark,
    favorite: studio.favorite,
    numScenes: (await Studio.getScenes(studio)).length
  };
}

export const studioIndex = new SearchIndex(
  (doc: IStudioSearchDoc) => {
    return [
      ...tokenize(doc.name),
      ...doc.labels.map(l => tokenize(l.name)).flat()
      // TODO: label aliases
    ];
  },
  (studio: IStudioSearchDoc) => studio._id
);

export async function buildStudioIndex() {
  const timeNow = +new Date();
  console.log("Building studio index...");
  for (const studio of await Studio.getAll()) {
    studioIndex.add(await createStudioSearchDoc(studio));
  }
  console.log(`Build done in ${(Date.now() - timeNow) / 1000}s.`);
}
