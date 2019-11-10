export interface Dictionary<T> {
  [key: string]: T;
}

export const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}