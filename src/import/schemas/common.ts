import { Dictionary } from "../../types/utility";

export const isString = (i: unknown): i is string => typeof i === "string";

export function validCustomFields<T extends Dictionary<unknown>>(obj?: T | null): boolean {
  if (!obj) return true;
  return Object.values(obj).every(isString);
}

export function stringArray(
  required: boolean
): {
  required: boolean;
  type: ArrayConstructor;
  each: {
    type: StringConstructor;
  };
} {
  return {
    required,
    type: Array,
    each: { type: String },
  };
}

export function limitRating(i?: number | null): boolean {
  if (!i) return true;
  return i >= 0 && i <= 10;
}

export const isValidDate = (i?: number | null): boolean => {
  if (!i) return true;
  if (i < 0) return false;
  const d = new Date(i);
  return d instanceof Date && !isNaN(<number>(<unknown>d));
};
