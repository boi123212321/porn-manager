import ActorDetailsBar from "@/components/AppBar/ActorDetails.vue";
import MovieDetailsBar from "@/components/AppBar/MovieDetails.vue";
import SceneDetailsBar from "@/components/AppBar/SceneDetails.vue";
import StudioDetailsBar from "@/components/AppBar/StudioDetails.vue";
import ActorDetails from "@/views/ActorDetails.vue";
import Actors from "@/views/Actors.vue";
import Home from "@/views/Home.vue";
import Images from "@/views/Images.vue";
import Labels from "@/views/Labels.vue";
import Markers from "@/views/Markers.vue";
import MovieDetails from "@/views/MovieDetails.vue";
import MovieDVD from "@/views/MovieDVD.vue";
import Movies from "@/views/Movies.vue";
import Plugins from "@/views/Plugins.vue";
import SceneDetails from "@/views/SceneDetails.vue";
import Scenes from "@/views/Scenes.vue";
import MetadataSettings from "@/views/Settings/Metadata.vue";
import Settings from "@/views/Settings/Settings.vue";
import UISettings from "@/views/Settings/UI.vue";
import StudioDetails from "@/views/StudioDetails.vue";
import Studios from "@/views/Studios.vue";
import Views from "@/views/Views.vue";
import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

export const routes = [
  {
    path: "/",
    name: "home",
    component: Home,
  },
  {
    path: "/history",
    name: "view-history",
    component: Views,
  },
  {
    path: "/views",
    redirect: "/history",
  },
  /*  {
    path: "/logs",
    name: "logs",
    component: Logs,
  }, */
  {
    path: "/plugins",
    name: "plugins",
    component: Plugins,
  },
  {
    path: "/about",
    name: "about",
    component: Settings,
  },
  {
    path: "/settings",
    name: "settings",
    component: Settings,
    meta: {
      title: "Settings",
    },
  },
  {
    path: "/settings/ui",
    name: "settings-ui",
    component: UISettings,
    meta: {
      title: "UI",
      description: "Display and appearance options",
    },
  },
  {
    path: "/settings/metadata",
    name: "settings-metadata",
    component: MetadataSettings,
    meta: {
      title: "Metadata",
      description: "Manage custom fields",
    },
  },
  {
    path: "/scenes",
    name: "scenes",
    component: Scenes,
  },
  {
    path: "/actors",
    name: "actors",
    component: Actors,
  },
  {
    path: "/movies",
    name: "movies",
    component: Movies,
  },
  {
    path: "/studios",
    name: "studios",
    component: Studios,
  },
  {
    path: "/scene/:id",
    name: "scene-details",
    component: SceneDetails,
    meta: {
      detailsBarComponent: SceneDetailsBar,
    },
  },
  {
    path: "/actor/:id",
    name: "actor-details",
    component: ActorDetails,
    meta: {
      detailsBarComponent: ActorDetailsBar,
    },
  },
  {
    path: "/movie/:id",
    name: "movie-details",
    component: MovieDetails,
    meta: {
      detailsBarComponent: MovieDetailsBar,
    },
  },
  {
    path: "/movie/:id/dvd",
    name: "movie-dvd",
    component: MovieDVD,
    meta: {
      hideAppBar: true,
      hideFooter: true,
    },
  },
  {
    path: "/studio/:id",
    name: "studio-details",
    component: StudioDetails,
    meta: {
      detailsBarComponent: StudioDetailsBar,
    },
  },
  {
    path: "/labels",
    name: "labels",
    component: Labels,
  },
  {
    path: "/markers",
    name: "markers",
    component: Markers,
  },
  {
    path: "/images",
    name: "images",
    component: Images,
  },
  {
    path: "*",
    redirect: "/",
  },
];

const router = new VueRouter({
  routes,
});

export default router;
