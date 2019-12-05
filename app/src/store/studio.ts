import { VuexModule, Module, Mutation, Action } from "vuex-class-modules";

@Module
class StudioModule extends VuexModule {
  current = null as any | null;

  @Mutation
  setName(name: string) {
    if (this.current) this.current.name = name;
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
  setBookmark(bool: boolean) {
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
export const studioModule = new StudioModule({ store, name: "studio" });
