import Image from "../../../types/image";
import * as logger from "../../../logger";
import { searchImages } from "../../../search/image";

export async function getImages(
  _,
  {
    query,
    auto, // TODO: deprecated?
    seed,
  }: { query: string | undefined; auto?: boolean | null; seed?: string }
) {
  try {
    const timeNow = +new Date();
    const result = await searchImages(query || "", seed);

    logger.log(
      `Search results: ${result.max_items} hits found in ${
        (Date.now() - timeNow) / 1000
      }s`
    );

    const images = await Promise.all(result.items.map(Image.getById));
    logger.log(`Search done in ${(Date.now() - timeNow) / 1000}s.`);

    return {
      numItems: result.max_items,
      numPages: result.num_pages,
      items: images.filter(Boolean),
    };
  } catch (error) {
    logger.error(error);
  }
}
