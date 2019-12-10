<template>
  <div>
    <v-row>
      <v-col cols="12" md="3">
        <v-card>
          <v-card-title>Scenes</v-card-title>
          <v-card-text>
            <span class="display-2">{{ numScenes }}</span>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card>
          <v-card-title>Actors</v-card-title>
          <v-card-text>
            <span class="display-2">{{ numActors }}</span>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card>
          <v-card-title>Movies</v-card-title>
          <v-card-text>
            <span class="display-2">{{ numMovies }}</span>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card>
          <v-card-title>Images</v-card-title>
          <v-card-text>
            <span class="display-2">{{ numImages }}</span>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <div class="my-5 display-1 text-center">Your favorites</div>

    <v-row>
      <v-col class="pa-1" v-for="actor in topActors" :key="actor._id" cols="12" md="4">
        <actor-card
          style="height: 100%"
          max-width="200px"
          @rate="rateActor(actor._id, $event)"
          @bookmark="bookmarkActor(actor._id, $event)"
          @favorite="favoriteActor(actor._id, $event)"
          :actor="actor"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import ApolloClient from "../apollo";
import gql from "graphql-tag";
import actorFragment from "../fragments/actor";
import ActorCard from "../components/ActorCard.vue";
import IActor from "../types/actor";

@Component({
  components: {
    ActorCard
  }
})
export default class Home extends Vue {
  numScenes = 0;
  numActors = 0;
  numMovies = 0;
  numImages = 0;

  topActors = [] as IActor[];

  rateActor(id: any, rating: number) {
    const index = this.topActors.findIndex(sc => sc._id == id);

    if (index > -1) {
      const actor = this.topActors[index];
      actor.rating = rating;
      Vue.set(this.topActors, index, actor);
    }
  }

  favoriteActor(id: any, favorite: boolean) {
    const index = this.topActors.findIndex(sc => sc._id == id);

    if (index > -1) {
      const actor = this.topActors[index];
      actor.favorite = favorite;
      Vue.set(this.topActors, index, actor);
    }
  }

  bookmarkActor(id: any, bookmark: boolean) {
    const index = this.topActors.findIndex(sc => sc._id == id);

    if (index > -1) {
      const actor = this.topActors[index];
      actor.bookmark = bookmark;
      Vue.set(this.topActors, index, actor);
    }
  }

  beforeMount() {
    ApolloClient.query({
      query: gql`
        {
          numScenes
          numActors
          numMovies
          numImages
        }
      `
    })
      .then(res => {
        this.numScenes = res.data.numScenes;
        this.numActors = res.data.numActors;
        this.numMovies = res.data.numMovies;
        this.numImages = res.data.numImages;
      })
      .catch(err => {
        console.error(err);
      });

    ApolloClient.query({
      query: gql`
        {
          topActors(num: 3) {
            ...ActorFragment
          }
        }
        ${actorFragment}
      `
    })
      .then(res => {
        this.topActors = res.data.topActors;
      })
      .catch(err => {
        console.error(err);
      });
  }
}
</script>
