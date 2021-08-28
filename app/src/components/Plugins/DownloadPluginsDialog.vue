<template>
  <v-dialog
    :value="value"
    @input="$emit('input', $event)"
    max-width="600px"
    :persistent="isDownloading"
    scrollable
  >
    <v-card>
      <v-card-title>Download plugin</v-card-title>

      <v-card-text>
        <v-alert type="info" dismissible v-model="info">
          <div>
            You can find community plugins
            <a href="https://github.com/porn-vault/plugins" target="_blank">here</a>.
          </div>
          <div>
            The plugins will be downloaded to the "plugins" folder adjacent to the Porn Vault
            executable or in the config folder.
          </div>
          <div>Existing files will not be overwritten.</div>
        </v-alert>

        <v-form ref="form">
          <v-textarea
            color="primary"
            v-model="pluginsBulkText"
            auto-grow
            :rows="3"
            placeholder="Plugin URLs"
            persistent-hint
            hint="1 URL per line"
            :rules="[(val) => (!!val && !!val.trim()) || 'Required']"
            :error-messages="pluginsErrorMessages"
          ></v-textarea>
        </v-form>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="$emit('input', false)" class="text-none" :disabled="isDownloading">
          Cancel
        </v-btn>
        <v-btn
          text
          color="primary"
          class="text-none"
          :disabled="!pluginsBulkText || isDownloading"
          :loading="isDownloading"
          @click="confirmDownload"
        >
          Download
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import VForm from "vuetify/lib/components/VForm/index.js";

import { PLUGIN_EXTENSIONS } from "@/constants/plugins";
import { downloadPlugins } from "../../api/plugins";

@Component({})
export default class DownloadPluginsDialog extends Vue {
  $refs!: {
    form?: VForm;
  };

  @Prop({ default: false }) value!: boolean; // Dialog value

  pluginsBulkText = "";

  isDownloading = false;
  info = true;

  @Watch("value")
  onValueChange(): void {
    this.pluginsBulkText = "";
    this.info = true;

    this.$nextTick(() => {
      // Wait for render
      this.$refs.form?.resetValidation();
    });
  }

  get pluginsBulkDownload(): string[] {
    if (this.pluginsBulkText) {
      const plugins = this.pluginsBulkText.split("\n").filter(Boolean);
      return [...new Set(plugins)];
    }
    return [];
  }

  get pluginsErrorMessages(): any[] {
    return this.pluginsBulkDownload
      .map(
        (plugin) =>
          PLUGIN_EXTENSIONS.some((ext) => plugin.endsWith(ext))
            ? ""
            : `${plugin} does not have a .js extension` // Don't mention .ts to end users
      )
      .filter(Boolean);
  }

  async confirmDownload(): Promise<void> {
    this.isDownloading = true;
    try {
      const res = await downloadPlugins(this.pluginsBulkDownload);
      const plugins = res.data;
      this.$emit("addPlugins", plugins);
    } catch (err) {
      console.error(err);
    }
    this.isDownloading = false;
  }
}
</script>
