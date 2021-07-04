import { createReadStream, PathLike } from "fs";

import { handleError, logger } from "./logger";
import { isNumber } from "./types";

/**
 * Calculates the fps from a FFprobe expression
 * e.g. 30000/1001 will be converted to 29.97...
 */
export function evaluateFps(str: string): number | null {
  const [x, y] = str.split("/");
  if (!x) {
    return null;
  }
  if (!y) {
    return Number(x);
  }
  return Number(x) / Number(y);
}

export function validRating(val: unknown): val is number {
  return isNumber(val) && val >= 0 && val <= 10 && Number.isInteger(val);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createObjectSet<T extends Record<string, any>>(
  objs: T[],
  key: keyof T & string,
  retainDup: "first" | "last" = "last"
): T[] {
  const dict = {} as { [key: string]: T };
  for (const obj of objs) {
    dict[obj[key]] = retainDup === "first" ? dict[obj[key]] || obj : obj;
  }
  const set = [] as T[];
  for (const key in dict) {
    set.push(dict[key]);
  }
  return set;
}

export function isValidUrl(str: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new URL(str);
    return true;
  } catch (err) {
    logger.error(err);
    return false;
  }
}

/**
 * Generates an array of timestamps at regular intervals
 *
 * @param count - the amount of timestamps to generate
 * @param duration - the duration of the media. If given, will generate timestamps in seconds
 * based on this duration. Otherwise, will generate in percentage strings
 * @param options - generation options
 * @param options.startPercentage - where to start the timestamp generation, as a percentage
 * @param options.endPercentage - where to stop the timestamp generation, as a percentage
 */
export function generateTimestampsAtIntervals(
  count: number,
  duration: number | null = null,
  options: { startPercentage: number; endPercentage: number } = {
    startPercentage: 0,
    endPercentage: 100,
  }
): string[] {
  const timestamps: string[] = [];

  let startPosition: number;
  let endPosition: number;

  if (duration) {
    const secondsPerPercent = duration / 100;
    startPosition = secondsPerPercent * options.startPercentage;
    endPosition = secondsPerPercent * options.endPercentage;
  } else {
    startPosition = options.startPercentage;
    endPosition = options.endPercentage;
  }

  const interval = (endPosition - startPosition) / count;

  for (let i = 0; i < count; i++) {
    timestamps.push(`${startPosition + interval * i}${duration ? "" : "%"}`);
  }

  return timestamps;
}

/**
 * Copies the properties of the defaults to the target.
 * WARNING: Will not enter arrays.
 * Mutates the target object
 *
 * @param target - the object which to merge the missing properties into
 * @param defaults - objects whose properties to copy
 * @param ignorePaths - paths to ignore merging
 */
export function mergeMissingProperties(
  target: Record<string, unknown>,
  defaults: Record<string, unknown>[],
  ignorePaths: string[] = []
): Record<string, unknown> {
  if (typeof target !== "object" || !target) {
    target = {};
  }

  const mergesToDo = defaults.map((defaultObj) => ({ target, defaultObj, parentPath: "" }));

  function copy(
    currentTarget: Record<string, unknown>,
    currentSource: Record<string, unknown>,
    parentPath = ""
  ) {
    const propStack = Object.getOwnPropertyNames(currentSource);
    let prop = propStack.shift();

    while (prop) {
      const propPath = `${parentPath ? `${parentPath}.` : ""}${prop}`;
      const isIgnoredPath = ignorePaths.includes(propPath);

      if (isIgnoredPath) {
        prop = propStack.shift();
        continue;
      }

      if (!Object.hasOwnProperty.call(currentTarget, prop)) {
        if (
          currentSource[prop] &&
          typeof currentSource[prop] === "object" &&
          !Array.isArray(currentSource[prop])
        ) {
          // If the target is missing a whole object, we have to make sure to ignore the paths inside
          // that object as well
          const subMergeObj = mergeMissingProperties(
            {},
            [currentSource[prop] as Record<string, unknown>],
            ignorePaths.map((path) => path.replace(`${propPath}.`, ""))
          );
          currentTarget[prop] = subMergeObj;
        } else {
          // Otherwise just set the value
          currentTarget[prop] = currentSource[prop];
        }
      } else if (
        currentTarget[prop] &&
        typeof currentTarget[prop] === "object" &&
        !Array.isArray(currentTarget[prop])
      ) {
        mergesToDo.push({
          target: currentTarget[prop] as Record<string, unknown>,
          defaultObj: currentSource[prop] as Record<string, unknown>,
          parentPath: propPath,
        });
      }

      prop = propStack.shift();
    }
  }

  let mergeInstruction = mergesToDo.shift();
  while (mergeInstruction) {
    copy(mergeInstruction.target, mergeInstruction.defaultObj, mergeInstruction.parentPath);
    mergeInstruction = mergesToDo.shift();
  }

  return target;
}

export function isObject(target: unknown): target is Record<string, unknown> {
  return !!target && typeof target === "object" && !Array.isArray(target);
}

/**
 * Removes properties from the target, that do not exist in the default
 * WARNING: Will not enter arrays.
 *
 * @param target - the object to clean
 * @param defaultObj - the object with the properties to keep
 * @param ignorePaths - paths to ignore stripping
 */
export function removeUnknownProperties(
  target: Record<string, unknown>,
  defaultObj: Record<string, unknown>,
  ignorePaths: string[] = []
): Record<string, unknown> {
  if (typeof target !== "object" || !target) {
    target = {};
  }

  const removalsToDo = [{ target, defaultObj, parentPath: "" }];

  function removeUnknown(
    currentTarget: Record<string, unknown>,
    currentSource: Record<string, unknown>,
    parentPath = ""
  ) {
    const propStack = Object.getOwnPropertyNames(currentTarget);
    let prop = propStack.shift();

    while (prop) {
      const propPath = `${parentPath ? `${parentPath}.` : ""}${prop}`;
      const isIgnoredPath = ignorePaths.includes(propPath);

      if (!Object.hasOwnProperty.call(currentSource, prop) && !isIgnoredPath) {
        delete currentTarget[prop];
      } else if (isObject(currentTarget[prop]) && isObject(currentSource[prop]) && !isIgnoredPath) {
        removalsToDo.push({
          target: currentTarget[prop] as Record<string, unknown>,
          defaultObj: currentSource[prop] as Record<string, unknown>,
          parentPath: propPath,
        });
      }

      prop = propStack.shift();
    }
  }

  let removalInstruction = removalsToDo.shift();
  while (removalInstruction) {
    removeUnknown(
      removalInstruction.target,
      removalInstruction.defaultObj,
      removalInstruction.parentPath
    );
    removalInstruction = removalsToDo.shift();
  }

  return target;
}

export function arrayDiff<
  SourceT extends Record<string, any> | string,
  TargetT extends Record<string, any> | string
>(
  source: SourceT[],
  target: TargetT[],
  getSourceKey: (keyof SourceT & string) | ((item: SourceT) => (keyof SourceT & string) | string),
  getTargetKey: (keyof TargetT & string) | ((item: TargetT) => (keyof TargetT & string) | string)
): { removed: SourceT[]; kept: SourceT[]; added: TargetT[] } {
  const removed: SourceT[] = [];
  const kept: SourceT[] = [];
  const added: TargetT[] = [...target];

  const sourceKey = (s: SourceT) =>
    typeof getSourceKey === "function" ? getSourceKey(s) : s[getSourceKey];
  const targetKey = (t: TargetT) =>
    typeof getTargetKey === "function" ? getTargetKey(t) : t[getTargetKey];

  for (const oldItem of source) {
    const idxInAdded = added.findIndex((s) => targetKey(s) === sourceKey(oldItem));
    if (idxInAdded === -1) {
      removed.push(oldItem);
    } else {
      kept.push(oldItem);
      added.splice(idxInAdded, 1);
    }
  }

  return {
    removed,
    kept,
    added,
  };
}

export function isArrayEq<
  SourceT extends Record<string, any> | string,
  TargetT extends Record<string, any> | string
>(
  source: SourceT[],
  target: TargetT[],
  getSourceKey: (keyof SourceT & string) | ((item: SourceT) => (keyof SourceT & string) | string),
  getTargetKey: (keyof TargetT & string) | ((item: TargetT) => (keyof TargetT & string) | string)
): boolean {
  if (source.length !== target.length) {
    return false;
  }

  const sourceKey = (s: SourceT) =>
    typeof getSourceKey === "function" ? getSourceKey(s) : s[getSourceKey];
  const targetKey = (t: TargetT) =>
    typeof getTargetKey === "function" ? getTargetKey(t) : t[getTargetKey];

  return source.every(
    (oldItem) => !!target.find((newItem) => sourceKey(oldItem) === targetKey(newItem))
  );
}

export function filterInvalidAliases(aliases: string[]): string[] {
  return aliases.filter((alias) => !!alias.trim());
}

/**
 * Reads the first n bytes of the file into a buffer
 * https://stackoverflow.com/a/59722384/13599482
 *
 * @param filepath - path to the file to read
 * @param n - how many bytes to read
 */
export async function readFirstNBytes(filepath: PathLike, n: number): Promise<Buffer | null> {
  try {
    const chunks: Uint8Array[] = [];
    for await (const chunk of createReadStream(filepath, { start: 0, end: n })) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (err) {
    handleError(`Could not read first bytes of file ${filepath.toString()}`, err);
    return null;
  }
}
