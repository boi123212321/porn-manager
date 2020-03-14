<template>
  <v-row dense>
    <v-col :cols="cols" :sm="sm" :md="md" :lg="lg" :xl="xl" v-for="actor in value" :key="actor._id">
      <v-hover>
        <template v-slot:default="{ hover }">
          <v-img height="100%" cover :src="thumbnail(actor)">
            <v-fade-transition>
              <v-overlay v-if="hover" absolute color="primary">
                <v-btn
                  :to="`/actor/${actor._id}`"
                  class="text-none black--text primary"
                  depressed
                >{{ actor.name }}</v-btn>
                <div v-if="sceneDate && actor.bornOn" class="py-2 text-center">
                  <p>{{ calculateAge(actor) }}<span class="caption"> y/o in this scene</span></p>
                </div>
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
import moment from 'moment';

@Component
export default class ActorGrid extends Vue {
  @Prop() value!: IActor[];
  @Prop() sceneDate?: number;
  @Prop({ default: 6 }) cols!: number;
  @Prop({ default: 6 }) sm!: number;
  @Prop({ default: 6 }) md!: number;
  @Prop({ default: 6 }) lg!: number;
  @Prop({ default: 6 }) xl!: number;

  calculateAge(actor: IActor) {
    if(actor.bornOn) {
      return moment(this.sceneDate).diff(actor.bornOn, 'years');
    }
  }

  thumbnail(actor: IActor) {
    if (actor.thumbnail)
      return `${serverBase}/image/${
        actor.thumbnail._id
      }?password=${localStorage.getItem("password")}`;
    return `${serverBase}/broken`;
  }
}
</script>

<style lang="scss" scoped>
</style>