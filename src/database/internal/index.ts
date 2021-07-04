import Axios, { AxiosError, AxiosResponse } from "axios";

import { getConfig } from "../../config";
import { formatMessage, logger } from "../../utils/logger";

// TS bindings for Izzy
export namespace Izzy {
  // Secondary index definition
  // Can only be used on string values
  export interface IIndexCreation<T> {
    name: string;
    key: keyof Omit<T, "_id">;
  }

  // Represents a collection ("table")
  export class Collection<T extends { _id: string }> {
    name: string;

    constructor(name: string) {
      this.name = name;
    }

    // Returns amount of items in collection
    async count(): Promise<number> {
      logger.silly(`Getting collection count: ${this.name}`);
      const res = await Axios.get<{ count: number }>(
        `http://localhost:${getConfig().binaries.izzyPort}/collection/${this.name}/count`
      );
      return res.data.count;
    }

    // Compacts database file
    async compact(): Promise<AxiosResponse<unknown>> {
      logger.silly(`Compacting collection: ${this.name}`);
      return Axios.post(
        `http://localhost:${getConfig().binaries.izzyPort}/collection/compact/${this.name}`
      );
    }

    // Inserts or overwrites item
    async upsert(id: string, obj: T): Promise<T> {
      logger.silly(`Upsert ${id} in collection: ${this.name}`);
      const res = await Axios.post<T>(
        `http://localhost:${getConfig().binaries.izzyPort}/collection/${this.name}/${id}`,
        obj
      );
      return res.data;
    }

    // Removes item
    async remove(id: string): Promise<T> {
      logger.silly(`Remove ${id} in collection: ${this.name}`);
      const res = await Axios.delete<T>(
        `http://localhost:${getConfig().binaries.izzyPort}/collection/${this.name}/${id}`
      );
      return res.data;
    }

    // Gets one item from collection, order is not guaranteed
    async getHead(): Promise<T | null> {
      logger.silly(`Get head from collection: ${this.name}`);
      const res = await Axios.get<T | null>(
        `http://localhost:${getConfig().binaries.izzyPort}/collection/${this.name}/head`
      );
      return res.data;
    }

    // Gets all items from collections
    async getAll(): Promise<T[]> {
      logger.silly(`Get all from collection: ${this.name}`);
      const res = await Axios.get<{ items: T[] }>(
        `http://localhost:${getConfig().binaries.izzyPort}/collection/${this.name}`
      );
      return res.data.items;
    }

    // Gets item by ID
    async get(id: string): Promise<T | null> {
      logger.silly(`Getting ${id} from collection: ${this.name}`);
      try {
        const res = await Axios.get(
          `http://localhost:${getConfig().binaries.izzyPort}/collection/${this.name}/${id}`
        );
        return res.data as T;
      } catch (error) {
        const _err = error as AxiosError;
        if (!_err.response) {
          throw error;
        }
        if (_err.response.status === 404) {
          return null;
        }
        throw _err;
      }
    }

    // Gets multiple items using one request
    async getBulk(items: string[]): Promise<T[]> {
      logger.silly(`Getting ${items.length} items in bulk from collection: ${this.name}`);
      const { data } = await Axios.post<{ items: T[] }>(
        `http://localhost:${getConfig().binaries.izzyPort}/collection/${this.name}/bulk`,
        { items }
      );
      const filtered = data.items.filter(Boolean);
      if (filtered.length < data.items.length) {
        logger.warn(
          `Retrieved some null value from getBulk (set logger to 'debug' for more info): `
        );
        logger.debug(`Requested: ${formatMessage(items)}`);
        logger.debug(`Result: ${formatMessage(data.items)}`);
        logger.warn(
          "This is not breaking, but it does mean your database probably contains some invalid value or the search index is out of sync. Try reindexing Elasticsearch."
        );
      }
      return filtered;
    }

    // Queries an index by key
    async query(index: string, key: string | null): Promise<T[]> {
      logger.silly(`Querying index ${index} by ${key} from collection: ${this.name}`);
      const res = await Axios.get<{ items: T[] }>(
        `http://localhost:${getConfig().binaries.izzyPort}/collection/${this.name}/${index}/${key}`
      );
      return res.data.items;
    }
  }

  // Creates new collection, will be successful when the collection already exists
  export async function createCollection<T extends { _id: string }>(
    name: string,
    file?: string | null,
    indexes = [] as IIndexCreation<T>[]
  ): Promise<Collection<T>> {
    try {
      logger.debug(`Creating collection: ${name} (persistence: ${file})`);
      logger.silly(indexes);
      await Axios.post(`http://localhost:${getConfig().binaries.izzyPort}/collection/${name}`, {
        file,
        indexes,
      });

      return new Collection(name);
    } catch (error) {
      const _err = error as AxiosError;
      if (_err.response && _err.response.status === 409) {
        return new Collection(name);
      }
      throw _err;
    }
  }
}
