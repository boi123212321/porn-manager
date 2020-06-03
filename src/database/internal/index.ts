// TS bindings for Izzy
import Axios, { AxiosResponse } from "axios";

import { getConfig } from "../../config";

export namespace Izzy {
  export interface IIndexCreation {
    name: string;
    key: string;
  }

  export class Collection<T = any> {
    name: string;

    constructor(name: string) {
      this.name = name;
    }

    async count(): Promise<number> {
      const res = await Axios.get(
        `http://localhost:${getConfig().IZZY_PORT}/collection/${this.name}/count`
      );
      return res.data.count as number;
    }

    async compact(): Promise<AxiosResponse<any>> {
      return Axios.post(
        `http://localhost:${getConfig().IZZY_PORT}/collection/compact/${this.name}`
      );
    }

    async upsert(id: string, obj: T): Promise<T> {
      const res = await Axios.post(
        `http://localhost:${getConfig().IZZY_PORT}/collection/${this.name}/${id}`,
        obj
      );
      return res.data as T;
    }

    async remove(id: string): Promise<T> {
      const res = await Axios.delete(
        `http://localhost:${getConfig().IZZY_PORT}/collection/${this.name}/${id}`
      );
      return res.data as T;
    }

    async getAll(): Promise<T[]> {
      const res = await Axios.get(
        `http://localhost:${getConfig().IZZY_PORT}/collection/${this.name}`
      );
      return res.data.items as T[];
    }

    async get(id: string): Promise<T | null> {
      // logger.log(`Getting ${this.name}/${id}...`);
      try {
        const res = await Axios.get(
          `http://localhost:${getConfig().IZZY_PORT}/collection/${this.name}/${id}`
        );
        return res.data as T;
      } catch (error) {
        if (!error.response) throw error;
        if (error.response.status === 404) return null;
        throw error;
      }
    }

    async getBulk(items: string[]): Promise<T[]> {
      // logger.log(`Getting bulk from ${this.name}...`);
      const res = await Axios.post(
        `http://localhost:${getConfig().IZZY_PORT}/collection/${this.name}/bulk`,
        { items }
      );
      return res.data.items as T[];
    }

    async query(index: string, key: string | null): Promise<T[]> {
      // logger.log(`Getting indexed: ${this.name}/${key}...`);
      const res = await Axios.get(
        `http://localhost:${getConfig().IZZY_PORT}/collection/${this.name}/${index}/${key}`
      );
      return res.data.items as T[];
    }

    async times(): Promise<[number, number][]> {
      // logger.log(`Getting times: ${this.name}...`);
      const res = await Axios.get(
        `http://localhost:${getConfig().IZZY_PORT}/collection/${this.name}/times`
      );
      return res.data.query_times as [number, number][];
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
