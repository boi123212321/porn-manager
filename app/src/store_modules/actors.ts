import Actor from '@/classes/actor';
import Vue from "vue";
import CustomField from '@/classes/custom_field';
import { VuexModule, Module, Mutation, Action } from "vuex-class-modules";
import store from "@/store";

@Module
class ActorModule extends VuexModule {
  // state
  items = [] as Actor[]

  search = {
    gridSize: 0,
    filterDrawer: false,
    search: "",
    chosenLabels: [] as string[],
    favoritesOnly: false,
    bookmarksOnly: false,
    ratingFilter: 0,
    chosenSort: 0,
  }

  get getAll(): Actor[] {
    return this.items;
  }

  get getById() {
    return (id: string) => this.items.find(actor => actor.id == id);
  }

  get getLabels(): string[] {
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
  set(items: Actor[]) {
    this.items = items;
  }

  @Mutation
  add(item: Actor) {
    this.items.push(item);
  }

  addThumbnails({ id, images }: { id: string, images: string[] }) {
    let _index = this.items.findIndex((v: Actor) => v.id == id) as number;

    if (_index >= 0) {
      let actor = this.items[_index] as Actor;
      actor.thumbnails.push(...images);
      Vue.set(this.items, _index, actor);
    }
  }

  setCoverIndex({ id, index }: { id: string, index: number }) {
    let _index = this.items.findIndex((v: Actor) => v.id == id) as number;

    if (_index >= 0) {
      let actor = this.items[_index] as Actor;
      actor.coverIndex = index;
      Vue.set(this.items, _index, actor);
    }
  }

  rate({ id, rating }: { id: string, rating: number }) {
    let _index = this.items.findIndex((v: Actor) => v.id == id) as number;

    if (_index >= 0) {
      let actor = this.items[_index] as Actor;
      actor.rating = actor.rating == rating ? 0 : rating;
      Vue.set(this.items, _index, actor);
    }
  }

  favorite(id: string) {
    let _index = this.items.findIndex((v: Actor) => v.id == id) as number;

    if (_index >= 0) {
      let actor = this.items[_index] as Actor;
      actor.favorite = !actor.favorite;
      Vue.set(this.items, _index, actor);
    }
  }

  bookmark(id: string) {
    let _index = this.items.findIndex((v: Actor) => v.id == id) as number;

    if (_index >= 0) {
      let actor = this.items[_index] as Actor;
      actor.bookmark = !actor.bookmark;
      Vue.set(this.items, _index, actor);
    }
  }

  setLabels({ id, labels }: { id: string, labels: string[] }) {
    let _index = this.items.findIndex((v: Actor) => v.id == id) as number;

    if (_index >= 0) {
      let actor = this.items[_index] as Actor;
      actor.labels = labels;
      Vue.set(this.items, _index, actor);
    }
  }

  addCustomField(customField: CustomField) {
    for (let i = 0; i < this.items.length; i++) {
      let actor = this.items[i] as Actor;
      actor.customFields[customField.name] = null;
      Vue.set(this.items, i, actor);
    }
  }

  edit({ id, settings }: { id: string, settings: any }) {
    let _index = this.items.findIndex((v: Actor) => v.id == id) as number;

    if (_index >= 0) {
      let actor = this.items[_index] as Actor;
      actor.name = settings.name || actor.name;
      actor.aliases = settings.aliases || actor.aliases;
      actor.customFields = settings.customFields || actor.customFields;
      Vue.set(this.items, _index, actor);
    }
  }
}

export default new ActorModule({ store, name: "actors" });