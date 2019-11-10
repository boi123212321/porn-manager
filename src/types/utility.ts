import config from "../config/index";
import * as path from "path";

export interface Dictionary<T> {
  [key: string]: T;
}

export function isValidUrl(str: string) {
  try {
    new URL(str);
    return true;
  } catch (_) {
    return false;
  }
}

export function libraryPath(str: string) {
  return path.join(
    config.LIBRARY_PATH,
    "library",
    str
  );
}