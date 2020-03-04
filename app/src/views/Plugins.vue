<template>
  <v-container>
    <v-btn class="mb-3" @click="addPlugin">Add plugin</v-btn>
    <v-alert v-if="hasConflictingIds" dense type="error">Conflicting plugin IDs</v-alert>
    <Plugin
      @delete="removePlugin(i)"
      class="mb-2"
      v-model="plugins[i]"
      v-for="(plugin, i) in plugins"
      :key="plugin.iid"
    />
    <div style="position: relative" class="white--text mt-3 pa-2 output">
      <div class="d-flex align-center">
        <span
          @click="mode='json'; compileOutput()"
          class="hover"
          :class="mode=='json' ? 'font-weight-black' : ''"
        >JSON</span>/
        <span
          @click="mode='yaml'; compileOutput()"
          class="hover"
          :class="mode=='yaml' ? 'font-weight-black' : ''"
        >YAML</span>
        <v-spacer></v-spacer>
        <v-btn icon @click="copyOutput">
          <v-icon>mdi-content-copy</v-icon>
        </v-btn>
      </div>
      <v-divider class="mb-3 mt-1"></v-divider>
      <pre v-if="!hasConflictingIds">{{ output }}</pre>
      <div v-else>Malformed input. See error above.</div>
    </div>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import Plugin from "@/components/Plugins/plugin.vue";
import YAML from "yaml";

interface IPlugin {
  id: string;
  iid: string;
  path: string;
  args: Record<string, string>;
}

@Component({
  components: {
    Plugin
  }
})
export default class PluginPage extends Vue {
  plugins = [] as IPlugin[];
  counter = 0;

  mode = "json" as "json" | "yaml";

  output = "";

  get hasConflictingIds() {
    const idMap = {} as Record<string, boolean>;
    for (const plugin of this.plugins) {
      if (idMap[plugin.id] !== undefined) return true;
      idMap[plugin.id] = true;
    }
    return false;
  }

  removePlugin(i: number) {
    this.plugins.splice(i, 1);
  }

  copyOutput() {
    navigator.clipboard.writeText(this.output).then(
      () => {
        /* clipboard successfully set */
      },
      () => {
        /* clipboard write failed */
      }
    );
  }

  compileOutput() {
    const pluginMap = {} as Record<string, any>;

    for (const plugin of this.plugins) {
      const obj = {
        path: plugin.path,
        args: plugin.args
      };
      if (!Object.keys(plugin.args).length) delete obj.args;
      pluginMap[plugin.id] = obj;
    }

    if (this.mode == "json")
      this.output = JSON.stringify({ PLUGINS: pluginMap }, null, 2);
    else this.output = YAML.stringify({ PLUGINS: pluginMap });
  }

  addPlugin() {
    this.plugins.push({
      id: "Plugin " + this.counter++,
      iid: this.counter.toString(),
      path: "",
      args: {}
    });
    this.compileOutput();
  }

  @Watch("plugins", { deep: true })
  onPluginChange() {
    this.compileOutput();
  }
}
</script>

<style lang="scss" scoped>
.output {
  background: #090909;
  border-radius: 4px;
}
</style>