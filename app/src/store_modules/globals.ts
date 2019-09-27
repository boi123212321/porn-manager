import Star from '@/classes/actor';
import Vue from "vue";
import CustomField, { CustomFieldType } from '@/classes/custom_field';
import path from "path";
import { VuexModule, Module, Mutation, Action } from "vuex-class-modules";
import store from "@/store";
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

@Module({ generateMutationSetters: true })
class GlobalsModule extends VuexModule {
  copyThumbnails = true
  thumbnailsOnImportInterval = 60
  ffmpegPath = ffmpegPath
  ffprobePath = ffprobePath

  theme = {
    primary: "#0492BB",
    secondary: "#D8215E",
    dark: false,
  }

  customFields = [
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
  ] as CustomField[];

  @Mutation setPrimaryColor(col: string) {
    this.theme.primary = col;
  }
  @Mutation setSecondaryColor(col: string) {
    this.theme.secondary = col;
  }
  @Mutation setDarkMode(mode: boolean) {
    this.theme.dark = mode;
  }

  @Mutation
  set(newState: GlobalsModule) {
    for (const key in newState) {
      Vue.set(this, key, (<any>newState)[key]);
    }
  }

  @Mutation
  addCustomField(field: CustomField) {
    this.customFields.push(field);
  }

  @Mutation
  setCustomFields(fields: CustomField[]) {
    this.customFields = fields;
  }

  get primaryColor() {
    return this.theme.primary;
  }

  get secondaryColor() {
    return this.theme.secondary;
  }

  get darkMode() {
    return this.theme.dark;
  }

  get get() {
    return this;
  }

  get getCustomFieldNames() {
    return this.customFields.map(cf => cf.name);
  }

  get getCustomFields() {
    return this.customFields;
  }
}

export default new GlobalsModule({ store, name: "globals" });