import * as logger from "../../../logger";
import { searchScenes } from "../../../search/scene";
import { sceneCollection } from "../../../database";

export async function getScenes(
  _,
  { query, seed }: { query: string | undefined; seed?: string }
) {
  try {
    const timeNow = +new Date();
    const result = await searchScenes(query || "", seed);

    logger.log(
      `Search results: ${result.max_items} hits found in ${
        (Date.now() - timeNow) / 1000
      }s`
    );

    const scenes = await sceneCollection.getBulk(result.items);

    logger.log(`Search done in ${(Date.now() - timeNow) / 1000}s.`);

    return {
      numItems: result.max_items,
      numPages: result.num_pages,
      items: scenes.filter(Boolean),
    };
  } catch (error) {
    logger.error(error);
  }
}
