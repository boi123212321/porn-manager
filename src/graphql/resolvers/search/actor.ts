import * as logger from "../../../logger";
import { searchActors } from "../../../search/actor";
import Actor from "../../../types/actor";

export async function getUnwatchedActors(
  _: unknown,
  { skip, take, seed }: { take?: number; skip?: number; seed?: string }
): Promise<(Actor | null)[] | undefined> {
  try {
    const timeNow = +new Date();
    const result = await searchActors(
      `query:'' take:${take || 0} skip:${skip || 0}`,
      seed,
      (tree) => {
        tree.children.push({
          condition: {
            operation: "=",
            property: "numViews",
            type: "number",
            value: 0,
          },
        });
      }
    );

    logger.log(
      `Search results: ${result.max_items} hits found in ${(Date.now() - timeNow) / 1000}s`
    );

    const actors = await Promise.all(result.items.map(Actor.getById));
    logger.log(`Search done in ${(Date.now() - timeNow) / 1000}s.`);

    return actors.filter(Boolean);
  } catch (error) {
    logger.error(error);
  }
}

export async function getActors(
  _: unknown,
  { query, seed }: { query?: string; seed?: string }
): Promise<
  | {
      numItems: number;
      numPages: number;
      items: (Actor | null)[];
    }
  | undefined
> {
  try {
    const timeNow = +new Date();
    const result = await searchActors(query || "", seed);

    logger.log(
      `Search results: ${result.max_items} hits found in ${(Date.now() - timeNow) / 1000}s`
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
