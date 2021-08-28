<template>
  <v-expansion-panel>
    <v-expansion-panel-header>
      <template #default="{ open }">
        <v-row dense class="mt-3">
          <v-col cols="12" sm="3">
            <v-text-field
              @click.stop
              label="Identifier"
              placeholder="Enter a name for the plugin"
              flat
              dense
              v-model="id"
              @input="dirty = true"
              :clearable="open"
              :rules="[(val) => (!!val && !!val.trim()) || 'Required']"
              :error-messages="idErrorMessages"
              :hint="hint"
              persistent-hint
            ></v-text-field>
          </v-col>
          <v-fade-transition>
            <v-col cols="12" sm="9" v-show="open">
              <FileBrowserField
                @click.stop
                label="Path"
                placeholder="Enter the path to the plugin file (.js file)"
                flat
                dense
                v-model="path"
                @input="onPathChange"
                clearable
                :loading="validatingPlugin"
                :rules="[(val) => (!!val && !!val.trim()) || 'Required']"
                :error-messages="pathErrorMessages"
                :extensions="['.js', '.ts']"
                :defaultBrowsePath="path"
              >
              </FileBrowserField>
            </v-col>
          </v-fade-transition>
        </v-row>
      </template>
      <template #actions>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn icon small color="error" v-on="on" @click.stop="confirmDeletion = true">
              <v-icon color="error">mdi-close</v-icon>
            </v-btn>
          </template>
          <span>Remove plugin</span>
        </v-tooltip>
        <v-icon> $expand </v-icon>
      </template>
    </v-expansion-panel-header>

    <v-expansion-panel-content>
      <v-row dense>
        <v-col cols="12" sm="6">
          <CodeTextArea
            v-model="argsStr"
            @input="dirty = true"
            @hasValidSyntax="hasValidArgsSyntax = $event"
            @inputObj="args = $event"
            label="args"
            rows="4"
            placeholder="Edit or paste the plugin arguments."
            no-resize
            auto-grow
            clearable
            :errorMessages="hasValidArgs ? [] : ['Invalid arguments for plugin']"
            :loading="validatingPlugin"
          ></CodeTextArea>
        </v-col>
        <v-col cols="12" sm="6">
          <v-row no-gutters>
            <template
              v-if="
                value.name || value.authors.length || value.description || value.requiredVersion
              "
            >
              <v-col cols="12" sm="6" v-if="value.name">
                <div class="d-flex align-center">
                  <v-icon>mdi-label</v-icon>
                  <v-subheader>Name</v-subheader>
                </div>
                <div class="pa-2 med--text">
                  {{ value.name }}
                </div>
              </v-col>

              <v-col cols="12" sm="6" v-if="value.authors.length">
                <div class="d-flex align-center">
                  <v-icon>mdi-account-group</v-icon>
                  <v-subheader>Authors</v-subheader>
                </div>
                <div class="pa-2 med--text">
                  {{ value.authors.join(", ") }}
                </div>
              </v-col>

              <v-col cols="12" sm="6" v-if="value.description">
                <div class="d-flex align-center">
                  <v-icon>mdi-text</v-icon>
                  <v-subheader>Description</v-subheader>
                </div>
                <div class="pa-2 med--text">
                  {{ value.description }}
                </div>
              </v-col>

              <v-col cols="12" sm="6" v-if="value.requiredVersion">
                <div class="d-flex align-center">
                  <v-icon>mdi-source-branch</v-icon>
                  <v-subheader>Required version</v-subheader>
                </div>
                <div class="pa-2 med--text">
                  {{ value.requiredVersion }}
                </div>
              </v-col>
            </template>
            <template v-else>
              <v-col cols="12">
                <v-alert type="info" dense dismissible>No plugin metadata available</v-alert>
                <v-alert
                  type="warning"
                  dense
                  dismissible
                  v-if="value.hasValidPath"
                  class="black--text"
                >
                  If you're running Porn Vault 0.27+, this plugin might need to be updated
                </v-alert>
              </v-col>
            </template>
          </v-row>
        </v-col>
      </v-row>
    </v-expansion-panel-content>

    <v-dialog v-model="confirmDeletion" max-width="400px">
      <v-card>
        <v-card-title>Really delete {{ value.id || "(unnamed plugin)" }} ?</v-card-title>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="confirmDeletion = false" text class="text-none">Cancel</v-btn>
          <v-btn @click="$emit('delete')" text color="error" class="text-none">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-expansion-panel>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import FileBrowserField from "@/components/FileBrowserField.vue";
import CodeTextArea from "@/components/CodeTextArea.vue";
import { validatePlugin } from "@/api/plugins";

interface IPlugin {
  id: string;
  path: string;
  args: object;
  hasValidArgs: boolean;
  hasValidPath: boolean;
  hasValidVersion: boolean;
  version: string;
  requiredVersion: string;
  name: string;
  events: string[];
  authors: string[];
  description: string;
  dirty: boolean;
}

@Component({
  components: {
    FileBrowserField,
    CodeTextArea,
  },
})
export default class PluginItem extends Vue {
  @Prop() value!: IPlugin;
  @Prop() hasConflictingId!: boolean;

  id = this.value.id;
  path = this.value.path;
  args = this.value.args;
  argsStr = JSON.stringify(this.value.args, null, 2);
  hasValidArgs = this.value.hasValidArgs;
  hasValidArgsSyntax = true;
  hasValidPath = this.value.hasValidPath;
  hasValidVersion = this.value.hasValidVersion;
  version = this.value.version;
  requiredVersion = this.value.requiredVersion;
  name = this.value.name;
  events = this.value.events;
  authors = this.value.authors;
  description = this.value.description;
  dirty = this.value.dirty;

  confirmDeletion = false;
  validatingPlugin = false;
  validatePluginTimeout: number | null = null;

  get hint() {
    const meta = [this.value.version, this.value.events.join(", ")].filter(Boolean).join(" - ");
    return meta || "No metadata available";
  }

  get idErrorMessages() {
    return [this.hasConflictingId ? "Conflicting id" : ""].filter(Boolean);
  }

  emitValue() {
    const newValue = JSON.parse(JSON.stringify(this.value)) as IPlugin;
    newValue.id = this.id;
    newValue.path = this.path;
    newValue.args = this.args;
    newValue.hasValidArgs = this.hasValidArgs && this.hasValidArgsSyntax;
    newValue.hasValidPath = this.hasValidPath;
    newValue.version = this.version;
    newValue.requiredVersion = this.requiredVersion;
    newValue.name = this.name;
    newValue.events = this.events;
    newValue.authors = this.authors;
    newValue.description = this.description;
    newValue.hasValidVersion = this.hasValidVersion;

    // Simple compare: only emit if the value is different
    // This prevents emitting after checking the plugin and there were no
    // differences in the validation result
    if (JSON.stringify(this.value) !== JSON.stringify(newValue)) {
      this.$emit("input", newValue);
    }
  }

  @Watch("id")
  onIdChange() {
    this.emitValue();
  }

  onPathChange() {
    this.dirty = true;
    this.emitValue(); // Emit right away
    this.validatePluginHook(false); // Then check path async
  }

  @Watch("args")
  onArgsChange() {
    this.emitValue();
  }

  @Watch("hasValidArgsSyntax")
  onHasValidArgsSyntaxChange() {
    this.emitValue();
  }

  validatePluginHook(immediate = false): void {
    if (!this.dirty) {
      return;
    }

    if (this.validatePluginTimeout) {
      clearTimeout(this.validatePluginTimeout);
      this.validatePluginTimeout = null;
    }
    this.validatingPlugin = true;
    if (immediate) {
      this.validatePlugin();
    } else {
      this.validatePluginTimeout = window.setTimeout(this.validatePlugin, 500);
    }
  }

  async validatePlugin() {
    this.validatingPlugin = true;
    this.hasValidPath = true;

    if (!this.path) {
      this.validatingPlugin = false;
      this.version = "";
      this.events = [];
      this.authors = [];
      this.description = "";
      this.requiredVersion = "";
      this.name = "";
      this.hasValidPath = false;
      this.emitValue();
      return;
    }

    try {
      const res = await validatePlugin(this.path);
      const plugin = res.data;
      this.version = plugin.version;
      this.events = plugin.events;
      this.authors = plugin.authors;
      this.description = plugin.description;
      this.requiredVersion = plugin.requiredVersion;
      this.name = plugin.name;
      this.hasValidVersion = plugin.hasValidVersion;
      this.hasValidArgs = plugin.hasValidArgs;
    } catch (err) {
      // Remove metadata, since the path doesn't lead
      // to a valid plugin field
      this.version = "";
      this.events = [];
      this.authors = [];
      this.description = "";
      this.requiredVersion = "";
      this.name = "";
      this.hasValidPath = false;
      // Don't change hasValidVersion & hasValidArgs
      // since there is no file to check against
    }

    this.validatingPlugin = false;
    this.emitValue();
  }

  get pathErrorMessages(): string[] {
    return [
      this.hasValidPath ? "" : "Invalid plugin file",
      this.hasValidVersion ? "" : "Plugin is not compatible with your version of Porn Vault",
    ].filter(Boolean);
  }

  created() {
    this.validatePluginHook(true);
    this.emitValue();
  }
}
</script>
