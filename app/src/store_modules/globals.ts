import Star from '@/classes/actor';
import Vue from "vue";
import CustomField, { CustomFieldType } from '@/classes/custom_field';
import path from "path";
var os = require("os");

var platform = os.platform();
//patch for compatibilit with electron-builder, for smart built process.
if (platform == "darwin") {
  platform = "mac";
} else if (platform == "win32") {
  platform = "win";
}
//adding browser, for use case when module is bundled using browserify. and added to html using src.
if (
  platform !== "linux" &&
  platform !== "mac" &&
  platform !== "win" &&
  platform !== "browser"
) {
  console.error("Unsupported platform.", platform);
  process.exit(1);
}

var arch = os.arch();
if (platform === "mac" && arch !== "x64") {
  console.error("Unsupported architecture.");
  process.exit(1);
}

const ffmpegPath = path.join(
  process.cwd(),
  "bin/",
  platform,
  "ffmpeg/",
  arch,
  platform === "win" ? "ffmpeg.exe" : "ffmpeg"
);

const ffprobePath = path.join(
  process.cwd(),
  "bin/",
  platform,
  "ffprobe/",
  arch,
  platform === "win" ? "ffprobe.exe" : "ffprobe"
);

type RootState = {
  settings: {
    theme: {
      primaryColor: string;
      secondaryColor: string;
      darkMode: boolean;
    },
    themeColor: string;
    copyThumbnails: boolean;
    darkMode: boolean;
    thumbnailsOnImportInterval: number;
    ffmpegPath: string;
    ffprobePath: string;
  };
  customFields: CustomField[];
}

export default {
  namespaced: true,

  state: {
    settings: {
      theme: {
        primaryColor: "indigo",
        secondaryColor: "pink",
        darkMode: false,
      },
      copyThumbnails: true,
      thumbnailsOnImportInterval: 60,
      ffmpegPath,
      ffprobePath
    },
    customFields: [
      {
        name: "Nationality",
        values: [
          "United States",
          "United Kingdom",
          "Russia",
          "Ukraine",
          "Czech Republic",
          "France",
          "Spain",
          "Germany"
        ],
        type: CustomFieldType.SELECT
      },
      {
        name: "Ethnicity",
        values: [
          "Caucasian",
          "Black",
          "Asian",
          "Hispanic"
        ],
        type: CustomFieldType.SELECT
      },
      {
        name: "Hair Color(s)",
        values: [
          "Brown",
          "Black",
          "Blonde",
          "Red",
          "Colored"
        ],
        type: CustomFieldType.MULTI_SELECT
      },
      {
        name: "Eye Color",
        values: [
          "Amber",
          "Brown",
          "Blue",
          "Green",
          "Gray",
          "Hazel"
        ],
        type: CustomFieldType.SELECT
      },
      {
        name: "Year of birth",
        values: null,
        type: CustomFieldType.NUMBER
      },
      {
        name: "Height",
        values: null,
        type: CustomFieldType.NUMBER
      },
    ]
  },
  mutations: {
    set(state: RootState, newState: RootState) {
      Vue.set(state, "settings", newState.settings);
      state.customFields = newState.customFields;
    },
    setDarkMode(state: RootState, bool: boolean) {
      state.settings.theme.darkMode = bool;
    },
    setPrimaryColor(state: RootState, col: string) {
      state.settings.theme.primaryColor = col;
    },
    setSecondaryColor(state: RootState, col: string) {
      state.settings.theme.secondaryColor = col;
    },
    addCustomField(state: RootState, field: CustomField) {
      state.customFields.push(field);
    }
  },
  actions: {
  },
  getters: {
    get(state: RootState) {
      return state;
    },
    primaryColor(state: RootState) {
      return state.settings.theme.primaryColor;
    },
    secondaryColor(state: RootState) {
      return state.settings.theme.secondaryColor;
    },
    darkMode(state: RootState) {
      return state.settings.theme.darkMode;
    },
    getCustomFieldNames(state: RootState) {
      return state.customFields.map(cf => cf.name);
    }
  }
}