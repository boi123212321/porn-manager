<template>
  <v-container fluid>
    <BindFavicon />
    <BindTitle value="Images" />
    <v-banner app sticky class="mb-2">
      <div class="d-flex align-center">
        <v-btn
          v-if="!selectedImages.length"
          icon
          @click="selectedImages = images.map((im) => im._id)"
        >
          <v-icon>mdi-checkbox-blank-circle-outline</v-icon>
        </v-btn>

        <v-btn v-else icon @click="selectedImages = []">
          <v-icon>mdi-checkbox-marked-circle</v-icon>
        </v-btn>

        <div class="title ml-2">
          {{ selectedImages.length }}
        </div>
      </div>

      <template v-slot:actions>
        <v-btn @click="addLabelsDialog = true" icon v-if="selectedImages.length">
          <v-icon>mdi-label</v-icon>
        </v-btn>

        <v-btn @click="subtractLabelsDialog = true" icon v-if="selectedImages.length">
          <v-icon>mdi-label-off</v-icon>
        </v-btn>

        <v-btn
          v-if="selectedImages.length"
          @click="deleteSelectedImagesDialog = true"
          icon
          color="error"
          ><v-icon>mdi-delete-forever</v-icon>
        </v-btn>
      </template>
    </v-banner>

    <v-navigation-drawer v-if="showSidenav" style="z-index: 14" v-model="drawer" clipped app>
      <v-container>
        <v-btn
          :disabled="searchStateManager.refreshed"
          class="text-none mb-2"
          block
          color="primary"
          text
          @click="resetPagination"
          >Refresh</v-btn
        >

        <v-text-field
          @keydown.enter="resetPagination"
          solo
          flat
          single-line
          hide-details
          clearable
          color="primary"
          :value="searchState.query"
          @input="searchStateManager.onValueChanged('query', $event)"
          label="Search query"
          class="mb-2"
        ></v-text-field>

        <div class="d-flex align-center">
          <v-btn
            :color="searchState.favoritesOnly ? 'red' : undefined"
            icon
            @click="searchStateManager.onValueChanged('favoritesOnly', !searchState.favoritesOnly)"
          >
            <v-icon>{{ searchState.favoritesOnly ? "mdi-heart" : "mdi-heart-outline" }}</v-icon>
          </v-btn>

          <v-btn
            :color="searchState.bookmarksOnly ? 'primary' : undefined"
            icon
            @click="searchStateManager.onValueChanged('bookmarksOnly', !searchState.bookmarksOnly)"
          >
            <v-icon>{{
              searchState.bookmarksOnly ? "mdi-bookmark" : "mdi-bookmark-outline"
            }}</v-icon>
          </v-btn>

          <v-spacer></v-spacer>

          <Rating
            @input="searchStateManager.onValueChanged('ratingFilter', $event)"
            :value="searchState.ratingFilter"
          />
        </div>

        <Divider icon="mdi-label">Labels</Divider>

        <LabelFilter
          @input="searchStateManager.onValueChanged('selectedLabels', $event)"
          class="mt-0"
          :value="searchState.selectedLabels"
          :items="allLabels"
        />

        <Divider icon="mdi-account">Actors</Divider>

        <ActorSelector
          :value="searchState.selectedActors"
          @input="searchStateManager.onValueChanged('selectedActors', $event)"
          :multiple="true"
        />

        <Divider icon="mdi-sort">Sort</Divider>

        <v-select
          solo
          flat
          single-line
          hide-details
          color="primary"
          item-text="text"
          item-value="value"
          :value="searchState.sortBy"
          @change="searchStateManager.onValueChanged('sortBy', $event)"
          placeholder="Sort by..."
          :items="sortByItems"
          class="mt-0 pt-0 mb-2"
        ></v-select>
        <v-select
          solo
          flat
          single-line
          :disabled="searchState.sortBy == 'relevance' || searchState.sortBy == '$shuffle'"
          hide-details
          color="primary"
          item-text="text"
          item-value="value"
          :value="searchState.sortDir"
          @change="searchStateManager.onValueChanged('sortDir', $event)"
          placeholder="Sort direction"
          :items="sortDirItems"
        ></v-select>
      </v-container>
    </v-navigation-drawer>

    <div class="text-center" v-if="fetchError">
      <div>There was an error</div>
      <v-btn class="mt-2" @click="loadPage">Try again</v-btn>
    </div>
    <div v-else>
      <div class="mb-2 d-flex align-center">
        <div class="mr-3">
          <span class="display-1 font-weight-bold mr-2">{{ fetchLoader ? "-" : numResults }}</span>
          <span class="title font-weight-regular">images found</span>
        </div>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" @click="openUploadDialog" icon>
              <v-icon>mdi-upload</v-icon>
            </v-btn>
          </template>
          <span>Upload image</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" :disabled="searchState.sortBy != '$shuffle'" @click="rerollSeed" icon>
              <v-icon>mdi-dice-3-outline</v-icon>
            </v-btn>
          </template>
          <span>Reshuffle</span>
        </v-tooltip>
        <v-spacer></v-spacer>
        <div>
          <v-pagination
            v-if="!fetchLoader && $vuetify.breakpoint.mdAndUp"
            :value="searchState.page"
            @input="onPageChange"
            :total-visible="9"
            :disabled="fetchLoader"
            :length="numPages"
          ></v-pagination>
        </div>
      </div>
      <v-row v-if="!fetchLoader && numResults">
        <v-col
          class="pa-0"
          v-for="(image, index) in images"
          :key="image._id"
          :cols="6"
          :sm="4"
          :md="3"
          :lg="2"
          :xl="2"
        >
          <ImageCard
            :class="
              selectedImages.length && !selectedImages.includes(image._id) ? 'not-selected' : ''
            "
            width="100%"
            height="100%"
            @click="onImageClick(image, index, $event, false)"
            :image="image"
            :contain="true"
          >
            <template v-slot:action>
              <v-checkbox
                color="primary"
                :input-value="selectedImages.includes(image._id)"
                readonly
                @click.native.stop="onImageClick(image, index, $event, true)"
                class="mt-0"
                hide-details
                :contain="true"
              ></v-checkbox>
            </template>
          </ImageCard>
        </v-col>
      </v-row>
      <NoResults v-else-if="!fetchLoader && !numResults" />
      <Loading v-else />
    </div>
    <div class="mt-3" v-if="numResults && numPages > 1">
      <v-pagination
        :value="searchState.page"
        @input="onPageChange"
        :total-visible="9"
        :disabled="fetchLoader"
        :length="numPages"
      ></v-pagination>
      <div class="text-center mt-3">
        <v-text-field
          @keydown.enter="onPageChange(jumpPage)"
          :disabled="fetchLoader"
          solo
          flat
          color="primary"
          v-model.number="jumpPage"
          placeholder="Page #"
          class="d-inline-block mr-2"
          style="width: 60px"
          hide-details
        >
        </v-text-field>
        <v-btn
          :disabled="fetchLoader"
          color="primary"
          class="text-none"
          text
          @click="onPageChange(jumpPage)"
          >Load</v-btn
        >
      </div>
    </div>

    <v-dialog :persistent="isUploading" scrollable v-model="uploadDialog" max-width="400px">
      <ImageUploader @update-state="isUploading = $event" @uploaded="addNewItem" />
    </v-dialog>

    <v-dialog v-model="deleteSelectedImagesDialog" max-width="400px">
      <v-card>
        <v-card-title>Really delete {{ selectedImages.length }} images?</v-card-title>
        <v-card-text></v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn class="text-none" color="error" text @click="deleteSelection">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog :persistent="addLoader" scrollable v-model="addLabelsDialog" max-width="400px">
      <v-card :loading="addLoader">
        <v-card-title
          >Add {{ addLabelsIndices.length }}
          {{ addLabelsIndices.length === 1 ? "label" : "labels" }}</v-card-title
        >

        <v-text-field
          clearable
          color="primary"
          hide-details
          class="px-5 mb-2"
          label="Find labels..."
          v-model="addLabelsSearchQuery"
        />

        <v-card-text style="max-height: 400px">
          <LabelSelector
            :searchQuery="addLabelsSearchQuery"
            :items="allLabels"
            v-model="addLabelsIndices"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn @click="addLabelsIndices = []" text class="text-none">Clear</v-btn>
          <v-spacer></v-spacer>
          <v-btn :loading="addLoader" class="text-none" color="primary" text @click="addLabels"
            >Commit</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      :persistent="subtractLoader"
      scrollable
      v-model="subtractLabelsDialog"
      max-width="400px"
    >
      <v-card :loading="subtractLoader">
        <v-card-title
          >Subtract {{ subtractLabelsIndices.length }}
          {{ subtractLabelsIndices.length === 1 ? "label" : "labels" }}</v-card-title
        >

        <v-text-field
          clearable
          color="primary"
          hide-details
          class="px-5 mb-2"
          label="Find labels..."
          v-model="subtractLabelsSearchQuery"
        />

        <v-card-text style="max-height: 400px">
          <LabelSelector
            :searchQuery="subtractLabelsSearchQuery"
            :items="allLabels"
            v-model="subtractLabelsIndices"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn @click="subtractLabelsIndices = []" text class="text-none">Clear</v-btn>
          <v-spacer></v-spacer>
          <v-btn
            :loading="subtractLoader"
            class="text-none"
            color="primary"
            text
            @click="subtractLabels"
            >Commit</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <transition name="fade">
      <Lightbox
        @update="updateImage"
        @delete="removeImage"
        :items="images"
        :index="lightboxIndex"
        @index="lightboxIndex = $event"
      />
    </transition>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import ApolloClient from "@/apollo";
import gql from "graphql-tag";
import LabelSelector from "@/components/LabelSelector.vue";
import { contextModule } from "@/store/context";
import ImageCard from "@/components/Cards/Image.vue";
import Lightbox from "@/components/Lightbox.vue";
import actorFragment from "@/fragments/actor";
import imageFragment from "@/fragments/image";
import ImageUploader from "@/components/ImageUploader.vue";
import IImage from "@/types/image";
import ILabel from "@/types/label";
import DrawerMixin from "@/mixins/drawer";
import { mixins } from "vue-class-component";
import IActor from "@/types/actor";
import ActorSelector from "@/components/ActorSelector.vue";
import { isQueryDifferent, SearchStateManager } from "../util/searchState";
import { Route } from "vue-router";
import { Dictionary } from "vue-router/types/router";

@Component({
  components: {
    LabelSelector,
    ImageCard,
    Lightbox,
    ImageUploader,
    ActorSelector,
  },
})
export default class ImageList extends mixins(DrawerMixin) {
  addNewItem(image: IImage) {
    this.images.unshift(image);
  }

  get showSidenav() {
    return contextModule.showSidenav;
  }

  rerollSeed() {
    const seed = Math.random().toString(36);
    localStorage.setItem("pm_seed", seed);
    if (this.searchState.sortBy === "$shuffle") this.loadPage();
    return seed;
  }

  images = [] as IImage[];

  fetchLoader = false;
  fetchError = false;
  fetchingRandom = false;
  numResults = 0;
  numPages = 0;

  searchStateManager = new SearchStateManager<{
    page: number;
    query: string;
    favoritesOnly: boolean;
    bookmarksOnly: boolean;
    ratingFilter: number;
    selectedLabels: { include: string[]; exclude: string[] };
    selectedActors: IActor[];
    sortBy: string;
    sortDir: string;
  }>({
    localStorageNamer: (key: string) => `pm_image${key[0].toUpperCase()}${key.substr(1)}`,
    props: {
      page: {
        default: () => 1,
      },
      query: true,
      favoritesOnly: { default: () => false },
      bookmarksOnly: { default: () => false },
      ratingFilter: { default: () => 0 },
      selectedActors: {
        default: () => [],
        serialize: (actors: IActor[]) =>
          JSON.stringify(
            actors.map((a) => ({
              _id: a._id,
              name: a.name,
              avatar: a.avatar,
              thumbnail: a.thumbnail,
            }))
          ),
      },
      selectedLabels: { default: () => ({ include: [], exclude: [] }) },
      sortBy: { default: () => "relevance" },
      sortDir: {
        default: () => "desc",
      },
    },
  });

  jumpPage: string | null = null;

  get searchState() {
    return this.searchStateManager.state;
  }

  lightboxIndex = null as number | null;

  tryReadLabelsFromLocalStorage(key: string) {
    return (localStorage.getItem(key) || "").split(",").filter(Boolean) as string[];
  }

  allLabels = [] as ILabel[];

  get selectedActorIds() {
    return this.searchState.selectedActors.map((ac) => ac._id);
  }

  @Watch("$route")
  onRouteChange(to: Route, from: Route) {
    if (isQueryDifferent(to.query as Dictionary<string>, from.query as Dictionary<string>)) {
      // Only update the state and reload, if the query changed => filters changed
      this.searchStateManager.parseFromQuery(to.query as Dictionary<string>);
      this.loadPage();
      return;
    }
  }

  onPageChange(val: number) {
    let page = Number(val);
    if (isNaN(page) || page <= 0 || page > this.numPages) {
      page = 1;
    }
    this.jumpPage = null;
    this.searchStateManager.onValueChanged("page", page);
    this.updateRoute(this.searchStateManager.toQuery(), false, () => {
      // If the query wasn't different, just reset the flag
      this.searchStateManager.refreshed = true;
    });
  }

  updateRoute(query: { [x: string]: string }, replace = false, noChangeCb: Function | null = null) {
    if (isQueryDifferent(query, this.$route.query as Dictionary<string>)) {
      // Only change the current url if the new url will be different to avoid redundant navigation
      const update = {
        name: "images",
        query, // Always override the current query
      };
      if (replace) {
        this.$router.replace(update);
      } else {
        this.$router.push(update);
      }
    } else {
      noChangeCb?.();
    }
  }
  sortDirItems = [
    {
      text: "Ascending",
      value: "asc",
    },
    {
      text: "Descending",
      value: "desc",
    },
  ];

  sortByItems = [
    {
      text: "Relevance",
      value: "relevance",
    },
    {
      text: "Added to collection",
      value: "addedOn",
    },
    {
      text: "Rating",
      value: "rating",
    },
    {
      text: "Bookmarked",
      value: "bookmark",
    },
    {
      text: "Random",
      value: "$shuffle",
    },
  ];

  uploadDialog = false;
  isUploading = false;

  selectedImages = [] as string[];
  lastSelectionImageId: string | null = null;
  deleteSelectedImagesDialog = false;

  addLabelsDialog = false;
  addLabelsIndices: number[] = [];
  addLabelsSearchQuery = "";
  addLoader = false;

  subtractLabelsDialog = false;
  subtractLabelsIndices: number[] = [];
  subtractLabelsSearchQuery = "";
  subtractLoader = false;

  get labelsToAdd(): ILabel[] {
    return this.addLabelsIndices.map((i) => this.allLabels[i]).filter(Boolean);
  }

  get labelsToSubtract(): ILabel[] {
    return this.subtractLabelsIndices.map((i) => this.allLabels[i]).filter(Boolean);
  }

  async addLabelsToImage(imageId: string, labelIds: string[]): Promise<void> {
    await ApolloClient.mutate({
      mutation: gql`
        mutation($item: String!, $labels: [String!]!) {
          attachLabels(item: $item, labels: $labels)
        }
      `,
      variables: {
        item: imageId,
        labels: labelIds,
      },
    });
  }

  async removeLabelFromImage(imageId: string, labelId: string): Promise<void> {
    await ApolloClient.mutate({
      mutation: gql`
        mutation($item: String!, $label: String!) {
          removeLabel(item: $item, label: $label)
        }
      `,
      variables: {
        item: imageId,
        label: labelId,
      },
    });
  }

  async subtractLabels(): Promise<void> {
    try {
      const labelIdsToSubtract = this.labelsToSubtract.map((l) => l._id);
      this.subtractLoader = true;

      for (let i = 0; i < this.selectedImages.length; i++) {
        const id = this.selectedImages[i];

        const image = this.images.find((img) => img._id === id);

        if (image) {
          for (const labelId of labelIdsToSubtract) {
            await this.removeLabelFromImage(id, labelId);
          }
        }
      }

      // Refresh page
      await this.loadPage();
      this.subtractLabelsDialog = false;
    } catch (error) {
      console.error(error);
    }
    this.subtractLoader = false;
  }

  async addLabels(): Promise<void> {
    try {
      const labelIdsToAdd = this.labelsToAdd.map((l) => l._id);
      this.addLoader = true;

      for (let i = 0; i < this.selectedImages.length; i++) {
        const id = this.selectedImages[i];

        const image = this.images.find((img) => img._id === id);

        if (image) {
          await this.addLabelsToImage(id, labelIdsToAdd);
        }
      }

      // Refresh page
      await this.loadPage();
      this.addLabelsDialog = false;
    } catch (error) {
      console.error(error);
    }
    this.addLoader = false;
  }

  isImageSelected(id: string) {
    return !!this.selectedImages.find((selectedId) => id === selectedId);
  }

  selectImage(id: string, add: boolean) {
    this.lastSelectionImageId = id;
    if (add && !this.isImageSelected(id)) {
      this.selectedImages.push(id);
    } else {
      this.selectedImages = this.selectedImages.filter((i) => i != id);
    }
  }

  /**
   * @param image - the clicked image
   * @param index - the index of the image in the array
   * @param event - the mouse click event
   * @param forceSelectionChange - whether to force a selection change, instead of opening the image
   */
  onImageClick(image: IImage, index: number, event: MouseEvent, forceSelectionChange = true) {
    // Use the last selected image or the current one, to allow toggling
    // even when no previous selection
    let lastSelectionImageIndex =
      this.lastSelectionImageId !== null
        ? this.images.findIndex((im) => im._id === this.lastSelectionImageId)
        : index;
    lastSelectionImageIndex = lastSelectionImageIndex === -1 ? index : lastSelectionImageIndex;

    if (event.shiftKey) {
      // Next state is opposite of the clicked image state
      const nextSelectionState = !this.isImageSelected(image._id);

      // Use >= to include the currently clicked image, so it can be toggled
      // if necessary
      if (index >= lastSelectionImageIndex) {
        for (let i = lastSelectionImageIndex + 1; i <= index; i++) {
          this.selectImage(this.images[i]._id, nextSelectionState);
        }
      } else if (index < lastSelectionImageIndex) {
        for (let i = lastSelectionImageIndex; i >= index; i--) {
          this.selectImage(this.images[i]._id, nextSelectionState);
        }
      }
    } else if (forceSelectionChange || event.ctrlKey) {
      this.selectImage(image._id, !this.isImageSelected(image._id));
    } else if (!forceSelectionChange) {
      this.lightboxIndex = index;
    }
  }

  deleteSelection() {
    ApolloClient.mutate({
      mutation: gql`
        mutation($ids: [String!]!) {
          removeImages(ids: $ids)
        }
      `,
      variables: {
        ids: this.selectedImages,
      },
    })
      .then((res) => {
        for (const id of this.selectedImages) {
          this.images = this.images.filter((img) => img._id != id);
        }
        this.selectedImages = [];
        this.deleteSelectedImagesDialog = false;
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {});
  }

  removeImage(index: number) {
    ApolloClient.mutate({
      mutation: gql`
        mutation($ids: [String!]!) {
          removeImages(ids: $ids)
        }
      `,
      variables: {
        ids: [this.images[index]._id],
      },
    })
      .then((res) => {
        this.images.splice(index, 1);
        this.lightboxIndex = null;
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {});
  }

  updateImage({ index, key, value }: { index: number; key: string; value: any }) {
    const images = this.images[index];
    images[key] = value;
    Vue.set(this.images, index, images);
  }

  openUploadDialog() {
    this.uploadDialog = true;
  }

  resetPagination() {
    this.searchStateManager.onValueChanged("page", 1);
    this.updateRoute(this.searchStateManager.toQuery(), false, () => {
      // If the query wasn't different, just reset the flag
      this.searchStateManager.refreshed = true;
    });
  }

  async fetchPage(page: number, take = 24, random?: boolean, seed?: string) {
    const result = await ApolloClient.query({
      query: gql`
        query($query: ImageSearchQuery!, $seed: String) {
          getImages(query: $query, seed: $seed) {
            numItems
            numPages
            items {
              ...ImageFragment
              labels {
                _id
                name
                color
                aliases
              }
              studio {
                _id
                name
              }
              actors {
                ...ActorFragment
                avatar {
                  _id
                  color
                }
              }
              scene {
                _id
                name
                thumbnail {
                  _id
                }
              }
            }
          }
        }
        ${imageFragment}
        ${actorFragment}
      `,
      variables: {
        query: {
          include: this.searchState.selectedLabels.include,
          exclude: this.searchState.selectedLabels.exclude,
          query: this.searchState.query || "",
          take,
          page: page - 1,
          sortDir: this.searchState.sortDir,
          sortBy: random ? "$shuffle" : this.searchState.sortBy,
          favorite: this.searchState.favoritesOnly,
          bookmark: this.searchState.bookmarksOnly,
          rating: this.searchState.ratingFilter,
          actors: this.selectedActorIds,
        },
        seed: seed || localStorage.getItem("pm_seed") || "default",
      },
    });

    return result.data.getImages;
  }

  labelAliases(label: any) {
    return label.aliases.slice().sort().join(", ");
  }

  loadPage() {
    this.fetchLoader = true;
    this.selectedImages = [];

    return this.fetchPage(this.searchState.page)
      .then((result) => {
        this.searchStateManager.refreshed = true;
        this.fetchError = false;
        this.fetchError = false;
        this.numResults = result.numItems;
        this.numPages = result.numPages;
        this.images = result.items;
      })
      .catch((err) => {
        console.error(err);
        this.fetchError = true;
      })
      .finally(() => {
        this.fetchLoader = false;
      });
  }

  beforeMount() {
    this.searchStateManager.initState(this.$route.query as Dictionary<string>);
    this.updateRoute(this.searchStateManager.toQuery(), true, () => {
      // If the query wasn't different, there will be no route change
      // => manually trigger loadPage
      this.loadPage();
    });

    ApolloClient.query({
      query: gql`
        {
          getLabels {
            _id
            name
            color
            aliases
          }
        }
      `,
    })
      .then((res) => {
        this.allLabels = res.data.getLabels;
        if (!this.allLabels.length) {
          this.searchState.selectedLabels.include = [];
          this.searchState.selectedLabels.exclude = [];
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }
}
</script>

<style lang="scss">
.not-selected {
  transition: all 0.15s ease-in-out;
  filter: brightness(0.6);
}
</style>
