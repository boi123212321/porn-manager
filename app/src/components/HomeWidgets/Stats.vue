<template>
  <WidgetCard title="Stats" icon="mdi-counter">
    <div class="my-4">
      <span class="mr-2 d-inline-block display-1">{{ numScenes }}</span>
      <span class="subtitle-1">scenes</span>
    </div>
    <v-divider></v-divider>

    <div class="my-4">
      <span class="mr-2 d-inline-block display-1">{{ numActors }}</span>
      <span class="subtitle-1">actors</span>
    </div>
    <v-divider></v-divider>

    <div class="my-4">
      <span class="mr-2 d-inline-block display-1">{{ numMovies }}</span>
      <span class="subtitle-1">movies</span>
    </div>
    <v-divider></v-divider>

    <div class="my-4">
      <span class="mr-2 d-inline-block display-1">{{ numImages }}</span>
      <span class="subtitle-1">images</span>
    </div>
  </WidgetCard>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import ApolloClient from "@/apollo";
import gql from "graphql-tag";

@Component({
  components: {}
})
export default class Stats extends Vue {
  numScenes = 0;
  numActors = 0;
  numMovies = 0;
  numImages = 0;

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
  }
}
</script>