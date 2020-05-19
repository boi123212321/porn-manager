import Actor from "../../../types/actor";
import * as logger from "../../../logger";
import { searchActors } from "../../../search/actor";

export async function getActors(
  _,
  { query, seed }: { query?: string; seed?: string }
) {
  try {
    const timeNow = +new Date();
    const result = await searchActors(query || "", seed);

    logger.log(
      `Search results: ${result.max_items} hits found in ${
        (Date.now() - timeNow) / 1000
      }s`
    );

    const actors = await Promise.all(result.items.map(Actor.getById));
    logger.log(`Search done in ${(Date.now() - timeNow) / 1000}s.`);

    return {
      numItems: result.max_items,
      numPages: result.num_pages,
      items: actors.filter(Boolean),
    };
  } catch (error) {
    logger.error(error);
  }
}
