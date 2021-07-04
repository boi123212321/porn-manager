<template>
  <v-container fluid>
    <BindFavicon />
    <BindTitle value="Settings" />

    <div class="mx-auto d-flex flex-column tabs-container">
      <v-navigation-drawer v-if="showSidenav" style="z-index: 14" v-model="drawer" clipped app>
        <div class="d-flex flex-column">
          <v-btn
            v-for="item in settingsPages"
            :key="item.path"
            class="justify-start text-none"
            text
            :to="item.path"
            block
            exact
            :style="{ paddingLeft: item.path !== '/settings' ? '24px' : '16px' }"
          >
            <span>{{ item.meta.title }}</span>
          </v-btn>
        </div>
      </v-navigation-drawer>

      <slot></slot>
    </div>
  </v-container>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import { mixins } from "vue-class-component";

import DrawerMixin from "@/mixins/drawer";
import { contextModule } from "@/store/context";

import { routes } from "@/router";

@Component({})
export default class Settings extends mixins(DrawerMixin) {
  get settingsPages() {
    return routes.filter((route) => route.path.startsWith("/settings"));
  }

  get showSidenav() {
    return contextModule.showSidenav;
  }
}
</script>
