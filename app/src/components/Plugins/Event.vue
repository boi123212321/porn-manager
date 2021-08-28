<template>
  <v-expansion-panel>
    <v-expansion-panel-header>
      <template #default="{ open }">
        <v-row no-gutters>
          <v-col cols="6">
            {{ event.label }}
            <v-badge v-if="value.length" inline color="blue" :content="value.length"></v-badge>

            <v-menu offset-y>
              <template v-slot:activator="{ on: onMenu }">
                <v-tooltip bottom>
                  <template #activator="{ on: onTooltip }">
                    <v-btn
                      icon
                      small
                      v-on="{ ...onMenu, ...onTooltip }"
                      :disabled="!availablePlugins.length"
                    >
                      <v-icon>mdi-plus</v-icon>
                    </v-btn>
                  </template>
                  Add a registered plugin to this event
                </v-tooltip>
              </template>
              <v-list dense v-if="availablePlugins.length">
                <v-list-item
                  v-for="plugin in availablePlugins"
                  :key="plugin._key"
                  link
                  @click="addPlugin(plugin)"
                >
                  <v-list-item-content>
                    <v-list-item-title v-text="plugin.id"></v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-col>
          <v-col cols="6" class="text--secondary">
            <v-fade-transition>
              <span v-if="open">event: {{ event.key }}</span>
            </v-fade-transition>
          </v-col>
        </v-row></template
      >

      <template #actions>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn
              icon
              small
              color="error"
              v-on="on"
              :disabled="!value.length"
              @click.stop="confirmClearPlugins = eventKey"
            >
              <v-icon color="error">mdi-close</v-icon>
            </v-btn>
          </template>
          <span>Clear plugins</span>
        </v-tooltip>
        <v-icon> $expand </v-icon>
      </template>
    </v-expansion-panel-header>

    <!-- Always render event plugins so they can run validation -->
    <v-expansion-panel-content eager>
      <v-expansion-panels popout multiple>
        <template v-if="value.length">
          <draggable v-model="value" handle=".plugin-handle" class="event-plugins-drag-container">
            <EventPlugin
              v-for="(eventPlugin, i) in value"
              :key="eventPlugin._key"
              v-model="value[i]"
              @input="dirty = true"
              :plugin="availablePluginsByKey[eventPlugin._pluginKey]"
              @delete="removeEventPlugin(eventPlugin._key)"
              :disableDrag="value.length === 1"
            ></EventPlugin>
          </draggable>
        </template>
        <v-row v-else>
          <v-col cols="12">
            <template v-if="!availablePlugins.length">
              You don't have any registered plugins that are compatible for this event.
            </template>
            <template v-else>
              You don't have any plugins configured to run for this event. Click the "+" icon to add
              one.
            </template>
          </v-col>
        </v-row>
      </v-expansion-panels>
    </v-expansion-panel-content>

    <v-dialog v-model="confirmClearPlugins" max-width="400px">
      <v-card>
        <v-card-title>Really clear all plugins for this event ?</v-card-title>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="confirmClearPlugins = false" text class="text-none">Cancel</v-btn>
          <v-btn @click="clearPlugins" text color="error" class="text-none">Clear</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-expansion-panel>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import draggable from "vuedraggable";

import EventPlugin from "@/components/Plugins/EventPlugin.vue";
import { EditEventPlugin, EditPlugin } from "@/types/plugins";
import { getEvents } from "../../constants/plugins";

@Component({
  components: {
    EventPlugin,
    draggable,
  },
})
export default class Event extends Vue {
  @Prop() value!: EditEventPlugin[];
  @Prop() availablePlugins!: EditPlugin[];
  @Prop() eventKey!: string;
  confirmClearPlugins = false;

  counter = 0;

  get EVENTS() {
    return getEvents();
  }

  get event() {
    return this.EVENTS[this.eventKey];
  }

  get availablePluginsByKey(): Record<string, EditPlugin> {
    return this.availablePlugins.reduce((acc, plugin) => {
      acc[plugin._key] = plugin;
      return acc;
    }, {});
  }

  addPlugin(plugin: EditPlugin): void {
    this.value.push({
      _key: ++this.counter,
      _pluginKey: plugin._key,
      id: plugin.id,
      args: null,
      hasValidArgs: true,
      hasCustomArgs: false,
    });
    this.$emit("input", this.value);
  }

  clearPlugins(): void {
    this.value = [];
    this.confirmClearPlugins = false;
  }

  removeEventPlugin(pluginKey: number): void {
    this.value = this.value.filter((p) => p._key !== pluginKey);
  }
}
</script>

<style lang="scss" scoped>
.event-plugins-drag-container {
  display: flex;
  flex: 1;
  flex-direction: column;
}
</style>
