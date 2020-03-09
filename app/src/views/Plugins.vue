<template>
  <v-container>
    <v-btn class="mb-3" @click="addPlugin">Add plugin</v-btn>
    <v-alert class="mb-3" v-if="hasConflictingIds" dense type="error">Conflicting plugin IDs</v-alert>
    <v-alert
      class="mb-3"
      v-if="unknownPlugins.length"
      dense
      type="error"
    >Unknown plugin(s): {{ unknownPlugins.join(", ")}}</v-alert>
    <v-alert
      class="mb-3 black--text"
      v-if="unusedPlugins.length"
      dense
      type="warning"
    >Unused plugin(s): {{ unusedPlugins.join(", ") }}</v-alert>
    <v-subheader>Plugins</v-subheader>
    <Plugin
      @delete="removePlugin(i)"
      class="mb-2"
      v-model="plugins[i]"
      v-for="(plugin, i) in plugins"
      :key="plugin.iid"
    />
    <v-subheader>Events</v-subheader>
    <div v-for="(_, eventName) in events" :key="eventName">
      <v-combobox
        chips
        dense
        hint="Press 'Enter' to add plugin name"
        :placeholder="eventName"
        clearable
        v-model="events[eventName]"
        multiple
      ></v-combobox>
    </div>
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
      <pre v-if="!hasConflictingIds && !unknownPlugins.length">{{ output }}</pre>
      <div v-else>Invalid input. See error above.</div>
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

  events = {
    actorCreated: [],
    sceneCreated: [],
    actorCustom: [],
    sceneCustom: [],
    movieCreated: []
  };

  mounted() {
    this.compileOutput();
  }

  get unusedPlugins() {
    const pluginNames = [] as string[];
    for (const pluginName of this.plugins.map(p => p.id)) {
      let used = false;
      for (const eventName in this.events) {
        for (const usedPluginName of this.events[eventName]) {
          if (usedPluginName == pluginName) used = true;
        }
      }
      if (!used) pluginNames.push(pluginName);
    }
    return pluginNames;
  }

  get unknownPlugins() {
    const pluginNames = [] as string[];
    for (const eventName in this.events) {
      for (const pluginName of this.events[eventName]) {
        if (!this.plugins.find(p => p.id == pluginName)) {
          pluginNames.push(pluginName);
        }
      }
    }
    return pluginNames;
  }

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
    if (this.plugins.length == 0) this.counter = 0;
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
      this.output = JSON.stringify(
        { PLUGINS: pluginMap, PLUGIN_EVENTS: this.events },
        null,
        2
      );
    else
      this.output = YAML.stringify({
        PLUGINS: pluginMap,
        PLUGIN_EVENTS: this.events
      });
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

  @Watch("events", { deep: true })
  onEventChange() {
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