import Image from '@/classes/image';
import Vue from "vue";
import CustomField from '@/classes/custom_field';
import { VuexModule, Module, Mutation, Action } from "vuex-class-modules";
import store from "@/store";

@Module({ generateMutationSetters: true })
class ImagesModule extends VuexModule {
  items = [] as Image[]

  search = {
    gridSize: 0,
    filterDrawer: false,
    search: "",
    chosenLabels: [] as string[],
    chosenActors: [] as string[],
    favoritesOnly: false,
    bookmarksOnly: false,
    ratingFilter: 0,
    chosenSort: 0,
  }

  get getAll(): Image[] {
    return this.items;
  }

  get getById() {
    return (id: string) => this.items.find(image => image.id == id);
  }

  get getByPath() {
    return (path: string) => this.items.find(image => image.path == path);
  }

  get idToPath() {
    return (id: string) => {
      let item = this.items.find(image => image.id == id);

      if (item)
        return item.path;
      return;
    }
  }

  get getLabels() {
    return [
      ...new Set(
        this.items.map(v => v.labels).flat()
      )
    ];
  }

  @Mutation
  setSearchParam({ key, value }: { key: string, value: any }) {
    Vue.set(this.search, key, value);
  }

  @Mutation
  set(items: Image[]) {
    this.items = items;
  }

  @Mutation
  add(items: Image[]) {
    this.items.push(...items);
  }

  @Mutation
  rate({ id, rating }: { id: string, rating: number }) {
    let _index = this.items.findIndex((v: Image) => v.id == id) as number;

    if (_index >= 0) {
      let image = this.items[_index] as Image;
      image.rating = image.rating == rating ? 0 : rating;
      Vue.set(this.items, _index, image);
    }
  }

  @Mutation
  favorite(id: string) {
    let _index = this.items.findIndex((v: Image) => v.id == id) as number;

    if (_index >= 0) {
      let image = this.items[_index] as Image;
      image.favorite = !image.favorite;
      Vue.set(this.items, _index, image);
    }
  }

  @Mutation
  bookmark(id: string) {
    let _index = this.items.findIndex((v: Image) => v.id == id) as number;

    if (_index >= 0) {
      let image = this.items[_index] as Image;
      image.bookmark = !image.bookmark;
      Vue.set(this.items, _index, image);
    }
  }

  @Mutation
  addCustomField(customField: CustomField) {
    for (let i = 0; i < this.items.length; i++) {
      let image = this.items[i] as Image;
      image.customFields[customField.name] = null;
      Vue.set(this.items, i, image);
    }
  }

  @Mutation
  remove(id: string) {
    this.items = this.items.filter(i => i.id !== id);
  }

  @Mutation
  setLabels({ id, labels }: { id: string, labels: string[] }) {
    let _index = this.items.findIndex((v: Image) => v.id == id) as number;

    if (_index >= 0) {
      let video = this.items[_index] as Image;
      video.labels = labels;
      Vue.set(this.items, _index, video);
    }
  }

  @Mutation
  edit({ id, settings }: { id: string, settings: any }) {
    let _index = this.items.findIndex((v: Image) => v.id == id) as number;

    if (_index >= 0) {
      let video = this.items[_index] as Image;
      video.name = settings.name || video.name;
      video.actors = settings.actors || video.actors;
      video.customFields = settings.customFields || video.customFields;
      Vue.set(this.items, _index, video);
    }
  }
}

export default new ImagesModule({ store, name: "images" });