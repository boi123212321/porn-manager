import { database } from "../../database";
import Actor from "../../types/actor";
import Label from "../../types/label";
import Scene from "../../types/scene";
import Image from "../../types/image";
import { Dictionary} from "../../types/utility";

export default {
  addActor(parent, args: Dictionary<any>) {
    const actor = new Actor(args.name, args.aliases)

    database
      .get('actors')
      .push(actor)
      .write();

    return actor;
  },

  setActorLabels(parent, args: Dictionary<any>) {
    const actor = Actor.getById(args.id);

    for (const label of args.labels) {
      const labelInDb = Label.getById(label);

      if (!labelInDb)
        throw new Error(`Label ${label} not found`);
    }

    if (actor) {
      actor.labels = args.labels;
      database.get('actors')
        .find({ id: actor.id })
        .assign({ labels: args.labels })
        .write();
      return actor;
    }
    else {
      throw new Error(`Actor ${args.id} not found`);
    }
  },

  setActorName(parent, args: Dictionary<any>) {
    const actor = Actor.getById(args.id);

    if (actor) {
      actor.name = args.name;
      database.get('actors')
        .find({ id: actor.id })
        .assign({ name: args.name })
        .write();
      return actor;
    }
    else {
      throw new Error(`Actor ${args.id} not found`);
    }
  },

  setActorRating(parent, args: Dictionary<any>) {
    const actor = Actor.getById(args.id);

    if (actor) {
      actor.rating = args.rating;
      database.get('actors')
        .find({ id: actor.id })
        .assign({ rating: args.rating })
        .write();
      return actor;
    }
    else {
      throw new Error(`Actor ${args.id} not found`);
    }
  },

 setActorAliases(parent, args: Dictionary<any>) {
    const actor = Actor.getById(args.id);

    if (actor) {
      actor.aliases = args.aliases;
      database.get('actors')
        .find({ id: actor.id })
        .assign({ aliases: args.aliases })
        .write();
      return actor;
    }
    else {
      throw new Error(`Actor ${args.id} not found`);
    }
  },

  removeActor(parent, args: Dictionary<any>) {
    const actor = Actor.getById(args.id);

    if (actor) {
      Actor.remove(actor.id);

      Image.filterActor(actor.id);
      Scene.filterActor(actor.id);

      return true;
    }
    else {
      throw new Error(`Actor ${args.id} not found`);
    }
  },

  setActorFavorite(parent, args: Dictionary<any>) {
    const actor = Actor.getById(args.id);

    if (actor) {
      actor.favorite = args.bool;
      database.get('actors')
        .find({ id: actor.id })
        .assign({ favorite: args.bool })
        .write();
      return actor;
    }
    else {
      throw new Error(`Actor ${args.id} not found`);
    }
  },

  setActorBookmark(parent, args: Dictionary<any>) {
    const actor = Actor.getById(args.id);

    if (actor) {
      actor.bookmark = args.bool;
      database.get('actors')
        .find({ id: actor.id })
        .assign({ bookmark: args.bool })
        .write();
      return actor;
    }
    else {
      throw new Error(`Actor ${args.id} not found`);
    }
  },

  setActorThumbnail(parent, args: Dictionary<any>) {
    const actor = Actor.getById(args.id);

    const imageInDb = Image.getById(args.image);

    if (!imageInDb)
      throw new Error(`Image ${args.image} not found`);

    if (actor) {
      actor.thumbnail = args.image;
      database.get('actors')
        .find({ id: actor.id })
        .assign({ thumbnail: args.image })
        .write();
      return actor;
    }
    else {
      throw new Error(`Actor ${args.id} not found`);
    }
  }
}