<template>
  <div>
    <v-avatar v-ripple @click="setThemeColor(c)" v-for="c in colors" :key="c" :color="c" size="40" class="mb-2 mr-2">
      <v-icon class="sec--text center" v-if="$store.getters['globals/primaryColor'] == c">mdi-check</v-icon>
    </v-avatar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { exportToDisk } from "@/util/library";

@Component
export default class Settings extends Vue {
  colors = [
    "red darken-3",
    "blue darken-3",
    "green darken-3",
    "indigo darken-1",
    "pink darken-3",
    "teal darken-1",
    "purple"
  ];

  setThemeColor(val: string) {
    this.$store.commit("globals/setThemeColor", val);
    exportToDisk();
  }
}
</script>

<style lang="scss" scoped>
</style>