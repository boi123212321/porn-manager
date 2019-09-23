<template>
  <v-container>
    <v-btn :color="$store.getters['globals/secondaryColor']" @click="openGithub">
      <v-icon left>mdi-github-circle</v-icon>
      <span>GitHub</span>
    </v-btn>
    <v-subheader>Settings</v-subheader>
    {{ $store.state.globals.settings }}
    <v-card class="my-3">
      <v-card-title>Theme</v-card-title>
      <v-card-text>
        <v-color-picker
          class="d-inline-block mr-2"
          @input="changePrimaryColor"
          :value="$store.getters['globals/primaryColor']"
        />
        <v-color-picker
          class="d-inline-block"
          @input="changeSecondaryColor"
          :value="$store.getters['globals/secondaryColor']"
        />

        <v-checkbox
          :color="$store.getters['globals/secondaryColor']"
          v-model="darkMode"
          label="Dark Mode"
        ></v-checkbox>
      </v-card-text>
    </v-card>

    <v-card class="mb-3">
      <v-card-title>Custom data fields</v-card-title>
      <v-card-text>
        <v-list two-line v-if="$store.state.globals.customFields">
          <v-list-item v-for="field in $store.state.globals.customFields" :key="field.name">
            <v-list-item-content>
              <v-list-item-title>{{ field.name }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ fields.types.find(t => t.value == field.type).name }}
                <span
                  v-if="field.type > 2"
                >{{ "- " + field.values.join(", ") }}</span>
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>

        <v-text-field
          :color="$store.getters['globals/secondaryColor']"
          v-model="fields.name"
          clearable
          label="Field name"
        ></v-text-field>
        <v-select
          :color="$store.getters['globals/secondaryColor']"
          v-model="fields.chosenType"
          :items="fields.types"
          item-text="name"
          item-value="value"
          label="Field type"
        ></v-select>

        <v-combobox
          :color="$store.getters['globals/secondaryColor']"
          multiple
          clearable
          v-if="fields.chosenType > 2"
          v-model="fields.values"
          chips
          label="Preset values"
        ></v-combobox>
        <v-card-actions>
          <v-btn
            :color="$store.getters['globals/secondaryColor']"
            :disabled="!fields.name || !fields.name.length"
            @click="createField"
          >Create data field</v-btn>
        </v-card-actions>
      </v-card-text>
    </v-card>

    <!-- <div class="py-5">
      <v-subheader>Theme color</v-subheader>
      <ColorSelector />
    </div>-->

    <div>
      <v-btn
        :color="$store.getters['globals/secondaryColor']"
        text
        :loading="backupLoader"
        @click="exportBackup"
      >
        <v-icon left>mdi-database</v-icon>create backup
      </v-btn>
    </div>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import CustomField, { CustomFieldType } from "@/classes/custom_field";
import { toTitleCase } from "../util/string";
import { exportToDisk } from "@/util/library";
import { ncp } from "ncp";
import path from "path";
import fs from "fs";
import rimraf from "rimraf";
const { shell } = require("electron");
import ColorSelector from "@/components/ColorSelector.vue";

// Turn enum into array
// function toArray(enumme: any) {
//   return Object.keys(enumme)
//     .filter((value: any) => isNaN(Number(value)) === false)
//     .map(key => enumme[key]);
// }

@Component({
  components: {
    ColorSelector
  }
})
export default class Settings extends Vue {
  backupLoader = false;

  fields = {
    name: "",
    chosenType: 0,
    types: [
      {
        name: "String",
        value: 0
      },
      {
        name: "Number",
        value: 1
      },
      {
        name: "Boolean",
        value: 2
      },
      {
        name: "Select",
        value: 3
      },
      {
        name: "Multi-Select",
        value: 4
      }
    ],
    values: [] as any[]
  };

  changeSecondaryColor(col: string) {
    this.$store.commit("globals/setSecondaryColor", col);
    exportToDisk();
  }

  changePrimaryColor(col: string) {
    this.$store.commit("globals/setPrimaryColor", col);
    exportToDisk();
  }

  get darkMode(): boolean {
    return this.$vuetify.theme.dark;
  }

  set darkMode(val: boolean) {
    this.$vuetify.theme.dark = val;
    this.$store.commit("globals/setDarkMode", val);
    exportToDisk();
  }

  openGithub() {
    shell.openExternal("https://github.com/boi123212321/porn-manager");
  }

  exportBackup() {
    const cwd = process.cwd();
    const libraryPath = path.resolve(cwd, "library/");

    if (fs.existsSync(libraryPath)) {
      const backupPath = path.resolve(cwd, "backup/");
      this.backupLoader = true;

      if (fs.existsSync(backupPath)) {
        rimraf.sync(backupPath);
        console.log("Deleted old backup");
      }

      ncp(libraryPath, backupPath, err => {
        console.log("Backup saved.");
        this.backupLoader = false;
      });
    }
  }

  createField() {
    let field = CustomField.create(
      toTitleCase(this.fields.name),
      this.fields.chosenType > 2
        ? this.fields.values.map((v: string) => toTitleCase(v))
        : null,
      this.fields.chosenType
    );

    this.$store.commit("globals/addCustomField", field);
    this.$store.commit("actors/addCustomField", field);
    this.$store.commit("images/addCustomField", field);
    this.$store.commit("videos/addCustomField", field);

    exportToDisk();
  }
}
</script>

<style>
</style>
