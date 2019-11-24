import { VuexModule, Module, Mutation, Action } from "vuex-class-modules";
import IScene from "@/types/scene";
import IActor from "@/types/actor";

@Module
class MovieModule extends VuexModule {
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

  /* @Mutation
  setRating(rating: number) {
    if (this.current) this.current.rating = rating;
  } */

  /*  @Mutation
  setThumbnail(id: string) {
    if (this.current) {
      if (!this.current.thumbnail) this.current.thumbnail = { _id: id };
      else this.current.thumbnail._id = id;
    }
  } */

  @Mutation
  setActors(actors: IActor[]) {
    if (this.current) this.current.actors = actors;
  }

  @Mutation
  setScenes(scenes: IScene[]) {
    if (this.current) this.current.scenes = scenes;
  }
}

import store from "./index";
export const movieModule = new MovieModule({ store, name: "movie" });
