<template>
  <v-app>
    <v-app-bar
      ref="appBar"
      dark
      :hide-on-scroll="showDetailsBar"
      dense
      style="z-index: 13"
      clipped-left
      app
      :color="appbarColor"
      v-if="!$route.meta || !$route.meta.hideAppBar"
    >
      <v-btn icon to="/" v-if="$vuetify.breakpoint.smAndUp">
        <v-icon>mdi-home</v-icon>
      </v-btn>

      <v-divider class="mx-2" inset vertical v-if="$vuetify.breakpoint.smAndUp"></v-divider>

      <div
        style="overflow: hidden; text-overflow: ellipsis"
        class="d-flex align-center"
        v-if="$vuetify.breakpoint.xsOnly"
      >
        <v-app-bar-nav-icon class="mr-2" @click="navDrawer = true"></v-app-bar-nav-icon>
        <v-toolbar-title v-if="currentScene" class="mr-1 title">{{
          currentScene.name
        }}</v-toolbar-title>
        <v-toolbar-title v-if="currentActor" class="mr-1 title">
          <div class="d-flex align-center">
            <Flag
              class="mr-2"
              v-if="currentActor.nationality"
              :value="currentActor.nationality.alpha2"
            />
            <div class="mr-1">{{ currentActor.name }}</div>
            <div class="subtitle-1 med--text" v-if="currentActor.bornOn">({{ age }})</div>
          </div>
        </v-toolbar-title>
        <v-toolbar-title v-if="currentMovie" class="mr-1 title">{{
          currentMovie.name
        }}</v-toolbar-title>
        <v-toolbar-title v-if="currentStudio" class="mr-1 title">{{
          currentStudio.name
        }}</v-toolbar-title>
      </div>

      <span v-else>
        <span v-for="item in navItems" :key="item.icon">
          <v-btn
            v-if="!item.mobile || $vuetify.breakpoint.xsOnly"
            :icon="$vuetify.breakpoint.smAndDown"
            class="mr-2 text-none"
            text
            :to="item.url"
          >
            <v-icon :left="$vuetify.breakpoint.mdAndUp">{{ item.icon }}</v-icon>
            <span v-if="$vuetify.breakpoint.mdAndUp">{{ item.text }}</span>
          </v-btn>
        </span>
      </span>

      <v-spacer></v-spacer>

      <v-btn
        v-if="showFilterButton && $vuetify.breakpoint.mdAndDown"
        icon
        @click="filterDrawer = !filterDrawer"
      >
        <v-icon>{{
          $route.path.startsWith("/settings") ? "mdi-account-details" : "mdi-filter"
        }}</v-icon>
      </v-btn>

      <v-btn
        @click="showSidenav = !showSidenav"
        icon
        v-if="showFilterButton && $vuetify.breakpoint.lgAndUp"
      >
        <v-icon>{{ showSidenav ? "mdi-pin" : "mdi-pin-off" }}</v-icon>
      </v-btn>

      <v-btn icon to="/settings">
        <v-icon>mdi-cog</v-icon>
      </v-btn>

      <template v-slot:extension v-if="showDetailsBar">
        <component :is="detailsBarComponent"></component>
      </template>
    </v-app-bar>

    <v-navigation-drawer style="z-index: 14" temporary app v-model="navDrawer">
      <v-list nav>
        <v-list-item :to="item.url" v-for="item in navItems" :key="item.icon">
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>{{ item.text }}</v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-content>
      <div style="min-height: 100vh">
        <router-view />
      </div>
      <Footer v-if="!$route.meta || !$route.meta.hideFooter" />
    </v-content>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { sceneModule } from "./store/scene";
import { actorModule } from "./store/actor";
import { movieModule } from "./store/movie";
import { studioModule } from "./store/studio";
import { contextModule } from "./store/context";
import moment from "moment";
import { ensureDarkColor } from "./util/color";
import Footer from "./components/Footer.vue";

@Component({
  components: {
    Footer,
  },
})
export default class App extends Vue {
  $refs!: {
    appBar: Vue & { isActive: boolean };
  };

  navDrawer = false;

  mounted() {
    const seed = localStorage.getItem("pm_seed");
    if (!seed) localStorage.setItem("pm_seed", Math.random().toString(36));
  }

  get appbarColor() {
    let color;
    if (this.currentActor && this.currentActor.hero) color = this.currentActor.hero.color;
    else if (this.currentActor && this.currentActor.thumbnail)
      color = this.currentActor.thumbnail.color;
    else if (this.currentScene && this.currentScene.thumbnail)
      color = this.currentScene.thumbnail.color;
    else if (this.currentMovie && this.currentMovie.frontCover)
      color = this.currentMovie.frontCover.color;
    else if (this.currentStudio && this.currentStudio.thumbnail)
      color = this.currentStudio.thumbnail.color;
    return color ? ensureDarkColor(color) : undefined;
  }

  get age() {
    if (this.currentActor && this.currentActor.bornOn) {
      return moment().diff(this.currentActor.bornOn, "years");
    }
    return -1;
  }

  get detailsBarComponent(): Vue | undefined {
    const routeMeta = this.$route.meta as { detailsBarComponent?: Vue } | undefined;
    return routeMeta?.detailsBarComponent;
  }

  get showDetailsBar(): boolean {
    return !!this.detailsBarComponent;
  }

  @Watch("showDetailsBar")
  onShowDetailsBarChange(show: boolean): void {
    if (!show) {
      // See https://github.com/vuetifyjs/vuetify/issues/12505
      this.$refs.appBar.isActive = true;
    }
  }

  get currentStudio() {
    return studioModule.current;
  }

  get currentActor() {
    return actorModule.current;
  }

  get currentMovie() {
    return movieModule.current;
  }

  get currentScene() {
    return sceneModule.current;
  }

  get showFilterButton() {
    return (
      this.$route.name == "scenes" ||
      this.$route.name == "actors" ||
      this.$route.name == "images" ||
      this.$route.name == "studios" ||
      this.$route.name == "movies" ||
      this.$route.name == "markers" ||
      this.$route.path.startsWith("/settings")
    );
  }

  get showSidenav() {
    return contextModule.showSidenav;
  }

  set showSidenav(val: boolean) {
    contextModule.toggleSidenav(val);
  }

  get filterDrawer() {
    return contextModule.showFilters;
  }

  set filterDrawer(val: boolean) {
    contextModule.toggleFilters(val);
  }

  beforeCreate() {
    // @ts-ignore
    if (this.$route.query.password) {
      // @ts-ignore
      localStorage.setItem("password", this.$route.query.password);
    }

    const darkModeLocalStorage = localStorage.getItem("pm_darkMode");
    if (darkModeLocalStorage) {
      // @ts-ignore
      this.$vuetify.theme.dark = darkModeLocalStorage == "true";
    } else {
      this.$vuetify.theme.dark = !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    }

    const fillActorCardsLocalStorage = localStorage.getItem("pm_fillActorCards");
    if (fillActorCardsLocalStorage) {
      // @ts-ignore
      contextModule.toggleActorCardStyle(fillActorCardsLocalStorage == "true");
    }

    const sceneRatioLocalStorage = localStorage.getItem("pm_sceneRatio");
    if (sceneRatioLocalStorage) {
      contextModule.setSceneAspectRatio(parseFloat(sceneRatioLocalStorage));
    }

    const actorRatioLocalStorage = localStorage.getItem("pm_actorRatio");
    if (actorRatioLocalStorage) {
      contextModule.setActorAspectRatio(parseFloat(actorRatioLocalStorage));
    }

    const scenePauseOnUnfocusLocalStorage = localStorage.getItem("pm_scenePauseOnUnfocus");
    if (scenePauseOnUnfocusLocalStorage) {
      contextModule.setScenePauseOnUnfocus(scenePauseOnUnfocusLocalStorage == "true");
    }

    const scenePreviewOnMouseHoverLocalStorage = localStorage.getItem(
      "pm_scenePreviewOnMouseHover"
    );
    if (scenePreviewOnMouseHoverLocalStorage) {
      contextModule.setScenePreviewOnMouseHover(scenePreviewOnMouseHoverLocalStorage == "true");
    }

    const sceneSeekBackwardLocalStorage = localStorage.getItem("pm_sceneSeekBackward");
    if (sceneSeekBackwardLocalStorage) {
      contextModule.setSceneSeekBackward(parseInt(sceneSeekBackwardLocalStorage || "5") ?? 5);
    }

    const sceneSeekForwardLocalStorage = localStorage.getItem("pm_sceneSeekForward");
    if (sceneSeekForwardLocalStorage) {
      contextModule.setSceneSeekForward(parseInt(sceneSeekForwardLocalStorage || "5") ?? 5);
    }

    const showCardLabelsLocalStorage = localStorage.getItem("pm_showCardLabels");
    if (showCardLabelsLocalStorage) {
      contextModule.toggleCardLabels(showCardLabelsLocalStorage == "true");
    }

    const showSidenavFromLocalStorage = localStorage.getItem("pm_showSidenav");
    if (showSidenavFromLocalStorage) {
      contextModule.toggleSidenav(showSidenavFromLocalStorage == "true");
    }

    const experimentalFromLocalStorage = localStorage.getItem("pm_experimental");
    if (experimentalFromLocalStorage) {
      contextModule.toggleExperimental(true);
    }

    const defaultDVDShow3dFromLocalStorage = localStorage.getItem("pm_defaultDVDShow3d");
    if (defaultDVDShow3dFromLocalStorage) {
      contextModule.toggleDefaultDVDShow3d(defaultDVDShow3dFromLocalStorage === "true");
    }
  }

  @Watch("showSidenav")
  onSideNavChange(value: boolean) {
    localStorage.setItem("pm_showSidenav", value.toString());
  }

  get navItems() {
    const btns = [
      {
        icon: "mdi-home",
        text: "Home",
        url: "/",
        mobile: true,
      },
      {
        icon: "mdi-video-box",
        text: "Scenes",
        url: "/scenes",
      },
      {
        icon: "mdi-account-multiple",
        text: "Actors",
        url: "/actors",
      },
      {
        icon: "mdi-filmstrip-box-multiple",
        text: "Movies",
        url: "/movies",
      },
      {
        icon: "mdi-label",
        text: "Labels",
        url: "/labels",
      },
      {
        icon: "mdi-camera",
        text: "Studios",
        url: "/studios",
      },
      {
        icon: "mdi-image",
        text: "Images",
        url: "/images",
      },
      {
        icon: "mdi-animation-play",
        text: "Markers",
        url: "/markers",
      },
    ];

    return btns;
  }
}
</script>

<style lang="scss">
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.hover {
  transition: filter 0.1s ease-in-out;
  &:hover {
    cursor: pointer;
    filter: brightness(0.75);
  }
}

.med--text {
  opacity: 0.6;
}
</style>
