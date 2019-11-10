import { database } from "../database";
import { generateHash } from "../hash";

export class ImageDimensions {
  width: number | null = null;
  height: number | null = null;
}

export class ImageMeta {
  size: number | null = null;
  dimensions = new ImageDimensions();
}

export default class Image {
  id: string;
  name: string;
  path: string | null = null;
  scene: string | null = null;
  addedOn = +new Date();
  favorite: boolean = false;
  bookmark: boolean = false;
  rating: number = 0;
  customFields: any = {};
  labels: string[] = [];
  meta = new ImageMeta();
  actors: string[] = [];

  static remove(id: string) {
    database.get('images')
      .remove({ id })
      .write();
  }

  static filterActor(actor: string) {
    for (const image of Image.getAll()) {
      database.get('images')
        .find({ id: image.id })
        .assign({ actors: image.actors.filter(l => l != actor) })
        .write();
    }
  }

  static filterLabel(label: string) {
    for (const image of Image.getAll()) {
      database.get('images')
        .find({ id: image.id })
        .assign({ labels: image.labels.filter(l => l != label) })
        .write();
    }
  }

  static getByScene(id: string): Image[] {
    return Image
      .getAll()
      .filter(image => image.scene == id)
  }

  static getByActor(id: string): Image[] {
    return Image
      .getAll()
      .filter(image => image.actors.includes(id))
  }

  static getById(id: string): Image | null {
    return Image
      .getAll()
      .find(image => image.id == id) || null;
  }

  static getAll(): Image[] {
    return database.get('images').value();
  }

  constructor(name: string) {
    this.id = generateHash();
    this.name = name.trim();
  }
}