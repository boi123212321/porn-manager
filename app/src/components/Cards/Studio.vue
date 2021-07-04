<template>
  <v-card tile v-if="studio">
    <router-link :to="`/studio/${studio._id}`">
      <div class="pa-2" v-ripple>
        <v-img contain aspect-ratio="2" :src="thumbnail"></v-img>
      </div>
    </router-link>

    <div class="px-2">
      <div v-if="studio.parent" class="mt-2 text-uppercase caption">
        <router-link
          class="hover"
          style="color: inherit; text-decoration: none"
          :to="`/studio/${studio.parent._id}`"
          >{{ studio.parent.name }}</router-link
        >
      </div>

      <v-card-title
        :class="`pl-0 pb-4 ${studio.parent ? 'pt-0' : 'pt-2'}`"
        style="font-size: 1.1rem; line-height: 1.75rem"
      >
        <span
          :title="studio.name"
          style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis"
          >{{ studio.name }}</span
        >
      </v-card-title>
      <v-card-subtitle :class="`pl-0 py-0 ${!studio.numScenes ? 'mb-2' : ''}`"
        >{{ studio.numScenes }} {{ studio.numScenes == 1 ? "scene" : "scenes" }}</v-card-subtitle
      >
      <v-card-text class="pl-0 pt-1 pb-2" v-if="studio.labels.length && showLabels">
        <label-group :item="studio._id" :value="studio.labels" :allowRemove="false" />
      </v-card-text>
    </div>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";


@Component
export default class ActorCard extends Vue {
  @Prop(Object) studio!: any;
  @Prop({ default: true }) showLabels!: boolean;

  get thumbnail() {
    if (this.studio.thumbnail)
      return `/api/media/image/${
        this.studio.thumbnail._id
      }?password=${localStorage.getItem("password")}`;
    return "/assets/broken.png";
  }
}
</script>

<style lang="scss" scoped>
</style>