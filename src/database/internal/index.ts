// TS bindings for Izzy

import Axios from "axios";

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

    async upsert(id: string, obj: T) {
      const { data } = await Axios.post(
        `http://localhost:7999/collection/${this.name}/${id}`,
        obj
      );
      return data as T;
    }

    async remove(id: string) {
      const { data } = await Axios.delete(
        `http://localhost:7999/collection/${this.name}/${id}`
      );
      return data as T;
    }

    async getAll() {
      const { data } = await Axios.get(
        `http://localhost:7999/collection/${this.name}/`
      );
      if (data.error) throw data.message;
      return data.items as T[];
    }

    async get(id: string) {
      const { data } = await Axios.get(
        `http://localhost:7999/collection/${this.name}/${id}`
      );
      return data as T;
    }

    async query(index: string, key: string | null) {
      const { data } = await Axios.get(
        `http://localhost:7999/collection/${this.name}/${index}/${key}`
      );
      return data.items as T[];
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
