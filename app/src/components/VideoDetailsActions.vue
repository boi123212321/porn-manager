<template>
  <div style="width:100%;" class="d-flex align-center">
    <v-btn icon dark @click="$router.go(-1)">
      <v-icon>mdi-chevron-left</v-icon>
    </v-btn>
    <v-toolbar-title class="mr-2">{{video.title}}</v-toolbar-title>
    <v-btn icon dark @click="playVideo">
      <v-icon>mdi-play</v-icon>
    </v-btn>
    <v-btn icon dark @click="favorite">
      <v-icon>{{ video.favorite ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
    </v-btn>
    <v-btn icon dark @click="bookmark">
      <v-icon>{{ video.bookmark ? 'mdi-bookmark-check' : 'mdi-bookmark-outline' }}</v-icon>
    </v-btn>
    <v-spacer></v-spacer>
    <v-btn icon dark @click="openEditDialog">
      <v-icon>mdi-pencil</v-icon>
    </v-btn>
    <v-btn icon dark @click="() => {}">
      <v-icon color="warning">mdi-delete</v-icon>
    </v-btn>

    <v-dialog v-model="editDialog" max-width="600px">
      <v-card>
        <v-toolbar dark :color="$store.getters['globals/primaryColor']">
          <v-toolbar-title>Edit '{{video.title}}'</v-toolbar-title>
        </v-toolbar>
        <v-card-text style="height: 66vh; overflow-y: auto">
          <v-layout wrap align-center>
            <v-flex xs6 sm4>
              <v-subheader>Video title</v-subheader>
            </v-flex>
            <v-flex xs6 sm8>
              <v-text-field
                :color="$store.getters['globals/secondaryColor']"
                single-line
                v-model="editing.title"
                label="Enter title"
              ></v-text-field>
            </v-flex>

            <v-flex xs6 sm4>
              <v-subheader>Description</v-subheader>
            </v-flex>
            <v-flex xs6 sm8>
              <v-textarea
                :color="$store.getters['globals/secondaryColor']"
                label="Enter description"
                v-model="editing.description"
              ></v-textarea>
            </v-flex>

            <v-flex xs6 sm4>
              <v-subheader>Actors</v-subheader>
            </v-flex>
            <v-flex xs6 sm8>
              <v-autocomplete
                v-model="editing.actors"
                :items="$store.state.actors.items"
                chips
                label="Select"
                item-text="name"
                item-value="id"
                multiple
                clearable
                :color="$store.getters['globals/secondaryColor']"
              >
                <template v-slot:selection="data">
                  <v-chip pill>
                    <v-avatar left>
                      <img :src="$store.getters['images/idToPath'](data.item.thumbnails[0])" />
                    </v-avatar>
                    {{ data.item.name }}
                  </v-chip>
                </template>
                <template v-slot:item="data">
                  <template v-if="typeof data.item !== 'object'">
                    <v-list-item-content v-text="data.item"></v-list-item-content>
                  </template>
                  <template v-else>
                    <v-list-item-avatar>
                      <img :src="$store.getters['images/idToPath'](data.item.thumbnails[0])" />
                    </v-list-item-avatar>
                    <v-list-item-content>
                      <v-list-item-title v-html="data.item.name"></v-list-item-title>
                      <v-list-item-subtitle v-html="data.item.group"></v-list-item-subtitle>
                    </v-list-item-content>
                  </template>
                </template>
              </v-autocomplete>
            </v-flex>

            <v-flex xs12>
              <v-btn
                :color="$store.getters['globals/secondaryColor']"
                text
                @click="editing.showCustomFields = !editing.showCustomFields"
              >{{ editing.showCustomFields ? 'Hide custom data fields' : 'Show custom data fields'}}</v-btn>
            </v-flex>

            <v-container fluid v-if="editing.showCustomFields">
              <v-layout wrap>
                <v-flex xs12 v-for="field in $store.state.globals.customFields" :key="field.name">
                  <CustomField
                    :field="field"
                    :value="getFieldValue(field.name)"
                    v-on:change="setFieldValue"
                  />
                </v-flex>
              </v-layout>
            </v-container>
          </v-layout>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="editDialog = false" text>Cancel</v-btn>
          <v-btn @click="saveSettings" :color="$store.getters['globals/secondaryColor']">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Video from "@/classes/video";
import { exportToDisk } from "@/util/library";
import CustomField from "@/components/CustomField.vue";
import { CustomFieldValue } from "@/classes/common";
import { toTitleCase } from "@/util/string";
import VideosModule from "@/store_modules/videos";

@Component({
  components: {
    CustomField
  }
})
export default class VideoDetailsActions extends Vue {
  editDialog = false;

  editing = {
    showCustomFields: false,

    title: "",
    description: "",
    actors: [] as string[],
    customFields: {} as CustomFieldValue
  };

  saveSettings() {
    VideosModule.edit({
      id: this.video.id,
      settings: {
        title: toTitleCase(this.editing.title),
        description: this.editing.description || null,
        actors: this.editing.actors,
        customFields: JSON.parse(JSON.stringify(this.editing.customFields))
      }
    });
    this.editDialog = false;

    exportToDisk();
  }

  // Remove actor from filter, not library
  removeActor(id: string) {
    this.editing.actors = this.editing.actors.filter((a: string) => a != id);
  }

  setFieldValue({ key, value }: { key: string; value: string }) {
    this.editing.customFields[key] = value;
  }

  getFieldValue(name: string): string | number | boolean | null {
    return this.editing.customFields[name];
  }

  openEditDialog() {
    this.editDialog = true;
    this.editing.title = this.video.title;
    this.editing.description = this.video.description;
    this.editing.actors = this.video.actors;
    this.editing.customFields = JSON.parse(
      JSON.stringify(this.video.customFields)
    );
  }

  playVideo() {
    this.video.open();
    VideosModule.incrementViewCounter(this.video.id);
    exportToDisk();
  }

  favorite() {
    VideosModule.favorite(this.video.id);
    exportToDisk();
  }

  bookmark() {
    VideosModule.bookmark(this.video.id);
    exportToDisk();
  }

  get video(): Video {
    return this.$store.state.videos.items.find(
      (v: Video) => v.id == this.$route.params.id
    );
  }
}
</script>

<style>
</style>
