<template>
  <v-card v-if="info" class="mb-3" style="border-radius: 10px">
    <v-card-title>
      <v-icon medium class="mr-2">mdi-progress-wrench</v-icon>Video import
      progress
    </v-card-title>

    <v-card-text>
      <div class="my-2">
        <span class="mr-2 d-inline-block headline">
          {{ info.currentFoundCount }} /
          {{ info.oldFoundCount }}
        </span>
        <span class="subtitle-1">discovered videos</span>
      </div>

      <div class="my-2">
        <span class="mr-2 d-inline-block headline">
          {{ info.importQueueLength }}
        </span>
        <span class="subtitle-1">importing</span>
        <span v-if="info.running" class="ml-3">
          <v-progress-circular
            size="20"
            width="2"
            indeterminate
          ></v-progress-circular>
        </span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import ApolloClient from "../apollo";
import gql from "graphql-tag";

@Component
export default class VideoImportInfo extends Vue {
  info = null as null | {
    currentFoundCount: number;
    oldFoundCount: number;
    importQueueLength: number;
    running: boolean;
  };
  infoInterval = null as NodeJS.Timeout | null;

  created() {
    this.getInfo();
    this.infoInterval = setInterval(() => {
      this.getInfo();
    }, 5000);
  }

  destroyed() {
    if (this.infoInterval) clearInterval(this.infoInterval);
  }

  async getInfo() {
    const res = await ApolloClient.query({
      query: gql`
        {
          getVideoImportInfo {
            currentFoundCount
            oldFoundCount
            importQueueLength
            running
          }
        }
      `,
    });
    this.info = res.data.getVideoImportInfo;
  }
}
</script>
