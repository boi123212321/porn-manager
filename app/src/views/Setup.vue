<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="8">
        <v-card class="mb-3">
          <div class="d-flex flex-column align-center pt-3">
            <v-img src="/assets/favicon.png" max-width="5vw"></v-img>
            <v-card-title>Porn Vault</v-card-title>
          </div>
        </v-card>
        <v-card class="mb-3">
          <v-card-title>Setup</v-card-title>
          <v-card-subtitle v-if="status">{{ status.setupMessage }}</v-card-subtitle>

          <v-stepper v-model="setupStep">
            <v-stepper-header>
              <v-divider></v-divider>
              <v-stepper-step
                step="1"
                editable
                :complete="configOK"
                :rules="[() => (!status && loadingConfig) || !loadConfigError]"
              >
                Load config
              </v-stepper-step>

              <v-divider></v-divider>

              <v-stepper-step
                step="2"
                editable
                :complete="servicesReady"
                :rules="[() => (!status && loadingConfig) || !loadStatusError]"
              >
                Connect services
              </v-stepper-step>
              <v-divider></v-divider>
            </v-stepper-header>
          </v-stepper>

          <v-stepper v-model="setupStep">
            <v-stepper-content step="1">
              <v-card :loading="loadingConfig">
                <v-card-text>
                  <p v-if="!config && loadingConfig">Loading...</p>
                  <template v-else-if="loadConfigError">
                    <p>Error loading config.</p>
                  </template>
                  <template v-else-if="config">
                    <p>Location: {{ config.location }}</p>
                    <p>
                      Raw config:
                      <CodeTextArea
                        class="config-code mt-3"
                        :value="config.value ? JSON.stringify(config.value) : ''"
                        auto-grow
                        readonly
                      >
                      </CodeTextArea>
                    </p>
                  </template>
                </v-card-text>
              </v-card>
              <v-btn
                class="mt-3 text-none"
                color="primary"
                @click="setupStep = 2"
                :disabled="loadConfigError"
              >
                Continue
              </v-btn>
            </v-stepper-content>

            <v-stepper-content step="2">
              <v-card :loading="loadingStatus" class="mb-3">
                <v-card-title>Izzy</v-card-title>
                <v-card-text>
                  <p v-if="!status && loadingStatus">Loading...</p>
                  <template v-else-if="loadStatusError">
                    <p>Error loading status.</p>
                  </template>
                  <template v-else-if="status">
                    <div class="d-flex align-center">
                      Status: {{ status.izzy.status }}
                      <v-icon
                        class="ml-1"
                        v-if="status.izzy.status === ServiceStatus.Connected"
                        color="green"
                        dense
                        >mdi-check</v-icon
                      >
                      <v-icon class="ml-1" v-else color="error" dense>mdi-alert-circle</v-icon>
                    </div>
                    <div>Version: {{ status.izzy.version }}</div>

                    <v-subheader class="pl-0">Collection loading progress</v-subheader>
                    <v-simple-table>
                      <template #default>
                        <thead>
                          <tr>
                            <th class="text-left">Name</th>
                            <th class="text-left">Loading status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            :key="collection.name"
                            v-for="collection in status.izzy.collectionBuildInfoMap"
                          >
                            <td>{{ collection.name }}</td>
                            <td>
                              {{ collection.status }}
                              <v-icon
                                class="ml-1"
                                :color="collectionBuildColor(collection.status)"
                                small
                                >mdi-circle</v-icon
                              >
                            </td>
                          </tr>
                        </tbody>
                      </template>
                    </v-simple-table>
                  </template>
                </v-card-text>
              </v-card>

              <v-card :loading="loadingStatus">
                <v-card-title>Elasticsearch</v-card-title>
                <v-card-text>
                  <p v-if="!status && loadingStatus">Loading...</p>
                  <template v-else-if="loadStatusError">
                    <p>Error loading status.</p>
                  </template>
                  <template v-else-if="status">
                    <div class="d-flex align-center">
                      Status: {{ status.elasticsearch.status }}
                      <v-icon
                        class="ml-1"
                        v-if="status.elasticsearch.status === ServiceStatus.Connected"
                        color="green"
                        dense
                        >mdi-check</v-icon
                      >
                      <v-icon class="ml-1" v-else color="error" dense>mdi-alert-circle</v-icon>
                    </div>
                    <div>Version: {{ status.elasticsearch.version }}</div>

                    <v-subheader class="pl-0">Index build progress</v-subheader>
                    <v-simple-table>
                      <template #default>
                        <thead>
                          <tr>
                            <th class="text-left">Name</th>
                            <th class="text-left">Build status</th>
                            <th class="text-left">Indexed count</th>
                            <th class="text-left">Total count to index</th>
                            <th class="text-left">ETA</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            :key="index.name"
                            v-for="index in status.elasticsearch.indexBuildInfoMap"
                          >
                            <td>{{ index.name }}</td>
                            <td>
                              {{ index.status }}
                              <v-icon class="ml-1" :color="indexBuildColor(index.status)" small
                                >mdi-circle</v-icon
                              >
                            </td>
                            <td>{{ index.indexedCount }}</td>
                            <td>
                              {{ toIndexCount(index) }}
                            </td>
                            <td>{{ indexEta(index) }}</td>
                          </tr>
                        </tbody>
                      </template>
                    </v-simple-table>
                  </template>
                </v-card-text></v-card
              >

              <v-btn
                class="mt-3 text-none"
                color="primary"
                :to="finishRouteTo"
                :disabled="!servicesReady || !status.serverReady"
              >
                Start using Porn Vault
              </v-btn>
            </v-stepper-content></v-stepper
          >
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import CodeTextArea from "@/components/CodeTextArea.vue";
import Axios from "axios";
import {
  getFullStatus,
  IndexBuildStatus,
  ServiceStatus,
  StatusData,
  IndexBuildInfo,
  CollectionBuildStatus,
} from "../api/system";
import moment from "moment";
import { contextModule } from "@/store/context";

interface IConfig {
  location: string;
  value: any;
}

@Component({
  components: {
    CodeTextArea,
  },
})
export default class Setup extends Vue {
  ServiceStatus = ServiceStatus;
  IndexBuildStatus = IndexBuildStatus;

  setupStep = 1;

  config: IConfig = {
    location: "",
    value: {},
  };
  loadingConfig = true;
  loadConfigError = false;

  status: StatusData | null = null;
  loadingStatus = true;
  loadStatusError = false;

  async loadConfig() {
    this.loadingConfig = true;
    this.loadConfigError = false;

    try {
      const res = await Axios.get("/api/config", {
        params: { password: localStorage.getItem("password") },
      });
      this.config = res.data as IConfig;
    } catch (err) {
      console.error(err);
      this.loadConfigError = true;
    }

    this.loadingConfig = false;

    // setTimeout(this.loadConfig, 5 * 1000);
  }

  get configOK() {
    return (!this.config && this.loadingConfig) || (!!this.config && !!this.config.value);
  }

  async loadStatus() {
    this.loadingStatus = true;
    this.loadStatusError = false;

    try {
      const res = await getFullStatus();
      this.status = res.data;
      contextModule.toggleServerReady(this.status.serverReady);
    } catch (err) {
      console.error(err);
      contextModule.toggleServerReady(false);
      this.loadStatusError = true;
      this.status = null;
    }

    this.loadingStatus = false;

    // setTimeout(this.loadStatus, 5 * 1000);
  }

  collectionBuildColor(status: CollectionBuildStatus): string {
    switch (status) {
      case CollectionBuildStatus.None:
        return "red";
      case CollectionBuildStatus.Loading:
        return "orange";
      case CollectionBuildStatus.Ready:
        return "green";
      default:
        return "red";
    }
  }

  indexBuildColor(status: IndexBuildStatus): string {
    switch (status) {
      case IndexBuildStatus.None:
        return "red";
      case IndexBuildStatus.Created:
        return "orange";
      case IndexBuildStatus.Indexing:
        return "yellow";
      case IndexBuildStatus.Ready:
        return "green";
      default:
        return "red";
    }
  }

  toIndexCount(index: IndexBuildInfo): string | number {
    if ([IndexBuildStatus.None, IndexBuildStatus.Created].includes(index.status)) {
      return "unknown";
    }

    return index.totalToIndexCount < 0 ? "calculating..." : index.totalToIndexCount;
  }

  indexEta(index: IndexBuildInfo): string | number {
    if ([IndexBuildStatus.None, IndexBuildStatus.Created].includes(index.status)) {
      return "unknown";
    }

    if (index.eta < 0) {
      return "calculating...";
    }

    const start = moment();

    const endETA = start.clone().add(index.eta, "seconds");
    const diffETA = endETA.diff(start);

    return moment.utc(diffETA).format("mm:ss");
  }

  get servicesReady() {
    return (
      !!this.status &&
      this.status.izzy.allCollectionsBuilt &&
      this.status.elasticsearch.allIndexesBuilt
    );
  }

  get finishRouteTo() {
    const name = this.$router.currentRoute.query.returnName as string;
    if (name) {
      return { name };
    }
    return { path: "/" };
  }

  created() {
    const initialStep = this.$route.query.initialStep;
    if (typeof initialStep === "string") {
      const step = Number.parseInt(initialStep);
      if (!Number.isNaN(step)) {
        this.setupStep = Math.max(Math.min(step, 2), 0);
      }
    }

    this.loadConfig();
    this.loadStatus();
  }
}
</script>

<style lang="scss" scoped>
.config-code {
  ::v-deep textarea {
    max-height: 60vh;
    overflow: auto;
  }
}
</style>
