import Video from '@/classes/video';
import Vue from "vue";
import fs from "fs";
import CustomField from '@/classes/custom_field';
import { VuexModule, Module, Mutation, Action } from "vuex-class-modules";
import store from "@/store";

@Module({ generateMutationSetters: true })
class VideosModule extends VuexModule {
  items: Video[] = []
  search = {
    gridSize: 0,
    filterDrawer: false,
    search: "",
    chosenLabels: [] as string[],
    chosenActors: [] as string[],
    favoritesOnly: false,
    bookmarksOnly: false,
    ratingFilter: 0,
    chosenSort: 0
  }

  generatingThumbnails = false

  get getAll(): Video[] {
    return this.items;
  }

  get getByPath() {
    return (path: string) => this.items.find((v: Video) => v.path == path);
  }

  get getByActor() {
    return (id: string) => this.items.filter((v: Video) => v.actors.includes(id));
  }

  get getLabels() {
    return [
      ...new Set(
        this.items.map(v => v.labels).flat()
      )
    ];
  }

  get getActorWatches() {
    return (actor: string) => this.items.filter(v => v.actors.includes(actor)).map(v => v.watches).flat();
  }

  @Mutation
  setGeneratingThumbnails(bool: boolean) {
    this.generatingThumbnails = bool;
  }

  @Mutation
  setSearchParam({ key, value }: { key: string, value: any }) {
    Vue.set(this.search, key, value);
  }

  @Mutation
  set(items: Video[]) {
    this.items = items;
  }

  @Mutation
  add(items: Video[]) {
    this.items.push(...items);
  }

  @Mutation
  addThumbnails({ id, images }: { id: string, images: string[] }) {
    let _index = this.items.findIndex((v: Video) => v.id == id) as number;

    if (_index >= 0) {
      let video = this.items[_index] as Video;
      video.thumbnails.push(...images);
      Vue.set(this.items, _index, video);
    }
  }

  @Mutation
  setCoverIndex({ id, index }: { id: string, index: number }) {
    let _index = this.items.findIndex((v: Video) => v.id == id) as number;

    if (_index >= 0) {
      let video = this.items[_index] as Video;
      video.coverIndex = index;
      Vue.set(this.items, _index, video);
    }
  }

  @Mutation
  removeThumbnail({ id, index }: { id: string, index: number }) {
    let _index = this.items.findIndex((v: Video) => v.id == id) as number;

    if (_index >= 0) {
      let video = this.items[_index] as Video;

      video.thumbnails.splice(index, 1)[0];

      if (video.coverIndex >= video.thumbnails.length) {
        video.coverIndex -= 1;
      }

      Vue.set(this.items, _index, video);
    }
  }

  @Mutation
  removeThumbnailById({ id, image }: { id: string, image: string }) {
    let _index = this.items.findIndex((v: Video) => v.id == id) as number;

    if (_index >= 0) {
      let video = this.items[_index] as Video;

      video.thumbnails = video.thumbnails.filter(id => id !== image)

      if (video.coverIndex >= video.thumbnails.length) {
        video.coverIndex -= 1;
      }

      Vue.set(this.items, _index, video);
    }
  }

  @Mutation
  rate({ id, rating }: { id: string, rating: number }) {
    let _index = this.items.findIndex((v: Video) => v.id == id) as number;

    if (_index >= 0) {
      let video = this.items[_index] as Video;
      video.rating = video.rating == rating ? 0 : rating;
      Vue.set(this.items, _index, video);
    }
  }

  @Mutation
  favorite(id: string) {
    let _index = this.items.findIndex((v: Video) => v.id == id) as number;

    if (_index >= 0) {
      let video = this.items[_index] as Video;
      video.favorite = !video.favorite;
      Vue.set(this.items, _index, video);
    }
  }

  @Mutation
  bookmark(id: string) {
    let _index = this.items.findIndex((v: Video) => v.id == id) as number;

    if (_index >= 0) {
      let video = this.items[_index] as Video;
      video.bookmark = !video.bookmark;
      Vue.set(this.items, _index, video);
    }
  }

  @Mutation
  setLabels({ id, labels }: { id: string, labels: string[] }) {
    let _index = this.items.findIndex((v: Video) => v.id == id) as number;

    if (_index >= 0) {
      let video = this.items[_index] as Video;
      video.labels = labels;
      Vue.set(this.items, _index, video);
    }
  }

  @Mutation
  incrementViewCounter(id: string) {
    let _index = this.items.findIndex((v: Video) => v.id == id) as number;

    if (_index >= 0) {
      let video = this.items[_index] as Video;
      video.watches.push(+new Date());
      Vue.set(this.items, _index, video);
    }
  }

  @Mutation
  edit({ id, settings }: { id: string, settings: any }) {
    let _index = this.items.findIndex((v: Video) => v.id == id) as number;

    if (_index >= 0) {
      let video = this.items[_index] as Video;

      if (settings.description !== undefined)
        video.description = settings.description;
      video.title = settings.title || video.title;
      video.actors = settings.actors || video.actors;
      video.customFields = settings.customFields || video.customFields;
      Vue.set(this.items, _index, video);
    }
  }

  @Mutation
  addCustomField(customField: CustomField) {
    for (let i = 0; i < this.items.length; i++) {
      let video = this.items[i] as Video;
      video.customFields[customField.name] = null;
      Vue.set(this.items, i, video);
    }
  }
}

export default new VideosModule({ store, name: "videos" });