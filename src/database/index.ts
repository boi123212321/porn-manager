import DataStore from "nedb";
import mkdirp from "mkdirp";
import { libraryPath } from "../types/utility";
import * as logger from "../logger/index";

let store = {} as {
  scenes: DataStore;
  actors: DataStore;
  images: DataStore;
  labels: DataStore;
  movies: DataStore;
  studios: DataStore;
  queue: DataStore;
};

function loadStore(path: string): Promise<DataStore> {
  return new Promise((resolve, reject) => {
    try {
      const store = new DataStore({
        autoload: true,
        filename: path,
        onload: err => {
          if (err) reject(err);
          else {
            logger.log("Loaded store " + path);
            resolve(store);
          }
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

export async function loadStores() {
  try {
    mkdirp.sync("tmp/");
    mkdirp.sync(await libraryPath("scenes/"));
    mkdirp.sync(await libraryPath("images/"));
    mkdirp.sync(await libraryPath("thumbnails/"));
  } catch (err) {}

  store = {
    scenes: await loadStore(await libraryPath("scenes.db")),
    actors: await loadStore(await libraryPath("actors.db")),
    images: await loadStore(await libraryPath("images.db")),
    labels: await loadStore(await libraryPath("labels.db")),
    movies: await loadStore(await libraryPath("movies.db")),
    studios: await loadStore(await libraryPath("studios.db")),
    queue: await loadStore(await libraryPath("queue.db"))
  };
}

export function count(store: DataStore, query: any): Promise<number> {
  return new Promise((resolve, reject) => {
    store.count(query, (err, num) => {
      if (err) return reject(err);
      resolve(num);
    });
  });
}

export function insert<T>(store: DataStore, doc: T | T[]) {
  return new Promise((resolve, reject) => {
    store.insert(doc, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });
}

export function getAll(store: DataStore) {
  return new Promise((resolve, reject) => {
    store.find({}, (err, docs) => {
      if (err) return reject(err);
      resolve(docs);
    });
  });
}

export function update(store: DataStore, query: any, update: any) {
  return new Promise((resolve, reject) => {
    store.update(query, update, { multi: true }, err => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export function remove(store: DataStore, query: any) {
  return new Promise((resolve, reject) => {
    store.remove(query, err => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export function find(store: DataStore, query: any) {
  return new Promise((resolve, reject) => {
    store.find(query, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });
}

export function findOne(store: DataStore, query: any) {
  return new Promise((resolve, reject) => {
    store.findOne(query, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });
}

export { store };
