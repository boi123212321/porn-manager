export interface ISearchOptions<T> {
  query: string;
  skip?: number;
  take?: number;
  filters?: ((doc: T) => boolean)[];
  sort?: (a: T, b: T) => number;
}

export class SearchIndex<T> {
  items: { [key: string]: T } = {};
  tokens: { [key: string]: string[] } = {};

  tokenizer: (t: T) => string[];
  identifier: (t: T) => string;

  constructor(tokenizer: (t: T) => string[], identifier: (t: T) => string) {
    this.tokenizer = tokenizer;
    this.identifier = identifier;
  }

  remove(id: string) {
    delete this.items[id];

    for (const key in this.tokens) {
      const arr = this.tokens[key];
      this.tokens[key] = arr.filter(s => s != id);
    }
  }

  rebuild() {
    this.clear();
    for (const item of Object.values(this.items)) {
      this.add(item);
    }
  }

  update(id: string, doc: T) {
    this.items[id] = doc;
  }

  clear() {
    this.tokens = {};
    this.items = {};
  }

  add(t: T) {
    const tokens = this.tokenizer(t);

    for (const token of tokens) {
      if (this.tokens[token] !== undefined)
        this.tokens[token].push(this.identifier(t));
      else this.tokens[token] = [this.identifier(t)];
    }

    this.items[this.identifier(t)] = t;
  }

  async search(search: ISearchOptions<T>) {
    const scores = {} as { [key: string]: number };

    const tokenizedQuery = tokenize(search.query);

    let foundDocs = [] as { id: string; score: number }[];

    if (tokenizedQuery.length) {
      for (const token of tokenizedQuery) {
        const docs = this.tokens[token];

        if (docs) {
          for (const docId of docs) {
            if (scores[docId] !== undefined) scores[docId]++;
            else scores[docId] = 1;
          }
        }
      }

      for (const id in scores) {
        if (scores[id] > 0)
          foundDocs.push({
            id,
            score: scores[id]
          });
      }
    } else {
      console.log("all docs...");
      foundDocs = Object.keys(this.items).map(id => ({
        id,
        score: 1
      }));
    }

    if (search.filters && search.filters.length) {
      const filterFuncs = search.filters;
      foundDocs = foundDocs.filter(d =>
        filterFuncs.every(f => f(this.items[d.id]))
      );
    }

    if (search.sort) {
      const sortFunc = search.sort;
      foundDocs.sort((a, b) => sortFunc(this.items[a.id], this.items[b.id]));
    } // Sort by relevance
    else foundDocs.sort((a, b) => b.score - a.score);

    console.log("Found " + foundDocs.length);

    if (search.skip !== undefined || search.take) {
      const skip = search.skip && search.skip >= 0 ? search.skip : 0;
      const take = search.take && search.take > 0 ? search.take : 1;

      const page = [] as { id: string; score: number }[];
      for (let i = skip; i < foundDocs.length && page.length < take; i++) {
        const doc = foundDocs[i];

        if (!search.filters) {
          page.push(doc);
        } else {
          if (search.filters.every(f => f(this.items[doc.id]))) page.push(doc);
        }
      }

      return page;
    }

    return foundDocs;
  }
}

export const tokenize = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(" ")
    .filter(Boolean)
    .filter(s => /[a-z]/i.test(s))
    .filter(s => s.length > 1);

import { imageIndex } from "./image";
import { sceneIndex } from "./scene";
import { actorIndex } from "./actor";
import { studioIndex } from "./studio";
import { movieIndex } from "./movie";

export const indices = {
  images: imageIndex,
  scenes: sceneIndex,
  actors: actorIndex,
  studios: studioIndex,
  movies: movieIndex
};
