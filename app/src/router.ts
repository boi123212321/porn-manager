import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Videos from './views/Videos.vue'
import ActorDetails from './views/ActorDetails.vue'
import VideoDetails from './views/VideoDetails.vue'
import Actors from './views/Actors.vue'
import Settings from './views/Settings.vue'
import Images from "./views/Images.vue";

Vue.use(Router)

export default new Router({
  scrollBehavior() {
    return { x: 0, y: 0 };
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/videos',
      name: 'videos',
      component: Videos
    },
    {
      path: '/video/:id',
      name: 'video',
      component: VideoDetails
    },
    {
      path: '/actor/:id',
      name: 'actor',
      component: ActorDetails
    },
    {
      path: '/actors',
      name: 'actors',
      component: Actors
    },
    {
      path: '/images',
      name: 'images',
      component: Images
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings
    }
  ]
})
