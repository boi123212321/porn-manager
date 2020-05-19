<template>
  <v-container>
    <BindTitle value="Home" />
    <div class="mx-auto" style="max-width: 800px">
      <v-row>
        <v-col cols="12" sm="6">
          <Stats />
          <QueueInfo />
        </v-col>
        <v-col cols="12" sm="6">
          <TopActors />
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import ApolloClient, { serverBase } from "../apollo";
import gql from "graphql-tag";
import actorFragment from "../fragments/actor";
import sceneFragment from "../fragments/scene";
import ActorCard from "../components/ActorCard.vue";
import IActor from "../types/actor";
import IScene from "../types/scene";
import QueueInfo from "../components/QueueInfo.vue";
import ActorGrid from "../components/ActorGrid.vue";
import { contextModule } from "../store/context";
import TopActors from "../components/TopActors.vue";
import Stats from "../components/Stats.vue";

@Component({
  components: {
    ActorCard,
    QueueInfo,
    ActorGrid,
    TopActors,
    Stats
  }
})
export default class Home extends Vue {}
</script>
