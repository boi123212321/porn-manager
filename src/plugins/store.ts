const store: Record<string, unknown> = {};

function storeHasItem(key: string): boolean {
  return key in store;
}

function getStoreItem(key: string): unknown {
  return store[key];
}

function setStoreItem<T>(key: string, value: T): void {
  store[key] = value;
}

function removeStoreItem(key: string): void {
  delete store[key];
}

export function createPluginStoreAccess(pluginName: string) {
  function getNamespacedKey(key: string) {
    return `${pluginName}-${key}`;
  }

  return {
    setItem: (key: string, value: unknown) => setStoreItem(getNamespacedKey(key), value),
    getItem: (key: string) => getStoreItem(getNamespacedKey(key)),
    hasItem: (key: string) => storeHasItem(getNamespacedKey(key)),
    removeItem: (key: string) => removeStoreItem(getNamespacedKey(key)),
  };
}
