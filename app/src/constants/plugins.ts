import { contextModule } from "@/store/context";

/**
 * Function so that the actor labels are dynamic
 */
export const getEvents = () => ({
  actorCreated: {
    key: "actorCreated",
    label: `${contextModule.actorSingular ?? ""} - ${
      contextModule.actorSingular?.toLowerCase() ?? ""
    } created`,
  },
  actorCustom: {
    key: "actorCustom",
    label: `${contextModule.actorSingular ?? ""} - user triggers plugins`,
  },
  movieCreated: { key: "movieCreated", label: "Movie - movie created" },
  movieCustom: { key: "movieCustom", label: "Movie - user triggers plugins" },
  sceneCreated: { key: "sceneCreated", label: "Scene - scene created" },
  sceneCustom: { key: "sceneCustom", label: "Scene - user triggers plugins" },
  studioCreated: { key: "studioCreated", label: "Studio - studio created" },
  studioCustom: { key: "studioCustom", label: "Studio - user triggers plugins" },
});

/**
 * Function so that the actor labels are dynamic
 */
export const getGlobalSettingsMap = () => ({
  allowSceneThumbnailOverwrite: {
    type: "boolean",
    props: {
      label: "Allow plugins to overwrite scene thumbnail",
    },
  },
  allowActorThumbnailOverwrite: {
    type: "boolean",
    props: {
      label: `Allow plugins to overwrite ${
        contextModule.actorSingular?.toLowerCase() ?? ""
      } images`,
    },
  },
  allowMovieThumbnailOverwrite: {
    type: "boolean",
    props: {
      label: "Allow plugins to overwrite movie images",
    },
  },
  allowStudioThumbnailOverwrite: {
    type: "boolean",
    props: {
      label: "Allow plugins to overwrite studio thumbnail",
    },
  },
  createMissingActors: {
    type: "boolean",
    props: {
      label: "Create actors returned from plugins when not found in library",
    },
  },
  createMissingStudios: {
    type: "boolean",
    props: {
      label: "Create studios returned from plugins when not found in library",
    },
  },
  createMissingLabels: {
    type: "boolean",
    props: {
      label: "Create labels returned from plugins when not found in library",
    },
  },
  createMissingMovies: {
    type: "boolean",
    props: {
      label: "Create movies returned from plugins when not found in library",
    },
  },
  markerDeduplicationThreshold: {
    type: "number",
    props: {
      label: "Threshold in which new markers will be ignored",
      suffix: "s",
    },
  },
});

export const PLUGIN_EXTENSIONS = [".js", ".ts"];
