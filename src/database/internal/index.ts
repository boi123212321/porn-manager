// TS bindings for Izzy
import Axios, { AxiosError, AxiosResponse } from "axios";

import { getConfig } from "../../config";

export namespace Izzy {
  export interface IIndexCreation {
    name: string;
    key: string;
  }

  export class Collection<T> {
    name: string;

    constructor(name: string) {
      this.name = name;
    }

    async count(): Promise<number> {
      const res = await Axios.get<{ count: number }>(
        `http://localhost:${getConfig().IZZY_PORT}/collection/${this.name}/count`
      );
      return res.data.count;
    }

    async compact(): Promise<AxiosResponse<unknown>> {
      return Axios.post(
        `http://localhost:${getConfig().IZZY_PORT}/collection/compact/${this.name}`
      );
    }

    async upsert(id: string, obj: T): Promise<T> {
      const res = await Axios.post<T>(
        `http://localhost:${getConfig().IZZY_PORT}/collection/${this.name}/${id}`,
        obj
      );
      return res.data;
    }

    async remove(id: string): Promise<T> {
      const res = await Axios.delete<T>(
        `http://localhost:${getConfig().IZZY_PORT}/collection/${this.name}/${id}`
      );
      return res.data;
    }

    async getAll(): Promise<T[]> {
      const res = await Axios.get<{ items: T[] }>(
        `http://localhost:${getConfig().IZZY_PORT}/collection/${this.name}`
      );
      return res.data.items;
    }

    async get(id: string): Promise<T | null> {
      // logger.log(`Getting ${this.name}/${id}...`);
      try {
        const res = await Axios.get(
          `http://localhost:${getConfig().IZZY_PORT}/collection/${this.name}/${id}`
        );
        return res.data as T;
      } catch (error) {
        const _err = error as AxiosError;
        if (!_err.response) throw error;
        if (_err.response.status === 404) return null;
        throw _err;
      }
    }

    async getBulk(items: string[]): Promise<T[]> {
      // logger.log(`Getting bulk from ${this.name}...`);
      const res = await Axios.post<{ items: T[] }>(
        `http://localhost:${getConfig().IZZY_PORT}/collection/${this.name}/bulk`,
        { items }
      );
      return res.data.items;
    }

    async query(index: string, key: string | null): Promise<T[]> {
      // logger.log(`Getting indexed: ${this.name}/${key}...`);
      const res = await Axios.get<{ items: T[] }>(
        `http://localhost:${getConfig().IZZY_PORT}/collection/${this.name}/${index}/${key}`
      );
      return res.data.items;
    }

    async times(): Promise<[number, number][]> {
      // logger.log(`Getting times: ${this.name}...`);
      // eslint-disable-next-line camelcase
      const res = await Axios.get<{ query_times: [number, number][] }>(
        `http://localhost:${getConfig().IZZY_PORT}/collection/${this.name}/times`
      );
      return res.data.query_times;
    }
  }

  export async function createCollection<T>(
    name: string,
    file?: string | null,
    indexes = [] as IIndexCreation[]
  ): Promise<Collection<T>> {
    await Axios.post(`http://localhost:${getConfig().IZZY_PORT}/collection/${name}`, {
      file,
      indexes,
    });
    return new Collection(name);
  }
}
