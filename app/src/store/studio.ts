import { VuexModule, Module, Mutation, Action } from "vuex-class-modules";

@Module
class StudioModule extends VuexModule {
  current = null as any | null;

  page = 1;
  numResults = 0;
  numPages = 0;
  // items = [] as any[];

  /* @Mutation
  unshift(items: any[]) {
    this.items.unshift(...items);
  } */

  @Mutation
  resetPagination() {
    // this.items = [];
    this.numPages = 0;
    this.numResults = 0;
    this.page = 1;
  }

  @Mutation
  setPage(num: number) {
    this.page = num;
  }

  @Mutation
  setPagination({
    // items,
    numResults,
    numPages,
  }: {
    // items: any[];
    numResults: number;
    numPages: number;
  }) {
    // this.items = items;
    this.numResults = numResults;
    this.numPages = numPages;
  }

  @Mutation
  setName(name: string) {
    if (this.current) this.current.name = name;
  }

  @Mutation
  setAliases(aliases: string[]) {
    if (this.current) this.current.aliases = aliases;
  }

  @Mutation
  setDescription(description: string) {
    if (this.current) this.current.description = description;
  }

  @Mutation
  setCurrent(current: any) {
    this.current = current;
  }

  @Mutation
  setFavorite(bool: boolean) {
    if (this.current) this.current.favorite = bool;
  }

  @Mutation
  setBookmark(bool: number | null) {
    if (this.current) this.current.bookmark = bool;
  }

  @Mutation
  setRating(rating: number) {
    if (this.current) this.current.rating = rating;
  }

  @Mutation
  setLabels(labels: { _id: string; name: string }[]) {
    if (this.current) this.current.labels = labels;
  }

  @Mutation
  setThumbnail(id: string) {
    if (this.current) {
      if (!this.current.thumbnail) this.current.thumbnail = { _id: id };
      else this.current.thumbnail._id = id;
    }
  }

  @Mutation
  setParent(parent: number) {
    if (this.current) this.current.parent = parent;
  }
}

import store from "./index";
export const studioModule = new StudioModule({ store, name: "studios" });
