<template>
  <div>
    <div v-if="currentStudio">
      <div class="text-center" v-if="!currentStudio.thumbnail">
        <v-btn @click="openThumbnailDialog">Upload logo</v-btn>
      </div>
      <div class="d-flex" v-else>
        <v-spacer></v-spacer>
        <v-img eager :src="thumbnail"></v-img>
          <v-spacer></v-spacer>
      </div>
      {{ currentStudio }}
    </div>

    <v-dialog v-model="thumbnailDialog" max-width="400px">
      <v-card v-if="currentStudio" :loading="thumbnailLoader">
        <v-card-title>Set front cover for '{{ currentStudio.name }}'</v-card-title>
        <v-card-text>
          <v-file-input color="accent" placeholder="Select an image" v-model="selectedThumbnail"></v-file-input>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="uploadThumbnail" text class="text-none" color="accent">Upload</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import ApolloClient, { serverBase } from "../apollo";
import gql from "graphql-tag";
import sceneFragment from "../fragments/scene";
import { studioModule } from "../store/studio";
import actorFragment from "../fragments/actor";
import imageFragment from "../fragments/image";
import ActorCard from "../components/ActorCard.vue";
import moment from "moment";
import Lightbox from "../components/Lightbox.vue";
import SceneCard from "../components/SceneCard.vue";
import ImageCard from "../components/ImageCard.vue";
import InfiniteLoading from "vue-infinite-loading";
import { Cropper } from "vue-advanced-cropper";
import ImageUploader from "../components/ImageUploader.vue";
import { actorModule } from "../store/actor";
import IActor from "../types/actor";
import IImage from "../types/image";
import ILabel from "../types/label";
import studioFragment from "../fragments/studio";

@Component({
  components: {
    ActorCard,
    Lightbox,
    SceneCard,
    ImageCard,
    InfiniteLoading,
    Cropper,
    ImageUploader
  },
  beforeRouteLeave(_to, _from, next) {
    studioModule.setCurrent(null);
    next();
  }
})
export default class SceneDetails extends Vue {
  actors = [] as IActor[];
  images = [] as IImage[];
  lightboxIndex = null as number | null;

  infiniteId = 0;
  page = 0;

  thumbnailDialog = false;
  thumbnailLoader = false;
  selectedThumbnail = null as File | null;

  uploadThumbnail() {
    if (!this.currentStudio) return;

    this.thumbnailLoader = true;

    ApolloClient.mutate({
      mutation: gql`
        mutation($file: Upload!, $name: String, $studio: String, $lossless: Boolean) {
          uploadImage(file: $file, name: $name, studio: $studio, lossless: $lossless) {
            ...ImageFragment
          }
        }
        ${imageFragment}
      `,
      variables: {
        file: this.selectedThumbnail,
        name: this.currentStudio.name + " (thumbnail)",
        studio: this.currentStudio._id,
        lossless: true
      }
    })
      .then(res => {
        const image = res.data.uploadImage;
        this.images.unshift(image);
        this.setAsThumbnail(image._id);
        this.thumbnailDialog = false;
        this.selectedThumbnail = null;
      })
      .finally(() => {
        this.thumbnailLoader = false;
      });
  }

  openThumbnailDialog() {
    this.thumbnailDialog = true;
  }

  removeImage(index: number) {
    ApolloClient.mutate({
      mutation: gql`
        mutation($ids: [String!]!) {
          removeImages(ids: $ids)
        }
      `,
      variables: {
        ids: [this.images[index]._id]
      }
    })
      .then(res => {
        this.images.splice(index, 1);
        this.lightboxIndex = null;
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {});
  }

  updateImage({
    index,
    key,
    value
  }: {
    index: number;
    key: string;
    value: any;
  }) {
    const images = this.images[index];
    images[key] = value;
    Vue.set(this.images, index, images);
  }

  get currentStudio() {
    return studioModule.current;
  }

  async fetchPage() {
    if (!this.currentStudio) return;

    try {
      const query = `page:${this.page} sortDir:asc sortBy:addedOn studio:${this.currentStudio._id}`;

      const result = await ApolloClient.query({
        query: gql`
          query($query: String) {
            getImages(query: $query) {
              ...ImageFragment
              actors {
                ...ActorFragment
              }
              scene {
                _id
                name
              }
            }
          }
          ${imageFragment}
          ${actorFragment}
        `,
        variables: {
          query
        }
      });

      return result.data.getImages;
    } catch (err) {
      throw err;
    }
  }

  infiniteHandler($state) {
    this.fetchPage().then(items => {
      if (items.length) {
        this.page++;
        this.images.push(...items);
        $state.loaded();
      } else {
        $state.complete();
      }
    });
  }

  setAsThumbnail(id: string) {
    if (!this.currentStudio) return;

    ApolloClient.mutate({
      mutation: gql`
        mutation($ids: [String!]!, $opts: StudioUpdateOpts!) {
          updateStudios(ids: $ids, opts: $opts) {
            thumbnail {
              _id
            }
          }
        }
      `,
      variables: {
        ids: [this.currentStudio._id],
        opts: {
          thumbnail: id
        }
      }
    })
      .then(res => {
        studioModule.setThumbnail(id);
      })
      .catch(err => {
        console.error(err);
      });
  }

  imageLink(image: any) {
    return `${serverBase}/image/${image._id}?password=${localStorage.getItem(
      "password"
    )}`;
  }

  rateActor(id: any, rating: number) {
    const index = this.actors.findIndex(sc => sc._id == id);

    if (index > -1) {
      const actor = this.actors[index];
      actor.rating = rating;
      Vue.set(this.actors, index, actor);
    }
  }

  favoriteActor(id: any, favorite: boolean) {
    const index = this.actors.findIndex(sc => sc._id == id);

    if (index > -1) {
      const actor = this.actors[index];
      actor.favorite = favorite;
      Vue.set(this.actors, index, actor);
    }
  }

  bookmarkActor(id: any, bookmark: boolean) {
    const index = this.actors.findIndex(sc => sc._id == id);

    if (index > -1) {
      const actor = this.actors[index];
      actor.bookmark = bookmark;
      Vue.set(this.actors, index, actor);
    }
  }

  get labelNames() {
    if (!this.currentStudio) return "";
    return this.currentStudio.labels.map(l => l.name).sort();
  }

  get thumbnail() {
    if (this.currentStudio && this.currentStudio.thumbnail)
      return `${serverBase}/image/${
        this.currentStudio.thumbnail._id
      }?password=${localStorage.getItem("password")}`;
    return "";
  }

  beforeCreate() {
    ApolloClient.query({
      query: gql`
        query($id: String!) {
          getStudioById(id: $id) {
            ...StudioFragment
          }
        }
        ${studioFragment}
      `,
      variables: {
        id: (<any>this).$route.params.id
      }
    }).then(res => {
      studioModule.setCurrent(res.data.getStudioById);
      // this.actors = res.data.getSceneById.actors;
    });
  }
}
</script>

<style lang="scss" scoped>
.corner-actions {
  position: absolute;
  top: 5px;
  right: 5px;
}
</style>