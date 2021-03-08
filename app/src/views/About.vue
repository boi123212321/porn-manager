<template>
  <v-container fluid>
    <BindFavicon />
    <BindTitle value="Settings" />

    <div style="max-width: 800px" class="mx-auto">
      <v-card>
        <v-card-title>Preferences</v-card-title>
        <v-card-text>
          <v-row>
            <v-col :cols="12" :sm="6">
              <div>
                <v-subheader>Scene cards aspect ratio</v-subheader>
                <v-radio-group v-model="sceneRatio">
                  <v-radio color="primary" :value="1" label="Square"></v-radio>
                  <v-radio color="primary" :value="16 / 9" label="16:9"></v-radio>
                  <v-radio color="primary" :value="4 / 3" label="4:3"></v-radio>
                </v-radio-group>
              </div>

              <div>
                <v-subheader>Actor cards aspect ratio</v-subheader>
                <v-radio-group v-model="actorRatio">
                  <v-radio color="primary" :value="1" label="Square"></v-radio>
                  <v-radio color="primary" :value="9 / 16" label="9:16"></v-radio>
                  <v-radio color="primary" :value="3 / 4" label="3:4"></v-radio>
                </v-radio-group>
              </div>
            </v-col>
            <v-col :cols="12" :sm="6">
              <div>
                <v-btn
                  color="gray darken-4"
                  depressed
                  dark
                  @click="toggleDarkMode"
                  class="text-none my-3"
                  >{{ this.$vuetify.theme.dark ? "Light mode" : "Dark mode" }}</v-btn
                >
              </div>
              <div>
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
                <v-checkbox
                  color="primary"
                  hide-details
                  v-model="showCardLabels"
                  label="Show card labels on overview"
                />
                <v-checkbox
                  color="primary"
                  hide-details
                  label="Fill actor thumbnails"
                  v-model="fillActorCards"
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

      <v-card class="mt-3">
        <v-card-title>Custom data fields</v-card-title>
        <v-card-text>
          <CustomFieldCreator />
        </v-card-text>
      </v-card>
    </div>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import CustomFieldCreator from "@/components/CustomFieldCreator.vue";
import { contextModule } from "@/store/context";
import Axios from "axios";
import { serverBase } from "@/apollo";

@Component({
  components: {
    CustomFieldCreator,
  },
})
export default class About extends Vue {
  version = "";

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

  mounted() {
    Axios.get(`${serverBase}/version?password=${localStorage.getItem("password")}`)
      .then(({ data }) => {
        this.version = data.result;
      })
      .catch((err) => {
        console.error(err);
      });
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

  toggleDarkMode() {
    // @ts-ignore
    this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
    localStorage.setItem(
      "pm_darkMode",
      // @ts-ignore
      this.$vuetify.theme.dark ? "true" : "false"
    );
  }
}
</script>
