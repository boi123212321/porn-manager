<template>
  <v-dialog :value="value" @input="$emit('input', $event)" max-width="600px" scrollable>
    <v-card>
      <v-card-title>Import plugin configuration</v-card-title>

      <v-card-text>
        <v-alert type="info" dismissible v-model="info">
          <div>
            You can find example configurations for community plugins
            <a href="https://github.com/porn-vault/plugins" target="_blank">here.</a>
          </div>
          <div>You may have to update the path to the plugin.</div>
        </v-alert>

        <CodeTextArea
          v-model="fullPlugin"
          @inputObj="fullPluginObj = $event"
          @hasValidSyntax="hasValidSyntax = $event"
          rows="4"
          placeholder="Edit or paste the full plugin example in JSON or YAML"
          no-resize
          auto-grow
          clearable
          class="import-code-textarea"
        >
        </CodeTextArea>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="$emit('input', false)"> Cancel </v-btn>
        <v-btn
          text
          color="primary"
          :disabled="!hasValidSyntax || !parsedPlugin"
          @click="confirmImport"
        >
          Import
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import CodeTextArea from "@/components/CodeTextArea.vue";
import { getEvents } from "@/constants/plugins";

@Component({
  components: {
    CodeTextArea,
  },
})
export default class ImportPluginDialog extends Vue {
  @Prop({ default: false }) value!: boolean; // Dialog value

  fullPlugin = "";
  fullPluginObj: any | null = null;
  hasValidSyntax = false;
  info = true;

  get EVENTS() {
    return getEvents();
  }

  @Watch("value")
  onValueChange(): void {
    this.fullPlugin = "";
    this.fullPluginObj = null;
    this.hasValidSyntax = false;
    this.info = true;
  }

  get eventsList() {
    return Object.keys(this.EVENTS);
  }

  get parsedPlugin(): { id: string; path: string; args: object; events: string[] } | null {
    if (!this.fullPluginObj || !this.hasValidSyntax) {
      return null;
    }

    const entry = Object.entries(this.fullPluginObj.plugins?.register || {})?.[0];
    if (!entry) {
      return null;
    }
    const [id, plugin] = entry as [string, any];

    const path = plugin?.path;
    const args = plugin?.args;

    const eventsConfig = this.fullPluginObj.plugins?.events || {};
    const events = Object.keys(eventsConfig || {}).filter((ev) => eventsConfig[ev].includes(id));

    if (!id || !path || !args) {
      return null;
    }

    return { id, path, args, events };
  }

  confirmImport() {
    if (!this.parsedPlugin) {
      return;
    }

    this.$emit("import", this.parsedPlugin);
  }
}
</script>
