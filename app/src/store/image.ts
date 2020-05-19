import { VuexModule, Module, Mutation, Action } from "vuex-class-modules";

@Module
class ImageModule extends VuexModule {
  page = 1;
  numResults = 0;
  numPages = 0;
  // items = [] as IImage[];

  /* @Mutation
  unshift(items: IImage[]) {
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

  /* @Mutation
  removeImages(ids: string[]) {
    for (const id of ids) {
      this.items = this.items.filter((img) => img._id != id);
    }
  } */

  @Mutation
  setPagination({
    // items,
    numResults,
    numPages,
  }: {
    // items: IImage[];
    numResults: number;
    numPages: number;
  }) {
    // this.items = items;
    this.numResults = numResults;
    this.numPages = numPages;
  }
}

import store from "./index";
import IImage from "@/types/image";
export const imageModule = new ImageModule({ store, name: "images" });
