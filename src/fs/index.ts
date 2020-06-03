import { lstatSync } from "fs";

export const isDirectory = (path: string): boolean => lstatSync(path).isDirectory();
