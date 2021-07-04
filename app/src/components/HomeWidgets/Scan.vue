<template>
  <WidgetCard v-if="info" title="Scanner" icon="mdi-database-refresh">
    <div>
      <div v-if="info.isScanning">
        <span class="mr-2 d-inline-block headline">Scan in progress</span>
        <span class="ml-3">
          <v-progress-circular size="20" width="2" indeterminate></v-progress-circular>
        </span>
      </div>
      <div v-else-if="info.nextScanTimestamp">
        Next scan at {{ new Date(info.nextScanTimestamp).toLocaleString() }}
      </div>
      <div v-else>No scan planned</div>
    </div>

    <template v-slot:actions>
      <v-btn
        text
        block
        class="text-none"
        color="primary"
        :disabled="info.isScanning"
        @click="forceScan"
        >Scan {{ numFolders }} {{ numFolders === 1 ? "folder" : "folders" }}</v-btn
      >
    </template>
  </WidgetCard>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Axios from "axios";

@Component
export default class QueueInfo extends Vue {
  info = null as null | { isScanning: boolean; nextScanTimestamp: number | null };
  infoInterval = null as NodeJS.Timeout | null;
  folders: { images: string[]; videos: string[]; amount: number } = {
    images: [],
    videos: [],
    amount: 0,
  };

  get numFolders(): number {
    return this.folders.amount;
  }

  created() {
    this.getInfo();
    this.getFolders();
    this.infoInterval = setInterval(() => {
      this.getInfo();
    }, 5000);
  }

  destroyed() {
    if (this.infoInterval) {
      clearInterval(this.infoInterval);
    }
  }

  forceScan() {
    if (this.info?.isScanning) {
      return;
    }

    return Axios.post("/api/scan", null, {
      headers: {
        "X-PASS": localStorage.getItem("password"),
      },
    }).then(() => {
      if (this.info) {
        this.info.isScanning = true;
      }
      this.getInfo();
    });
  }

  async getFolders() {
    const res = await Axios.get("/api/scan/folders", {
      headers: {
        "X-PASS": localStorage.getItem("password"),
      },
    });
    this.folders = res.data;
  }

  async getInfo() {
    const res = await Axios.get("/api/scan", {
      headers: {
        "X-PASS": localStorage.getItem("password"),
      },
    });
    this.info = res.data;
  }
}
</script>
