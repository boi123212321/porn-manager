<template>
  <div style="width:100%;" class="d-flex align-center">
    <v-btn icon dark @click="$router.go(-1)">
      <v-icon>mdi-chevron-left</v-icon>
    </v-btn>
    <v-toolbar-title class="mr-2">{{ actor.name }}</v-toolbar-title>
    <v-btn icon dark @click="favorite">
      <v-icon>{{ actor.favorite ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
    </v-btn>
    <v-btn icon dark @click="bookmark">
      <v-icon>{{ actor.bookmark ? 'mdi-bookmark-check' : 'mdi-bookmark-outline' }}</v-icon>
    </v-btn>
    <v-spacer></v-spacer>
    <v-btn icon dark @click="openEditDialog">
      <v-icon>mdi-pencil</v-icon>
    </v-btn>
    <v-btn icon dark @click>
      <v-icon color="warning">mdi-delete</v-icon>
    </v-btn>

    <v-dialog v-model="editDialog" max-width="500px">
      <v-card>
        <v-toolbar dark :color="$store.getters['globals/primaryColor']">
          <v-toolbar-title>Edit '{{actor.name}}'</v-toolbar-title>
        </v-toolbar>
        <v-container v-if="editDialog">
          <v-layout wrap align-center>
            <v-flex xs6 sm4>
              <v-subheader>Actor name</v-subheader>
            </v-flex>
            <v-flex xs6 sm8>
              <v-text-field
                :color="$store.getters['globals/secondaryColor']"
                single-line
                v-model="editing.name"
                label="Enter name"
              ></v-text-field>
            </v-flex>

            <v-flex xs12>
              <v-combobox
                :color="$store.getters['globals/secondaryColor']"
                v-model="editing.aliases"
                label="Actor alias names"
                multiple
                chips
                clearable
              ></v-combobox>
            </v-flex>

            <v-flex xs12>
              <v-btn
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
        </v-container>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="editDialog = false" text>Cancel</v-btn>
          <v-btn :color="$store.getters['globals/secondaryColor']" @click="saveSettings">Save</v-btn>
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
import Actor from "@/classes/actor";

@Component({
  components: {
    CustomField
  }
})
export default class VideoDetailsActions extends Vue {
  editDialog = false;

  editing = {
    showCustomFields: false,

    name: "",
    aliases: [] as string[],
    customFields: {} as CustomFieldValue
  };

  setFieldValue({ key, value }: { key: string; value: string }) {
    this.editing.customFields[key] = value;
  }

  getFieldValue(name: string): string | number | boolean | null {
    return this.editing.customFields[name];
  }

  saveSettings() {
    this.$store.commit("actors/edit", {
      id: this.actor.id,
      settings: {
        name: toTitleCase(this.editing.name),
        customFields: JSON.parse(JSON.stringify(this.editing.customFields)),
        aliases: this.editing.aliases.map((label: string) => toTitleCase(label))
      }
    });
    this.editDialog = false;

    exportToDisk();
  }

  openEditDialog() {
    this.editDialog = true;
    this.editing.name = this.actor.name;
    this.editing.aliases = this.actor.aliases;
    this.editing.customFields = JSON.parse(
      JSON.stringify(this.actor.customFields)
    );
  }

  favorite() {
    this.$store.commit("actors/favorite", this.actor.id);
    exportToDisk();
  }

  bookmark() {
    this.$store.commit("actors/bookmark", this.actor.id);
    exportToDisk();
  }

  get actor(): Actor {
    return this.$store.state.actors.items.find(
      (v: Actor) => v.id == this.$route.params.id
    );
  }
}
</script>

<style>
</style>
