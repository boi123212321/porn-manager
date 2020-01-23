<template>
  <v-row dense>
    <v-col cols="6" v-for="actor in value" :key="actor._id">
      <v-hover>
        <template v-slot:default="{ hover }">
          <v-img :src="thumbnail(actor)">
            <v-fade-transition>
              <v-overlay v-if="hover" absolute color="primary">
                <v-btn
                  :to="`/actor/${actor._id}`"
                  class="text-none black--text accent"
                  depressed
                >{{ actor.name }}</v-btn>
              </v-overlay>
            </v-fade-transition>
          </v-img>
        </template>
      </v-hover>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import IActor from "../types/actor";
import { serverBase } from "../apollo";
import { contextModule } from "../store/context";

@Component
export default class ActorGrid extends Vue {
  @Prop() value!: IActor[];

  thumbnail(actor: IActor) {
    if (actor.thumbnail)
      return `${serverBase}/image/${
        actor.thumbnail._id
      }?password=${localStorage.getItem("password")}`;
    return ``;
  }
}
</script>

<style lang="scss" scoped>
</style>