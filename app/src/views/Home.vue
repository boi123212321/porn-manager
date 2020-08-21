<template>
  <v-container>
    <BindTitle value="Home" />
    <div class="mx-auto" style="max-width: 800px">
      <v-row dense>
        <v-col cols="12" sm="6">
          <Stats class="mb-3" />
          <QueueInfo class="mb-3" />
          <SceneLabelUsage class="mb-3" />
          <ActorLabelUsage />
          <!-- <SearchTimes /> -->
        </v-col>
        <v-col cols="12" sm="6">
          <TopActors class="mb-3" />
          <UnwatchedActors />
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

import QueueInfo from "@/components/HomeWidgets/QueueInfo.vue";
import TopActors from "@/components/HomeWidgets/TopActors.vue";
import UnwatchedActors from "@/components/HomeWidgets/UnwatchedActors.vue";
import Stats from "@/components/HomeWidgets/Stats.vue";
//import SearchTimes from "@/components/HomeWidgets/SearchTimes.vue";
import ActorLabelUsage from "@/components/HomeWidgets/ActorLabelUsage.vue";
import SceneLabelUsage from "@/components/HomeWidgets/SceneLabelUsage.vue";

@Component({
  components: {
    QueueInfo,
    TopActors,
    UnwatchedActors,
    Stats,
    //SearchTimes,
    ActorLabelUsage,
    SceneLabelUsage
  }
})
export default class Home extends Vue {}
</script>
