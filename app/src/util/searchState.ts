import Vue from "vue";
import { Dictionary } from "vue-router/types/router";

/**
 * A prop can be a configuration object or a boolean:
 * - `true`: use this prop in state
 * - `false`: prevent using this prop (even if exists in query)
 */
export type PropConfig<F extends { [prop: string]: unknown } = {}> =
  | boolean
  | Partial<{
      localStorageKey: string;
      /**
       * Default value to use in `initState()`.
       * This value will not be added to the query in `toQuery()`
       */
      default: () => unknown;
      serialize: (value: any) => string;
      deserialize: (str: string, state: Partial<F>) => unknown;
    }>;

export interface StateOptions<F extends { [prop: string]: unknown } = {}> {
  localStorageNamer?: (key: string) => string;
  props: { [key: string]: PropConfig<F> };
}

export const isQueryDifferent = (
  queryA: Dictionary<string>,
  queryB: Dictionary<string>
): boolean => {
  const entriesA = Object.entries(queryA);
  const entriesB = Object.entries(queryB);
  return (
    entriesA.length !== entriesB.length || entriesA.some(([prop, val]) => val !== queryB[prop])
  );
};

const DEFAULT_VALUE = null

export class SearchStateManager<F extends { [prop: string]: unknown } = {}> {
  private _state: F = Vue.observable({}) as any;
  private _config: StateOptions<F> = {
    props: {},
  };

  public refreshed = Vue.observable(true);

  public constructor(config: StateOptions<F>) {
    this._config = config;
  }

  private getLocalStorageName = (key: string): string => {
    const propConfig = this._config.props[key];
    const name =
      typeof propConfig !== "boolean" && propConfig.localStorageKey
        ? propConfig.localStorageKey
        : key;

    if (typeof this._config.localStorageNamer === "function") {
      return this._config.localStorageNamer(name);
    }
    return name;
  };

  /**
   * Initializes state of all props from url query, localStorage or defaults
   * Note: localStorage will only be used when there are NO props in the query
   *
   * @param query - page url query
   */
  public initState(query: Dictionary<string>): void {
    // Fallback to localStorage ONLY if there are NO params in the query
    const canUseLocalStorage = !Object.keys(query).length;

    Object.entries(this._config.props).forEach(([key, propConfig]) => {
      if (propConfig === false) {
        return;
      }

      let initialValue: unknown = DEFAULT_VALUE;
      if (Object.hasOwnProperty.call(query, key)) {
        // Get from query first ONLY if it exists in query
        initialValue = this.deserialize(key, query[key]);
      } else if (canUseLocalStorage) {
        // Else fallback to localStorage if allowed
        const strValue = localStorage.getItem(this.getLocalStorageName(key));
        if (strValue !== null) {
          try {
            initialValue = this.deserialize(key, strValue);
          } catch (err) {
            initialValue = DEFAULT_VALUE;
          }
        }
      }

      if (initialValue == null && typeof propConfig !== "boolean" && propConfig.default) {
        // If the prop wasn't in the query and we didn't get a value from
        // localStorage (either because there wasn't a value, or we didn't check)
        // => fallback to default in config
        initialValue = propConfig.default();
      }

      initialValue = initialValue ?? DEFAULT_VALUE;

      Vue.set(this._state, key, initialValue);
    });
  }

  private serialize(key: string, deserializedValue: unknown): string {
    let serializedValue: string;

    const propConfig = this._config.props[key];

    if (typeof propConfig !== "boolean" && propConfig?.serialize) {
      serializedValue = propConfig.serialize(deserializedValue);
    } else {
      serializedValue = JSON.stringify(deserializedValue);
    }

    return serializedValue;
  }

  private deserialize(key: string, serializedValue: string): unknown {
    let deserializedValue: unknown | null = DEFAULT_VALUE;

    const propConfig = this._config.props[key];

    if (typeof propConfig !== "boolean" && propConfig?.deserialize) {
      deserializedValue = propConfig.deserialize(serializedValue, this._state);
    } else {
      try {
        deserializedValue = JSON.parse(serializedValue);
      } catch (err) {
        // ignore
      }
    }
    return deserializedValue;
  }

  /**
   * @returns a query object containing only the props whose values
   * are not their default values
   */
  public toQuery(): Record<string, string> {
    const query: Record<string, string> = {};
    Object.entries(this._state).forEach(([key, value]) => {
      const propConfig = this._config.props[key];
      if (propConfig === false) {
        return;
      }

      const strValue = JSON.stringify(value);

      let defaultValue = JSON.stringify(
        propConfig !== true && propConfig.default ? propConfig.default() : DEFAULT_VALUE
      );

      if (defaultValue !== strValue) {
        // Only add the value to the query if it is different to
        // the default value
        const serializedValue = this.serialize(key, value);
        query[key] = serializedValue;
      }
    });

    return query;
  }

  /**
   * Parses the query state to update the internal state
   *
   * @param query - page url query
   */
  public parseFromQuery(query: Dictionary<string>): void {
    Object.entries(query).forEach(([key, value]) => {
      if (
        !Object.hasOwnProperty.call(this._config.props, key) ||
        this._config.props[key] === false
      ) {
        return;
      }

      const deserializedValue = this.deserialize(key, value);
      Vue.set(this._state, key, deserializedValue);
    });
  }

  public onValueChanged(key: string, value: unknown): void {
    if (!Object.hasOwnProperty.call(this._config.props, key) || this._config.props[key] === false) {
      return;
    }

    this.refreshed = false;

    Vue.set(this._state, key, value);

    const strValue = this.serialize(key, value);
    localStorage.setItem(this.getLocalStorageName(key), strValue);
  }

  public get state() {
    return this._state;
  }
}
