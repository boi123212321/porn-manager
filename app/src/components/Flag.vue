<template>
  <div class="d-flex align-center">
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <img v-on="on" :src="url" :width="width" :height="width/1.5" />
      </template>
      <span>{{ name }}</span>
    </v-tooltip>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";

import { getNationality } from "../../../src/types/countries";

@Component
export default class Flag extends Vue {
  @Prop({ required: true }) value!: string;
  @Prop({ default: 30 }) width!: number;

  get name() {
    const nation = getNationality(this.value);
    if (nation) return nation.name;
    return "<Invalid nationality>";
  }

  get url() {
    return `/flag/${this.value}`;
  }
}
</script>

