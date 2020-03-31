// TS bindings for Izzy

import Axios from "axios";
import * as logger from "../../logger";

export namespace Izzy {
  export interface IIndexCreation {
    name: string;
    key: string;
  }

  export class Collection<T = any> {
    name: string;
    constructor(name) {
      this.name = name;
    }

    async count() {
      const res = await Axios.options(
        `http://localhost:7999/collection/${this.name}/count`
      );
      if (res.data.error) {
        console.log(res);
        throw res.data.message;
      }
      return res.data.count;
    }

    async compact() {
      return Axios.patch(
        `http://localhost:7999/collection/compact/${this.name}`
      );
    }

    async upsert(id: string, obj: T) {
      const res = await Axios.post(
        `http://localhost:7999/collection/${this.name}/${id}`,
        obj
      );
      if (res.data.error) {
        console.log(res);
        throw res.data.message;
      }
      return res.data as T;
    }

    async remove(id: string) {
      const res = await Axios.delete(
        `http://localhost:7999/collection/${this.name}/${id}`
      );
      if (res.data.error) {
        console.log(res);
        throw res.data.message;
      }
      return res.data as T;
    }

    async getAll() {
      const res = await Axios.get(
        `http://localhost:7999/collection/${this.name}`
      );
      if (res.data.error) {
        console.log(res);
        throw res.data.message;
      }
      return res.data.items as T[];
    }

    async get(id: string) {
      const res = await Axios.get(
        `http://localhost:7999/collection/${this.name}/${id}`
      );
      if (res.data.error) {
        if (res.data.status == 404) return null;
        throw res.data.message;
      }
      return res.data as T;
    }

    async query(index: string, key: string | null) {
      const res = await Axios.get(
        `http://localhost:7999/collection/${this.name}/${index}/${key}`
      );
      if (res.data.error) {
        console.log(res);
        throw res.data.message;
      }
      return res.data.items as T[];
    }
  }

  export async function createCollection<T = any>(
    name: string,
    file?: string | null,
    indexes = [] as IIndexCreation[]
  ) {
    await Axios.post(`http://localhost:7999/collection/${name}`, {
      file,
      indexes
    });
    return new Collection(name);
  }
}
