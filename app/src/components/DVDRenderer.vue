<template>
  <v-fade-transition>
    <div v-if="value" class="dvd-render">
      <v-btn @click="$emit('input', false)" style="position: absolute; top: 5px; right: 5px;" icon>
        <v-icon>mdi-close</v-icon>
      </v-btn>
      <iframe script :src="url" frameborder="0"></iframe>
    </div>
  </v-fade-transition>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { serverBase } from "../apollo";

@Component
export default class DVDRenderer extends Vue {
  @Prop({ default: false }) value!: boolean;
  @Prop() movie!: string;

  get url() {
    return serverBase + `/dvd-renderer/${this.movie}`;
  }
}
</script>

<style lang="scss" scoped>
iframe {
  width: 100%;
  height: 100%;
}

.dvd-render {
  z-index: 999;
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}
</style>