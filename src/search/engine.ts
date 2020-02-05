import { tokenize } from "./tokenize";
import * as logger from "../logger/index";

interface IScoredDocument {
  id: string;
  score: number;
}

function applyFilters<T>(
  docs: IScoredDocument[],
  items: Record<string, T>,
  filters: ((x: T) => boolean)[]
): IScoredDocument[] {
  const result = [] as IScoredDocument[];
  for (const doc of docs) {
    const item = items[doc.id];
    if (!item) continue;
    if (filters.every(f => f(item))) result.push(doc);
  }
  return result;
}

export interface ISearchOptions<T> {
  query: string;
  skip?: number;
  take?: number;
  filters?: ((doc: T) => boolean)[];
  sort?: (a: T, b: T) => number;
  random?: boolean;
}

export class SearchIndex<T> {
  items: Record<string, T> = {};
  tokens: { [key: string]: string[] } = {};
  idMap: { [key: string]: string } = {};

  tokenizer: (t: T) => string[];
  identifier: (t: T) => string;

  idCounter = 0;

  constructor(tokenizer: (t: T) => string[], identifier: (t: T) => string) {
    this.tokenizer = tokenizer;
    this.identifier = identifier;
  }

  numTokens() {
    return Object.keys(this.tokens).length;
  }

  size() {
    return Object.keys(this.items).length;
  }

  remove(id: string) {
    delete this.items[id];

    for (const key in this.tokens) {
      const arr = this.tokens[key];
      this.tokens[key] = arr.filter(s => s != id);
    }
  }

  rebuild() {
    const items = this.items;
    this.clear();
    for (const item of Object.values(items)) {
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

    const id = (this.idCounter++).toString();
    const realId = this.identifier(t);
    this.idMap[id] = realId;

    for (const token of tokens) {
      if (this.tokens[token] !== undefined) this.tokens[token].push(id);
      else this.tokens[token] = [id];
    }

    this.items[realId] = t;
  }

  async search(search: ISearchOptions<T>) {
    const scores = {} as { [key: string]: number };

    logger.search(`Searching for '${search.query}'`);

    const tokenizedQuery = tokenize(search.query);

    logger.search(`Tokenized query`);

    let foundDocs = [] as IScoredDocument[];

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
            id: this.idMap[id],
            score: scores[id]
          });
      }
    } else {
      logger.search(`No query: getting all items`);
      foundDocs = Object.keys(this.items).map(id => ({
        id,
        score: 1
      }));
    }

    logger.search(`Found ${foundDocs.length} candidates`);

    if (search.filters && search.filters.length) {
      foundDocs = applyFilters(foundDocs, this.items, search.filters);
      logger.search(`Applied ${search.filters.length} filters`);
    }

    if (search.random) {
      return [foundDocs[Math.floor(Math.random() * foundDocs.length)]];
    }

    if (search.sort) {
      const sortFunc = search.sort;
      foundDocs.sort((a, b) => sortFunc(this.items[a.id], this.items[b.id]));
    } // Sort by relevance
    else foundDocs.sort((a, b) => b.score - a.score);

    logger.search(`Sorted result`);

    if (search.skip !== undefined || search.take) {
      const skip = search.skip && search.skip >= 0 ? search.skip : 0;
      const take = search.take && search.take > 0 ? search.take : 1;

      const page = [] as IScoredDocument[];
      for (let i = skip; i < foundDocs.length && page.length < take; i++) {
        const doc = foundDocs[i];
        page.push(doc);
      }

      logger.search(`Got page: ${page.length} items`);
      return page;
    }

    logger.search(`Returning all ${foundDocs.length} found items`);
    return foundDocs;
  }
}
