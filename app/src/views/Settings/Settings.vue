<template>
  <SettingsWrapper>
    <div v-for="page in settingsPages" :key="page.path" class="mb-3 d-flex flex-column">
      <router-link :to="page.path" style="text-decoration: none">
        <v-card class="hover">
          <v-card-title>{{ page.meta.title }}</v-card-title>
          <v-card-text>{{ page.meta.description }} </v-card-text>
        </v-card>
      </router-link>
    </div>
  </SettingsWrapper>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { mixins } from "vue-class-component";

import DrawerMixin from "@/mixins/drawer";
import SettingsWrapper from "@/components/SettingsWrapper.vue";

import { routes } from "@/router";

@Component({
  components: {
    SettingsWrapper,
  },
})
export default class Settings extends mixins(DrawerMixin) {
  get settingsPages() {
    return routes.filter(
      (route) => route.path.startsWith("/settings") && route.path !== "/settings"
    );
  }
}
</script>
