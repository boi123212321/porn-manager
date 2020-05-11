<template>
  <v-card v-if="info" class="mb-3" style="border-radius: 10px">
    <v-card-title>
      <v-icon medium class="mr-2">mdi-progress-wrench</v-icon>Import progress
    </v-card-title>

    <v-card-text>
      <div class="my-2">
        <span class="mr-2 d-inline-block headline">
          {{ info.videos.importQueueLength }} /
          {{ info.videos.currentFoundCount }}
        </span>
        <span class="subtitle-1">videos</span>
        <span v-if="info.videos.running" class="ml-3">
          <v-progress-circular
            size="20"
            width="2"
            indeterminate
          ></v-progress-circular>
        </span>
      </div>

      <div class="my-2">
        <span class="mr-2 d-inline-block headline">
          {{ info.images.importQueueLength }} /
          {{ info.images.currentFoundCount }}
        </span>
        <span class="subtitle-1">images</span>
        <span v-if="info.images.running" class="ml-3">
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
export default class ImportInfo extends Vue {
  info = null as null | {
    videos: {
      currentFoundCount: number;
      oldFoundCount: number;
      importQueueLength: number;
      running: boolean;
    };
    images: {
      currentFoundCount: number;
      oldFoundCount: number;
      importQueueLength: number;
      running: boolean;
    };
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
          getImportInfo {
            videos {
              currentFoundCount
              oldFoundCount
              importQueueLength
              running
            }
            images {
              currentFoundCount
              oldFoundCount
              importQueueLength
              running
            }
          }
        }
      `,
    });
    this.info = res.data.getImportInfo;
  }
}
</script>
