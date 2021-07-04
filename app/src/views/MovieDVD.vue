<template>
  <div style="height: 100%; width: 100%">
    <BindFavicon :value="frontCover" />
    <BindTitle v-if="movie" :value="`${movie.name} in 3D!`" />

    <v-progress-circular
      class="loader"
      v-if="loading"
      color="primary"
      :width="4"
      :size="35"
      indeterminate
    ></v-progress-circular>
    <DVDRenderer
      style="height: 100%; width: 100%; min-height: 100vh"
      v-else-if="movie"
      :movieName="movie.name"
      :studioName="movie.studio ? movie.studio.name : ''"
      :frontCover="frontCover"
      :backCover="backCover"
      :spineCover="spineCover"
      :light="light"
      :showDetails="true"
      :showAutoRotate="true"
      :showControls="false"
    />
    <div class="d-flex flex-column text-center mt-0 movie-error" v-else>
      <p class="error-title mt-5 mb-0">404</p>
      <p class="error-subtext mt-1">
        Movie <b>{{ $route.params.id }}</b> not found
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import IMovie from "../types/movie";
import movieFragment from "@/fragments/movie";
import studioFragment from "@/fragments/studio";
import ApolloClient from "@/apollo";
import DVDRenderer from "@/components/DVDRenderer.vue";
import gql from "graphql-tag";

@Component({
  components: {
    DVDRenderer,
  },
})
export default class MovieDVD extends Vue {
  movie: IMovie | null = null;
  loading = true;
  error = false;

  get frontCover() {
    if (!this.movie) {
      return "";
    }

    if (this.movie.frontCover) {
      return `/api/media/image/${this.movie.frontCover._id}?password=${localStorage.getItem(
        "password"
      )}`;
    }
    return "";
  }

  get backCover() {
    if (!this.movie) {
      return "";
    }

    if (this.movie.backCover) {
      return `/api/media/image/${this.movie.backCover._id}?password=${localStorage.getItem(
        "password"
      )}`;
    }
    return this.frontCover;
  }

  get spineCover() {
    if (!this.movie) {
      return "";
    }

    if (this.movie.spineCover) {
      return `/api/media/image/${this.movie.spineCover._id}?password=${localStorage.getItem(
        "password"
      )}`;
    }
    return null;
  }

  get light() {
    return this.$route.query.light === null || this.$route.query.light === "true";
  }

  async onLoad() {
    const res = await ApolloClient.query({
      query: gql`
        query($id: String!) {
          getMovieById(id: $id) {
            ...MovieFragment
            studio {
              ...StudioFragment
            }
          }
        }
        ${movieFragment}
        ${studioFragment}
      `,
      variables: {
        id: (<any>this).$route.params.id,
      },
    });

    const movie = res.data.getMovieById;
    if (movie) {
      this.movie = movie;
    } else {
      this.error = true;
    }

    this.loading = false;
  }

  beforeMount() {
    this.onLoad();
  }
}
</script>

<style lang="scss" scoped>
.loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.movie-error {
  margin-top: 5vh;

  .error-title {
    font-size: 36px;
    font-weight: bold;
  }
}
</style>
