import { getConfig } from "../../config";
import { ApplyActorLabelsEnum } from "../../config/schema";
import countries, { ICountry } from "../../data/countries";
import { imageCollection, labelCollection } from "../../database";
import { buildFieldExtractor, buildLabelExtractor } from "../../extractor";
import { runPluginsSerial } from "../../plugins";
import { indexImages } from "../../search/image";
import Actor from "../../types/actor";
import { isValidCountryCode } from "../../types/countries";
import Image from "../../types/image";
import Label from "../../types/label";
import { logger } from "../../utils/logger";
import { filterInvalidAliases, validRating } from "../../utils/misc";
import { createImage, createLocalImage } from "../context";

function injectServerFunctions(actor: Actor, createdImages: Image[]) {
  let labels: Label[], rating: number;
  return {
    $getLabels: async () => (labels ??= await Actor.getLabels(actor)),
    $getAverageRating: async () => (rating ??= await Actor.getAverageRating(actor)),
    $createLocalImage: async (path: string, name: string, thumbnail?: boolean) => {
      const img = await createLocalImage(path, name, thumbnail);
      await Image.addActors(img, [actor._id]);
      await imageCollection.upsert(img._id, img);

      if (!thumbnail) {
        createdImages.push(img);
      }
      return img._id;
    },
    $createImage: async (url: string, name: string, thumbnail?: boolean) => {
      const img = await createImage(url, name, thumbnail);
      await Image.setActors(img, [actor._id]);
      await imageCollection.upsert(img._id, img);
      if (!thumbnail) {
        createdImages.push(img);
      }
      return img._id;
    },
  };
}

// This function has side effects
export async function onActorCreate(
  actor: Actor,
  actorLabels: string[],
  event: "actorCreated" | "actorCustom" = "actorCreated"
): Promise<{ actor: Actor; commit: () => Promise<void> }> {
  const config = getConfig();

  const createdImages = [] as Image[];

  const pluginResult = await runPluginsSerial(config, event, {
    actor: JSON.parse(JSON.stringify(actor)) as Actor,
    actorName: actor.name,
    countries: JSON.parse(JSON.stringify(countries)) as ICountry[],
    ...injectServerFunctions(actor, createdImages),
  });

  if (
    typeof pluginResult.thumbnail === "string" &&
    pluginResult.thumbnail.startsWith("im_") &&
    (!actor.thumbnail || config.plugins.allowActorThumbnailOverwrite)
  ) {
    actor.thumbnail = pluginResult.thumbnail;
  }

  if (
    typeof pluginResult.altThumbnail === "string" &&
    pluginResult.altThumbnail.startsWith("im_") &&
    (!actor.altThumbnail || config.plugins.allowActorThumbnailOverwrite)
  ) {
    actor.altThumbnail = pluginResult.altThumbnail;
  }

  if (
    typeof pluginResult.avatar === "string" &&
    pluginResult.avatar.startsWith("im_") &&
    (!actor.avatar || config.plugins.allowActorThumbnailOverwrite)
  ) {
    actor.avatar = pluginResult.avatar;
  }

  if (
    typeof pluginResult.hero === "string" &&
    pluginResult.hero.startsWith("im_") &&
    (!actor.hero || config.plugins.allowActorThumbnailOverwrite)
  ) {
    actor.hero = pluginResult.hero;
  }

  if (typeof pluginResult.name === "string") {
    actor.name = pluginResult.name;
  }

  if (typeof pluginResult.description === "string") {
    actor.description = pluginResult.description;
  }

  if (typeof pluginResult.bornOn === "number") {
    actor.bornOn = new Date(pluginResult.bornOn).valueOf();
  }

  if (typeof pluginResult.addedOn === "number") {
    actor.addedOn = new Date(pluginResult.addedOn).valueOf();
  }

  if (pluginResult.aliases && Array.isArray(pluginResult.aliases)) {
    actor.aliases.push(...pluginResult.aliases);
    actor.aliases = [...new Set(filterInvalidAliases(actor.aliases))];
  }

  if (pluginResult.custom && typeof pluginResult.custom === "object") {
    const localExtractFields = await buildFieldExtractor();
    for (const key in pluginResult.custom) {
      const fields = localExtractFields(key);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      if (fields.length) actor.customFields[fields[0]] = pluginResult.custom[key];
    }
  }

  if (validRating(pluginResult.rating)) {
    actor.rating = pluginResult.rating;
  }

  if (typeof pluginResult.favorite === "boolean") {
    actor.favorite = pluginResult.favorite;
  }

  if (typeof pluginResult.bookmark === "number") {
    actor.bookmark = pluginResult.bookmark;
  }

  if (pluginResult.nationality !== undefined) {
    if (
      typeof pluginResult.nationality === "string" &&
      isValidCountryCode(pluginResult.nationality)
    ) {
      actor.nationality = pluginResult.nationality.toUpperCase();
    } else if (pluginResult.nationality === null) {
      actor.nationality = pluginResult.nationality;
    }
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
    actorLabels.push(...labelIds);
  }

  return {
    actor,
    commit: async () => {
      logger.debug("Committing plugin result");

      for (const image of createdImages) {
        if (
          (event === "actorCreated" &&
            config.matching.applyActorLabels.includes(
              ApplyActorLabelsEnum.enum["plugin:actor:create"]
            )) ||
          (event === "actorCustom" &&
            config.matching.applyActorLabels.includes(
              ApplyActorLabelsEnum.enum["plugin:actor:custom"]
            ))
        ) {
          await Image.setLabels(image, actorLabels);
        }
      }
      await indexImages(createdImages);
    },
  };
}
