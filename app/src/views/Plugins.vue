<template>
  <SettingsWrapper>
    <BindFavicon />

    <!-- Make the banner appear above plugin item expansion panels -->
    <v-banner class="mb-3" app sticky style="z-index: 2">
      <h3>Plugins</h3>
      <template #actions>
        <!-- Icon toolbar and alert messages -->
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn
              v-on="on"
              @click="showReloadConfirmation = true"
              icon
              color="error"
              :disabled="!dirty"
            >
              <v-icon>mdi-reload-alert</v-icon>
            </v-btn>
          </template>
          <span>Discard changes and reload</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" @click="saveAll" icon :disabled="hasError || !dirty">
              <v-icon>mdi-content-save</v-icon>
            </v-btn>
          </template>
          <span>Save settings</span>
        </v-tooltip>
      </template>
    </v-banner>

    <v-alert class="mb-3" v-if="hasUnnamedPlugins" dense type="error">Empty plugin ID(s)</v-alert>
    <v-alert class="mb-3" v-if="unknownPlugins.length" dense type="error"
      >Unknown plugin(s): {{ unknownPlugins.join(", ") }}
    </v-alert>
    <v-alert class="mb-3" v-if="conflictingIds.length" dense type="error"
      >Conflicting plugin IDs: {{ conflictingIds.join(", ") }}
    </v-alert>
    <v-alert class="mb-3 black--text" v-if="invalidPluginArgNames.length" dense type="error"
      >Invalid args for plugin(s): {{ invalidPluginArgNames.join(", ") }}
    </v-alert>
    <v-alert class="mb-3 black--text" v-if="invalidPluginPathNames.length" dense type="error"
      >Invalid paths for plugin(s): {{ invalidPluginPathNames.join(", ") }}
    </v-alert>
    <v-alert class="mb-3 black--text" v-if="invalidPluginVersionNames.length" dense type="error"
      >Invalid versions for plugin(s): {{ invalidPluginVersionNames.join(", ") }}
    </v-alert>
    <v-alert class="mb-3 black--text" v-if="unusedPlugins.length" dense type="warning"
      >Unused plugin(s): {{ unusedPlugins.join(", ") }}
    </v-alert>

    <v-overlay absolute v-if="loadingConfig">
      <v-progress-circular indeterminate></v-progress-circular>
    </v-overlay>

    <!-- Plugins registration -->
    <v-card class="mb-3">
      <v-card-title>
        <v-icon class="pr-2 mb-1">mdi-toy-brick-outline</v-icon>Plugins
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" @click="addSinglePlugin" icon class="mb-1">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </template>
          <span>Add plugin</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" @click="importDialog = true" icon class="mb-1">
              <v-icon>mdi-file-import</v-icon>
            </v-btn>
          </template>
          <span>Import plugin configuration</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" @click="downloadDialog = true" icon class="mb-1">
              <v-icon>mdi-download</v-icon>
            </v-btn>
          </template>
          <span>Download plugins</span>
        </v-tooltip>
      </v-card-title>
      <v-card-subtitle>Add plugins and configure their default arguments</v-card-subtitle>
      <v-card-text>
        <v-alert type="info" dense dismissible>
          Before adding a plugin, make sure to download the plugin file (.js) somewhere accessible
          by Porn Vault.
        </v-alert>
        <div v-if="!editPlugins.length">You have no plugins. Click the "+" icon to add one.</div>
        <template v-else>
          <v-expansion-panels popout multiple>
            <Plugin
              @delete="removePlugin(plugin, i)"
              v-model="editPlugins[i]"
              @input="dirty = true"
              v-for="(plugin, i) in editPlugins"
              :key="plugin._key"
              :hasConflictingId="hasConflictingId(plugin)"
          /></v-expansion-panels>
        </template>
      </v-card-text>
    </v-card>

    <!-- Events mapping -->
    <v-card class="mb-3">
      <v-card-title><v-icon class="pr-2 mb-1">mdi-launch</v-icon>Events</v-card-title>
      <v-card-subtitle
        >Add your registered plugins to events and optionally override their default
        arguments</v-card-subtitle
      >
      <v-card-text>
        <v-alert type="info" dense dismissible>
          <div>
            Drag the handle to the left of a plugin id to change the order in which the plugins are
            executed.
          </div>
          <div>You can add a plugin to a same event multiple times with different arguments.</div>
        </v-alert>

        <v-row dense>
          <v-col cols="12" v-for="(event, eventKey) in EVENTS" :key="eventKey">
            <v-expansion-panels popout multiple>
              <Event
                v-model="editEvents[eventKey]"
                @input="dirty = true"
                :eventKey="eventKey"
                :availablePlugins="pluginsBySupportedEvents[eventKey]"
              ></Event>
            </v-expansion-panels>
          </v-col> </v-row
      ></v-card-text>
    </v-card>

    <!-- Global settings -->
    <v-card class="mb-3">
      <v-card-title>
        <v-icon class="pr-2 mb-1">mdi-tune</v-icon>Global plugin settings
      </v-card-title>
      <v-card-subtitle>Configure the behaviour of all plugins</v-card-subtitle>
      <v-card-text>
        <v-row>
          <v-col cols="12" :sm="3" v-for="(globalSetting, key) in GLOBAL_SETTINGS_MAP" :key="key">
            <v-switch
              v-if="globalSetting.type === 'boolean'"
              v-model="editGlobalValues[key]"
              @input="dirty = true"
              flat
              dense
              hide-details
              v-bind="globalSetting.props"
            ></v-switch>
            <v-text-field
              v-if="globalSetting.type !== 'boolean'"
              v-model="editGlobalValues[key]"
              @input="dirty = true"
              flat
              dense
              v-bind="globalSetting.props"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Full assembled config -->
    <v-row>
      <v-col>
        <v-expansion-panels>
          <v-expansion-panel>
            <v-expansion-panel-header> <h3>Raw config</h3> </v-expansion-panel-header>
            <v-expansion-panel-content>
              <CodeTextArea
                :value="fullConfig && !hasError ? JSON.stringify(fullConfig) : ''"
                readonly
                :errorMessages="hasError ? ['Invalid config. See error above.'] : []"
                auto-grow
                persistent-hint
              >
              </CodeTextArea>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>

    <v-dialog v-model="showReloadConfirmation" max-width="400px">
      <v-card>
        <v-card-title>Really abandon all changes and reload ?</v-card-title>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showReloadConfirmation = false" text class="text-none">Cancel</v-btn>
          <v-btn
            @click="
              showReloadConfirmation = false;
              loadPluginsConfig();
            "
            text
            color="error"
            class="text-none"
            >Reload</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ImportPluginDialog v-model="importDialog" @import="importPlugin"></ImportPluginDialog>
    <DownloadPluginsDialog
      v-model="downloadDialog"
      @addPlugins="addPluginsFromDownload"
    ></DownloadPluginsDialog>
  </SettingsWrapper>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

import SettingsWrapper from "@/components/SettingsWrapper.vue";
import Plugin from "@/components/Plugins/Item.vue";
import Event from "@/components/Plugins/Event.vue";
import ImportPluginDialog from "@/components/Plugins/ImportPluginDialog.vue";
import DownloadPluginsDialog from "@/components/Plugins/DownloadPluginsDialog.vue";
import CodeTextArea from "@/components/CodeTextArea.vue";
import {
  GlobalConfigValue,
  getPluginsConfig,
  ConfigPlugin,
  PluginRes,
  savePluginsConfig,
} from "@/api/plugins";
import { getEvents, getGlobalSettingsMap } from "@/constants/plugins";
import { EditEventPlugin, EditPlugin } from "@/types/plugins";

@Component({
  components: {
    Plugin,
    CodeTextArea,
    ImportPluginDialog,
    DownloadPluginsDialog,
    SettingsWrapper,
    Event,
  },
})
export default class PluginPage extends Vue {
  showFullConfig = false;
  showReloadConfirmation = false;
  importDialog = false;
  downloadDialog = false;
  confirmClearEventPluginsKey = "";

  counter = 0;
  editPlugins = [] as EditPlugin[];
  editEvents: Record<string, EditEventPlugin[]> = Object.fromEntries(
    Object.keys(this.EVENTS).map((key) => [key, []])
  );
  editGlobalValues: Record<string, GlobalConfigValue> = {};
  dirty = false;

  loadingConfig = true;
  errorSaving = false;
  config: PluginRes | null = null;

  get EVENTS() {
    return getEvents();
  }

  get GLOBAL_SETTINGS_MAP() {
    return getGlobalSettingsMap();
  }

  toEditPlugin(configPlugin: ConfigPlugin): EditPlugin {
    return {
      _key: ++this.counter,
      id: configPlugin.id,
      name: configPlugin.name,
      path: configPlugin.path,
      args: configPlugin.args,
      version: configPlugin.version,
      requiredVersion: configPlugin.requiredVersion,
      hasValidArgs: true,
      hasValidPath: true,
      hasValidVersion: true,
      events: configPlugin.events,
      authors: configPlugin.authors,
      description: configPlugin.description,
      dirty: false,
    };
  }

  toEventPlugins(eventPlugins: (string | [string, object])[]): EditEventPlugin[] {
    return eventPlugins.map((plugin) => {
      if (Array.isArray(plugin)) {
        const [pluginId, pluginArgs] = plugin;
        const editPlugin = this.editPlugins.find((p) => p.id === pluginId)!;
        return {
          _key: ++this.counter,
          _pluginKey: editPlugin?._key,
          id: pluginId,
          args: pluginArgs,
          hasValidArgs: true,
          hasCustomArgs: true,
        };
      }
      const editPlugin = this.editPlugins.find((p) => p.id === plugin)!;
      return {
        _key: ++this.counter,
        _pluginKey: editPlugin?._key,
        id: plugin,
        args: null,
        hasValidArgs: true,
        hasCustomArgs: false,
      };
    });
  }

  async saveAll() {
    this.loadingConfig = true;

    try {
      await savePluginsConfig(this.fullConfig.plugins);
      this.dirty = false;
    } catch (err) {
      this.errorSaving = true;
    }

    this.loadingConfig = false;
  }

  get pluginsBySupportedEvents(): Record<string, EditPlugin[]> {
    return Object.keys(this.EVENTS).reduce((acc, event) => {
      // A plugin is "compatible" with the event if it doesn't have any events listed,
      // or the event is contained in the non empty list
      acc[event] = this.editPlugins.filter((p) => !p.events.length || p.events.includes(event));
      return acc;
    }, {});
  }

  get unusedPlugins(): string[] {
    return this.editPlugins
      .filter(
        (plugin) =>
          plugin.id &&
          !Object.keys(this.EVENTS).some(
            (eventName) => !!this.editEvents[eventName]?.find((ep) => ep.id === plugin.id)
          )
      )
      .map((p) => p.id || "(unnamed plugin)");
  }

  get unknownPlugins(): string[] {
    const unregisteredPluginNames = [] as string[];
    for (const [eventName, eventPlugins] of Object.entries(this.editEvents)) {
      unregisteredPluginNames.push(
        ...eventPlugins
          .filter(({ id }) => !this.editPlugins.find((p) => p.id === id))
          .map((eventPlugin) => eventPlugin.id || "(unnamed plugin)")
      );
    }
    return [...new Set(unregisteredPluginNames)];
  }

  get hasUnnamedPlugins(): boolean {
    return this.editPlugins.some((p) => !p.id || !p.id.trim());
  }

  get conflictingIds() {
    const dupIds: string[] = [];
    const idMap = {} as Record<string, boolean>;
    for (const plugin of this.editPlugins) {
      if (idMap[plugin.id] === true) {
        dupIds.push(plugin.id || "(unnamed plugin)");
      }
      idMap[plugin.id] = true;
    }
    return [...new Set(dupIds)];
  }

  get invalidPluginArgNames(): string[] {
    const ids = this.editPlugins.filter((p) => p.id && !p.hasValidArgs).map((p) => p.id);
    return [...new Set(ids)];
  }

  get invalidPluginPathNames(): string[] {
    const ids = this.editPlugins.filter((p) => p.id && !p.hasValidPath).map((p) => p.id);
    return [...new Set(ids)];
  }

  get invalidPluginVersionNames(): string[] {
    const ids = this.editPlugins.filter((p) => p.id && !p.hasValidVersion).map((p) => p.id);
    return [...new Set(ids)];
  }

  get hasError(): boolean {
    return (
      this.hasUnnamedPlugins ||
      !!this.unknownPlugins.length ||
      !!this.conflictingIds.length ||
      !!this.invalidPluginArgNames.length ||
      !!this.invalidPluginPathNames.length ||
      !!this.invalidPluginVersionNames.length
    );
  }

  removePlugin(plugin: EditPlugin, i: number) {
    this.dirty = true;
    // Remove the plugin
    const wasConflictingId = this.conflictingIds.includes(plugin.id);
    this.editPlugins.splice(i, 1);
    if (!wasConflictingId) {
      // Remove the plugin from events
      Object.keys(this.editEvents).forEach((event) => {
        this.editEvents[event] = this.editEvents[event].filter(
          (eventPlugin) => eventPlugin._pluginKey !== plugin._key
        );
      });
    }
    // Reset plugin counter if we have no more plugins
    if (this.editPlugins.length == 0) {
      this.counter = 0;
    }
  }

  get fullConfig() {
    const pluginMap = {} as Record<string, any>;

    for (const plugin of this.editPlugins) {
      const obj = {
        path: plugin.path,
        args: plugin.args,
      };
      pluginMap[plugin.id] = obj;
    }
    const eventsMap: Record<string, (string | [string, object])[]> = {};
    for (const event in this.EVENTS) {
      const eventPlugins = this.editEvents[event] || [];
      const mappedPlugins = eventPlugins.map<string | [string, object]>((ep) =>
        ep.args ? [ep.id, ep.args] : ep.id
      );
      eventsMap[event] = mappedPlugins;
    }
    const globalSettingsMap = {} as Record<string, any>;
    for (const [globalSetting, value] of Object.entries(this.editGlobalValues)) {
      globalSettingsMap[globalSetting] = value;
    }

    return { plugins: { ...globalSettingsMap, events: eventsMap, register: pluginMap } };
  }

  addSinglePlugin(): void {
    this.addPlugins([{ id: "", path: "" }]);
  }

  addPluginsFromDownload(plugins: { id: string; path: string }[]): void {
    this.downloadDialog = false;
    this.addPlugins(plugins);
  }

  addPlugins(plugins: { id: string; path: string }[]): void {
    plugins.forEach((plugin) => {
      this.editPlugins.push({
        _key: ++this.counter,
        id: plugin.id,
        name: "",
        path: plugin.path,
        args: {},
        hasValidArgs: true,
        hasValidPath: false,
        hasValidVersion: true,
        version: "",
        requiredVersion: "",
        events: [],
        authors: [],
        description: "",
        dirty: !!plugin.path,
      });
    });
  }

  importPlugin(plugin: { id: string; path: string; args: object; events: string[] }): void {
    this.dirty = true;
    const pluginKey = ++this.counter;
    this.editPlugins.push({
      _key: pluginKey,
      id: plugin.id,
      name: "",
      path: plugin.path,
      args: plugin.args,
      hasValidArgs: true,
      hasValidPath: false,
      hasValidVersion: true,
      version: "",
      requiredVersion: "",
      events: plugin.events,
      authors: [],
      description: "",
      dirty: !!plugin.path,
    });
    plugin.events.forEach((ev) => {
      if (!this.editEvents[ev].find((ep) => ep.id === plugin.id)) {
        this.editEvents[ev].push({
          _key: ++this.counter,
          _pluginKey: pluginKey,
          id: plugin.id,
          args: null,
          hasValidArgs: true,
          hasCustomArgs: false,
        });
      }
    });
    this.importDialog = false;
  }

  hasConflictingId(plugin: EditPlugin) {
    return this.editPlugins.filter((p) => p.id === plugin.id).length > 1;
  }

  async loadPluginsConfig() {
    this.loadingConfig = true;

    try {
      const res = await getPluginsConfig();
      this.config = res.data;

      this.editPlugins = Object.values(this.config.register).map((pluginConfig) =>
        this.toEditPlugin(pluginConfig)
      );
      this.editEvents = Object.entries(this.config.events).reduce(
        (acc, [eventName, configEventPlugins]) => {
          acc[eventName] = this.toEventPlugins(configEventPlugins);
          return acc;
        },
        {}
      );
      // Add events that the user doesn't have in his config
      Object.keys(this.EVENTS).forEach((eventKey) => {
        this.editEvents[eventKey] = this.editEvents[eventKey] || [];
      });

      this.editGlobalValues = { ...this.config.global };
      this.dirty = false;
    } catch (err) {
      console.error(err);
    }

    this.loadingConfig = false;
  }

  created() {
    this.loadPluginsConfig();
  }
}
</script>

<style lang="scss" scoped></style>
