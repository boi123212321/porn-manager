<template>
  <v-card v-if="actors" class="mb-3" style="border-radius: 10px">
    <v-card-title>
      <v-icon medium class="mr-2">mdi-heart</v-icon>Your favorites
    </v-card-title>

    <v-card-text>
      <ActorGrid :value="actors" />
    </v-card-text>

    <v-card-actions>
      <v-btn block class="text-none" color="primary" text @click="nextPage">Show more</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import ApolloClient from "../apollo";
import gql from "graphql-tag";
import ActorGrid from "./ActorGrid.vue";

@Component({
  components: {
    ActorGrid
  }
})
export default class TopActors extends Vue {
  actors = [] as any[];
  skip = 0;

  nextPage() {
    this.getActors();
  }

  created() {
    this.getActors();
  }

  async getActors() {
    const res = await ApolloClient.query({
      query: gql`
        query($skip: Int) {
          topActors(skip: $skip, take: 4) {
            _id
            name
            thumbnail {
              _id
            }
          }
        }
      `,
      variables: {
        skip: this.skip
      }
    });
    this.actors.push(...res.data.topActors);
    this.skip += 4;
  }
}
</script>