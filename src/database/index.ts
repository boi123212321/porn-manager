import DataStore from "nedb";
import mkdirp from "mkdirp";
import { libraryPath } from "../types/utility";

let store = {} as {
  scenes: DataStore;
  actors: DataStore;
  images: DataStore;
  labels: DataStore;
  movies: DataStore;
  studios: DataStore;
  queue: DataStore;
};

(async () => {
  try {
    mkdirp.sync("tmp/");
    mkdirp.sync(await libraryPath("scenes/"));
    mkdirp.sync(await libraryPath("images/"));
    mkdirp.sync(await libraryPath("thumbnails/"));
  } catch (err) {}

  store = {
    scenes: new DataStore({
      autoload: true,
      filename: await libraryPath("scenes.db")
    }),
    actors: new DataStore({
      autoload: true,
      filename: await libraryPath("actors.db")
    }),
    images: new DataStore({
      autoload: true,
      filename: await libraryPath("images.db")
    }),
    labels: new DataStore({
      autoload: true,
      filename: await libraryPath("labels.db")
    }),
    movies: new DataStore({
      autoload: true,
      filename: await libraryPath("movies.db")
    }),
    studios: new DataStore({
      autoload: true,
      filename: await libraryPath("studios.db")
    }),
    queue: new DataStore({
      autoload: true,
      filename: await libraryPath("queue.db")
    })
  };
})();

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
