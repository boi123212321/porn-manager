<template>
  <SettingsWrapper>
    <v-card-title class="pl-0 pt-0">General</v-card-title>
    <v-card class="mb-2">
      <v-card-text>
        <v-row>
          <v-col class="pt-0" :cols="12" :sm="6" :md="12">
            <div>
              <v-btn
                color="gray darken-4"
                depressed
                dark
                @click="toggleDarkMode"
                class="text-none my-3"
                >Switch to {{ this.$vuetify.theme.dark ? "Light mode" : "Dark mode" }}</v-btn
              >
              <v-checkbox
                color="primary"
                hide-details
                v-model="showCardLabels"
                label="Show card labels on overview"
              />
              <v-checkbox
                color="primary"
                hide-details
                label="Show experimental (unstable) features"
                v-model="experimental"
              />
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card-title class="pl-0">Scenes</v-card-title>
    <v-card class="mb-2">
      <v-card-text>
        <v-row>
          <v-col class="pt-0" :cols="12" :sm="6" :md="12">
            <div>
              <v-subheader class="pl-0">Scene cards aspect ratio</v-subheader>
              <v-divider></v-divider>
              <v-radio-group v-model="sceneRatio">
                <v-radio color="primary" :value="1" label="Square"></v-radio>
                <v-radio color="primary" :value="16 / 9" label="16:9"></v-radio>
                <v-radio color="primary" :value="4 / 3" label="4:3"></v-radio>
              </v-radio-group>
            </div>

            <div>
              <v-subheader class="pl-0">Video player</v-subheader>
              <v-divider></v-divider>
              <v-checkbox
                color="primary"
                hide-details
                v-model="scenePauseOnUnfocus"
                label="Pause video on window unfocus"
              />
              <v-checkbox
                color="primary"
                hide-details
                label="Play scene preview on mouse hover"
                v-model="scenePreviewOnMouseHover"
              />
              <v-row class="mt-3">
                <v-col class="pt-0" :cols="12" :sm="12" :md="6">
                  <v-text-field
                    :rules="seekRules"
                    color="primary"
                    v-model="sceneSeekBackward"
                    label="Seek backward duration"
                    suffix="s"
                    type="number"
                  />
                </v-col>
                <v-col class="pt-0" :cols="12" :sm="12" :md="6">
                  <v-text-field
                    :rules="seekRules"
                    color="primary"
                    v-model="sceneSeekForward"
                    label="Seek forward duration"
                    suffix="s"
                    type="number"
                  />
                </v-col>
              </v-row>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card-title class="pl-0">Actors</v-card-title>
    <v-card class="mb-2">
      <v-card-text>
        <v-row>
          <v-col class="pt-0" :cols="12" :sm="6" :md="12">
            <div>
              <v-subheader class="pl-0">Actor cards aspect ratio</v-subheader>
              <v-divider></v-divider>
              <v-radio-group v-model="actorRatio">
                <v-radio color="primary" :value="1" label="Square"></v-radio>
                <v-radio color="primary" :value="9 / 16" label="9:16"></v-radio>
                <v-radio color="primary" :value="3 / 4" label="3:4"></v-radio>
              </v-radio-group>
            </div>

            <div>
              <v-subheader class="pl-0">Actor cards</v-subheader>
              <v-divider></v-divider>
              <v-checkbox
                color="primary"
                hide-details
                label="Fill actor thumbnails"
                v-model="fillActorCards"
              />
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card-title class="pl-0">Movies</v-card-title>
    <v-card class="mb-2">
      <v-card-text>
        <v-row>
          <v-col class="pt-0" :cols="12" :sm="6" :md="12">
            <div>
              <v-subheader class="pl-0">Details page</v-subheader>
              <v-divider></v-divider>
              <v-checkbox
                color="primary"
                label="Use 3D viewer as default viewer"
                hint="You can always enter the fullscreen 3D viewer regardless of this setting"
                persistent-hint
                v-model="defaultDVDShow3d"
              />
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </SettingsWrapper>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { contextModule } from "@/store/context";
import SettingsWrapper from "@/components/SettingsWrapper.vue";

@Component({
  components: {
    SettingsWrapper,
  },
})
export default class UI extends Vue {
  seekRules = [
    (v: string | number) => {
      v = typeof v === "string" ? parseFloat(v) : v;
      return !Number.isNaN(v) || "Value is not an integer";
    },
    (v: string | number) => {
      v = typeof v === "string" ? parseFloat(v) : v;
      return v > 0 || "Value must be greater than 0";
    },
    (v: string | number) => {
      v = typeof v === "string" ? parseFloat(v) : v;
      return v % 1 === 0 || "Value msut be an integer";
    },
  ];

  set experimental(val: boolean) {
    if (val) {
      localStorage.setItem("pm_experimental", "true");
    } else {
      localStorage.removeItem("pm_experimental");
    }
    contextModule.toggleExperimental(val);
  }

  get experimental() {
    return contextModule.experimental;
  }

  set fillActorCards(val: boolean) {
    localStorage.setItem("pm_fillActorCards", val.toString());
    contextModule.toggleActorCardStyle(val);
  }

  get fillActorCards() {
    return contextModule.fillActorCards;
  }

  set showCardLabels(val: boolean) {
    localStorage.setItem("pm_showCardLabels", val.toString());
    contextModule.toggleCardLabels(val);
  }

  get showCardLabels() {
    return contextModule.showCardLabels;
  }

  set actorRatio(val: number) {
    localStorage.setItem("pm_actorRatio", val.toString());
    contextModule.setActorAspectRatio(val);
  }

  get actorRatio() {
    return contextModule.actorAspectRatio;
  }

  set sceneRatio(val: number) {
    localStorage.setItem("pm_sceneRatio", val.toString());
    contextModule.setSceneAspectRatio(val);
  }

  get sceneRatio() {
    return contextModule.sceneAspectRatio;
  }

  set scenePauseOnUnfocus(val: boolean) {
    localStorage.setItem("pm_scenePauseOnUnfocus", val.toString());
    contextModule.setScenePauseOnUnfocus(val);
  }

  get scenePauseOnUnfocus() {
    return contextModule.scenePauseOnUnfocus;
  }

  set scenePreviewOnMouseHover(val: boolean) {
    localStorage.setItem("pm_scenePreviewOnMouseHover", val.toString());
    contextModule.setScenePreviewOnMouseHover(val);
  }

  get scenePreviewOnMouseHover() {
    return contextModule.scenePreviewOnMouseHover;
  }

  set sceneSeekBackward(val: number | string) {
    if (this.seekRules.some((rule) => rule(val) !== true)) {
      // Don't save the value if it is invalid
      return;
    }
    localStorage.setItem("pm_sceneSeekBackward", val.toString());
    val = typeof val === "string" ? parseInt(val) : val;
    val = Number.isNaN(val) ? 5 : val;
    contextModule.setSceneSeekBackward(val);
  }

  get sceneSeekBackward() {
    return contextModule.sceneSeekBackward;
  }

  set sceneSeekForward(val: number | string) {
    if (this.seekRules.some((rule) => rule(val) !== true)) {
      // Don't save the value if it is invalid
      return;
    }
    localStorage.setItem("pm_sceneSeekForward", val.toString());
    val = typeof val === "string" ? parseInt(val) : val;
    val = Number.isNaN(val) ? 5 : val;
    contextModule.setSceneSeekForward(val);
  }

  get sceneSeekForward() {
    return contextModule.sceneSeekForward;
  }

  toggleDarkMode() {
    // @ts-ignore
    this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
    localStorage.setItem(
      "pm_darkMode",
      // @ts-ignore
      this.$vuetify.theme.dark ? "true" : "false"
    );
  }

  // MOVIES

  set defaultDVDShow3d(val: boolean) {
    localStorage.setItem("pm_defaultDVDShow3d", val.toString());
    contextModule.toggleDefaultDVDShow3d(val);
  }

  get defaultDVDShow3d() {
    return contextModule.defaultDVDShow3d;
  }
}
</script>
