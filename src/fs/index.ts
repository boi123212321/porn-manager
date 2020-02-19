import { lstatSync } from "fs";

export const isDirectory = (path: string) => lstatSync(path).isDirectory();
