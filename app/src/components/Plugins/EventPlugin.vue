<template>
  <v-expansion-panel>
    <v-expansion-panel-header>
      <template #default>
        <v-row no-gutters>
          <v-col cols="6">
            <v-icon style="cursor: move" :disabled="disableDrag" @click.stop class="plugin-handle">
              mdi-drag-horizontal
            </v-icon>
            {{ value.id }}
          </v-col>
          <v-col cols="6">
            <span class="med--text">{{ hasCustomArgs ? "custom args" : "default args" }}</span>
          </v-col>
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
      <v-row>
        <v-col cols="12" sm="6">
          <CodeTextArea
            :value="plugin && plugin.args ? JSON.stringify(plugin.args) : ''"
            label="default args"
            rows="4"
            placeholder="No default arguments available"
            no-resize
            auto-grow
            readonly
          >
          </CodeTextArea>
        </v-col>
        <v-col cols="12" sm="6">
          <CodeTextArea
            v-model="argsStr"
            @input="dirty = true"
            @hasValidSyntax="hasValidArgsSyntax = $event"
            @inputObj="args = $event"
            label="args"
            rows="4"
            placeholder="Edit or paste the plugin arguments. Leave empty to use default arguments."
            no-resize
            auto-grow
            clearable
            :errorMessages="hasValidArgs ? [] : ['Invalid arguments for plugin']"
            :hint="
              hasCustomArgs
                ? 'Custom args'
                : args
                ? 'Same as default args'
                : 'No value, will use default args'
            "
            persistent-hint
            :ignoreEmpty="true"
          >
            <template #actions>
              <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                  <v-btn v-on="on" @click="resetArgs" icon>
                    <v-icon>mdi-reload</v-icon>
                  </v-btn>
                </template>
                <span>Reset to default args</span>
              </v-tooltip>
            </template>
          </CodeTextArea>
        </v-col>
      </v-row>
    </v-expansion-panel-content>

    <v-dialog v-model="confirmDeletion" max-width="400px">
      <v-card>
        <v-card-title>
          Really remove {{ value.id || "(unnamed plugin)" }} from this event ?
        </v-card-title>
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

import CodeTextArea from "@/components/CodeTextArea.vue";
import { EditEventPlugin, EditPlugin } from "@/types/plugins";
import { validatePlugin } from "../../api/plugins";

@Component({
  components: {
    CodeTextArea,
  },
})
export default class EventPlugin extends Vue {
  @Prop() value!: EditEventPlugin;
  @Prop() plugin!: EditPlugin | null;
  @Prop() disableDrag!: boolean;

  args: object | null = this.value.args ? JSON.parse(JSON.stringify(this.value.args)) : null;
  argsStr = this.value.args ? JSON.stringify(this.value.args, null, 2) : "";
  hasValidArgs = this.value.hasValidArgs;
  hasValidArgsSyntax = true;
  confirmDeletion = false;

  dirty = false;
  validatingArgs = false;
  validateArgsTimeout: number | null = null;

  get hasCustomArgs(): boolean {
    return this.plugin?.args
      ? !!this.args && JSON.stringify(this.args) !== JSON.stringify(this.plugin.args)
      : !!this.args || this.args !== this.plugin?.args;
  }

  emitValue() {
    const newValue = JSON.parse(JSON.stringify(this.value)) as EditEventPlugin;
    newValue.args = JSON.parse(JSON.stringify(this.args));
    newValue.hasValidArgs = this.hasValidArgs && this.hasValidArgsSyntax;
    newValue.hasCustomArgs = this.hasCustomArgs;

    this.$emit("input", newValue);
  }

  @Watch("args")
  onArgsChange() {
    this.emitValue(); // Emit right away
    this.validateArgsHook(false); // Then validate args
  }

  @Watch("hasValidArgsSyntax")
  onHasValidArgsSyntaxChange() {
    this.emitValue();
  }

  resetArgs() {
    if (this.plugin?.args) {
      this.args = JSON.parse(JSON.stringify(this.plugin.args));
      this.argsStr = JSON.stringify(this.plugin.args, null, 2);
    } else {
      this.args = null;
      this.argsStr = "";
    }
  }

  validateArgsHook(immediate = false): void {
    if (!this.dirty) {
      return;
    }

    if (this.validateArgsTimeout) {
      clearTimeout(this.validateArgsTimeout);
      this.validateArgsTimeout = null;
    }
    this.validatingArgs = true;
    if (immediate) {
      this.validateArgs();
    } else {
      this.validateArgsTimeout = window.setTimeout(this.validateArgs, 500);
    }
  }

  @Watch("plugin.path")
  onPluginPathChange() {
    // On plugin path change, consider this item as dirty
    // to allow validating
    this.dirty = true;
    this.validateArgsHook(false);
  }

  async validateArgs() {
    this.validatingArgs = true;
    this.hasValidArgs = true;

    if (!this.plugin?.path) {
      // If the plugin doesn't have a path, just pretend the args are coorect
      this.validatingArgs = false;
      this.hasValidArgs = true;
      this.emitValue();
      return;
    }

    try {
      const res = await validatePlugin(this.plugin.path);
      const plugin = res.data;
      this.hasValidArgs = plugin.hasValidArgs;
    } catch (err) {
      this.hasValidArgs = false;
    }

    this.validatingArgs = false;
    this.emitValue();
  }

  created() {
    this.validateArgsHook(true);
  }
}
</script>
