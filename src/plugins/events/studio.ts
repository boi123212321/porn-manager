import { getConfig } from "../../config";
import { ApplyStudioLabelsEnum } from "../../config/schema";
import { imageCollection, labelCollection, studioCollection } from "../../database";
import { buildFieldExtractor, buildLabelExtractor, extractStudios } from "../../extractor";
import { runPluginsSerial } from "../../plugins";
import { indexImages, removeImage } from "../../search/image";
import { indexStudios } from "../../search/studio";
import ActorReference from "../../types/actor_reference";
import Image from "../../types/image";
import Label from "../../types/label";
import LabelledItem from "../../types/labelled_item";
import Studio from "../../types/studio";
import { handleError, logger } from "../../utils/logger";
import { filterInvalidAliases } from "../../utils/misc";
import { createImage, createLocalImage } from "../context";

export const MAX_STUDIO_RECURSIVE_CALLS = 4;

function injectServerFunctions(studio: Studio, createdImages: Image[]) {
  let labels: Label[], rating: number, parents: Studio[], subStudios: Studio[];
  return {
    $getLabels: async () => (labels ??= await Studio.getLabels(studio)),
    $getAverageRating: async () => (rating ??= await Studio.getAverageRating(studio)),
    $getParents: async () => (parents ??= await Studio.getParents(studio)),
    $getSubStudios: async () => (subStudios ??= await Studio.getSubStudios(studio._id)),
    $createLocalImage: async (path: string, name: string, thumbnail?: boolean) => {
      const img = await createLocalImage(path, name, thumbnail);
      img.studio = studio._id;
      await imageCollection.upsert(img._id, img);

      if (!thumbnail) {
        createdImages.push(img);
      }

      return img._id;
    },
    $createImage: async (url: string, name: string, thumbnail?: boolean) => {
      const img = await createImage(url, name, thumbnail);
      img.studio = studio._id;
      logger.debug(`Created image ${img._id}`);
      await imageCollection.upsert(img._id, img);
      if (!thumbnail) {
        createdImages.push(img);
      }
      return img._id;
    },
  };
}

// This function has side effects
export async function onStudioCreate(
  studio: Studio,
  studioLabels: string[],
  event: "studioCreated" | "studioCustom" = "studioCreated",
  studioStack: string[] = []
): Promise<Studio> {
  const config = getConfig();

  const createdImages = [] as Image[];

  const pluginResult = await runPluginsSerial(config, event, {
    studio: JSON.parse(JSON.stringify(studio)) as Studio,
    studioName: studio.name,
    ...injectServerFunctions(studio, createdImages),
  });

  if (
    typeof pluginResult.thumbnail === "string" &&
    pluginResult.thumbnail.startsWith("im_") &&
    (!studio.thumbnail || config.plugins.allowStudioThumbnailOverwrite)
  ) {
    studio.thumbnail = pluginResult.thumbnail;
  }

  if (typeof pluginResult.name === "string") {
    studio.name = pluginResult.name;
  }

  if (typeof pluginResult.description === "string") {
    studio.description = pluginResult.description;
  }

  if (typeof pluginResult.addedOn === "number") {
    studio.addedOn = new Date(pluginResult.addedOn).valueOf();
  }

  if (pluginResult.custom && typeof pluginResult.custom === "object") {
    const localExtractFields = await buildFieldExtractor();
    for (const key in pluginResult.custom) {
      const fields = localExtractFields(key);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      if (fields.length) studio.customFields[fields[0]] = pluginResult.custom[key];
    }
  }

  if (typeof pluginResult.favorite === "boolean") {
    studio.favorite = pluginResult.favorite;
  }

  if (typeof pluginResult.bookmark === "number") {
    studio.bookmark = pluginResult.bookmark;
  }

  if (pluginResult.labels && Array.isArray(pluginResult.labels)) {
    const labelIds = [] as string[];
    const localExtractLabels = await buildLabelExtractor();
    for (const labelName of pluginResult.labels) {
      const extractedIds = localExtractLabels(labelName);
      if (extractedIds.length) {
        labelIds.push(...extractedIds);
        logger.verbose(`Found ${extractedIds.length} labels for ${<string>labelName}:`);
        logger.debug(extractedIds);
      } else if (config.plugins.createMissingLabels) {
        const label = new Label(labelName);
        labelIds.push(label._id);
        await labelCollection.upsert(label._id, label);
        logger.debug(`Created label ${label.name}`);
      }
    }
    studioLabels.push(...labelIds);
  }

  if (
    !studio.parent &&
    pluginResult.parent &&
    typeof pluginResult.parent === "string" &&
    studio.name !== pluginResult.parent // studio cannot be it's own parent to prevent circular references
  ) {
    const studioId = (await extractStudios(pluginResult.parent))[0] || null;

    if (studioId && studioId !== studio._id) {
      // Prevent linking parent to itself
      studio.parent = studioId;
    } else if (
      studioId !== studio._id &&
      config.plugins.createMissingStudios &&
      studioStack.length < MAX_STUDIO_RECURSIVE_CALLS &&
      !studioStack.some((prevName) => prevName === studio.name) // Prevent linking parent to a grandchild
    ) {
      const createdStudioLabels: string[] = [];
      let createdStudio = new Studio(pluginResult.parent);

      try {
        const nextStack = [...studioStack, studio.name];
        createdStudio = await onStudioCreate(
          createdStudio,
          createdStudioLabels,
          "studioCreated",
          nextStack
        );

        await Studio.findUnmatchedScenes(
          createdStudio,
          config.matching.applyStudioLabels.includes(
            ApplyStudioLabelsEnum.enum["event:studio:create"]
          )
            ? createdStudioLabels
            : []
        );
      } catch (error) {
        handleError(`findUnmatchedScenes error`, error);
      }

      if (studio.name === createdStudio.name) {
        logger.error(
          `For current studio "${studio.name}", tried run plugin on parent "${pluginResult.parent}", but plugin returned the current studio. Ignoring result`
        );
        const thumbnailImage = createdStudio.thumbnail
          ? await Image.getById(createdStudio.thumbnail)
          : null;
        if (thumbnailImage) {
          await Image.remove(thumbnailImage);
          await removeImage(thumbnailImage._id);
          await LabelledItem.removeByItem(thumbnailImage._id);
          await ActorReference.removeByItem(thumbnailImage._id);
        }
      } else {
        await studioCollection.upsert(createdStudio._id, createdStudio);
        logger.debug(`Created studio ${createdStudio.name}`);
        studio.parent = createdStudio._id;
        logger.debug(`Attached ${studio.name} to studio ${createdStudio.name}`);
        await indexStudios([createdStudio]);
      }
    }
  }

  if (pluginResult.aliases && Array.isArray(pluginResult.aliases)) {
    if (studio.aliases) {
      studio.aliases.push(...pluginResult.aliases);
    } else {
      studio.aliases = [...(pluginResult.aliases as string[])];
    }
    studio.aliases = [...new Set(filterInvalidAliases(studio.aliases))];
  }

  const shouldApplyStudioLabels =
    (event === "studioCreated" &&
      config.matching.applyStudioLabels.includes(
        ApplyStudioLabelsEnum.enum["plugin:studio:create"]
      )) ||
    (event === "studioCustom" &&
      config.matching.applyStudioLabels.includes(
        ApplyStudioLabelsEnum.enum["plugin:studio:custom"]
      ));
  for (const image of createdImages) {
    if (shouldApplyStudioLabels) {
      await Image.setLabels(image, studioLabels);
    }
    await indexImages([image]);
  }

  return studio;
}
