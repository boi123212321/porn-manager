<template>
  <WidgetCard v-if="info" title="Video processing queue" icon="mdi-progress-wrench">
    <div class="my-2">
      <span class="mr-2 d-inline-block headline">{{ info.length }}</span>
      <span class="subtitle-1">videos</span>
      <span v-if="info.processing" class="ml-3">
        <v-progress-circular size="20" width="2" indeterminate></v-progress-circular>
      </span>
    </div>
  </WidgetCard>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import ApolloClient from "@/apollo";
import gql from "graphql-tag";

@Component
export default class QueueInfo extends Vue {
  info = null as null | { length: number; processing: boolean };
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
          getQueueInfo {
            length
            processing
          }
        }
      `
    });
    this.info = res.data.getQueueInfo;
  }
}
</script>