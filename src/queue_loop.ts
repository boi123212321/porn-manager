import Axios from "axios";
import https from "https";
import Jimp from "jimp";

import { IConfig } from "./config/schema";
import Image from "./types/image";
import Scene, { ThumbnailFile } from "./types/scene";
import { statAsync } from "./utils/fs/async";
import { protocol } from "./utils/http";
import { handleError, logger } from "./utils/logger";

const pvApi = Axios.create({
  // Ignore self-signed cert errors when connecting to pv api
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

async function getQueueHead(config: IConfig): Promise<Scene> {
  logger.verbose("Getting queue head");
  return (
    await pvApi.get<Scene>(`${protocol(config)}://localhost:${config.server.port}/api/queue/head`, {
      params: {
        password: config.auth.password,
      },
    })
  ).data;
}

export async function queueLoop(config: IConfig): Promise<void> {
  try {
    let queueHead = await getQueueHead(config);

    while (queueHead) {
      try {
        logger.verbose(`Processing "${queueHead.path}"`);
        const data = {
          processed: true,
        } as Record<string, unknown>;
        const images = [] as Image[];
        const thumbs = [] as Image[];

        if (config.processing.generatePreviews && !queueHead.preview) {
          const preview = await Scene.generatePreview(queueHead);

          if (preview) {
            const image = new Image(`${queueHead.name} (preview)`);
            const stats = await statAsync(preview);
            image.path = preview;
            image.scene = queueHead._id;
            image.meta.size = stats.size;

            const jimpImage = await Jimp.read(image.path);
            image.meta.dimensions.width = jimpImage.bitmap.width;
            image.meta.dimensions.height = jimpImage.bitmap.height;

            thumbs.push(image);
            data.preview = image._id;
          } else {
            logger.error("Error generating preview.");
          }
        } else {
          logger.verbose("Skipping preview generation:");
        }

        if (config.processing.generateScreenshots) {
          let screenshots = [] as ThumbnailFile[];
          try {
            screenshots = await Scene.generateScreenshots(queueHead);
          } catch (error) {
            logger.error(error);
          }
          for (let i = 0; i < screenshots.length; i++) {
            const file = screenshots[i];
            const image = new Image(`${queueHead.name} ${i + 1} (screenshot)`);
            image.addedOn += i;
            image.path = file.path;
            image.scene = queueHead._id;
            image.meta.size = file.size;
            images.push(image);
          }
        } else {
          logger.verbose("Skipping screenshot generation");
        }

        logger.debug("Updating scene data & removing item from queue");
        await pvApi.post(
          `${protocol(config)}://localhost:${config.server.port}/api/queue/${queueHead._id}`,
          { scene: data, thumbs, images },
          {
            params: {
              password: config.auth.password,
            },
          }
        );
      } catch (error) {
        handleError("Processing error", error);
        logger.debug("Removing item from queue");
        await pvApi.delete(
          `${protocol(config)}://localhost:${config.server.port}/api/queue/${queueHead._id}`,
          {
            params: {
              password: config.auth.password,
            },
          }
        );
      }
      queueHead = await getQueueHead(config);
    }

    logger.info("Processing done.");
    process.exit(0);
  } catch (error) {
    handleError("Processing error", error);
    process.exit(1);
  }
}
