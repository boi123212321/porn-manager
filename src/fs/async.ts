import { exists, stat, unlink, readdir, readFile, writeFile } from "fs";
import { promisify } from "util";
import { join, extname } from "path";

export const existsAsync = promisify(exists);
export const statAsync = promisify(stat);
export const unlinkAsync = promisify(unlink);
export const readdirAsync = promisify(readdir);
export const readFileAsync = promisify(readFile);
export const writeFileAsync = promisify(writeFile);

export async function walk(dir: string, exts = [] as string[]) {
  let files = await readdirAsync(dir);
  // @ts-ignore
  files = await Promise.all(
    files.map(async file => {
      const filePath = join(dir, file);
      const stats = await statAsync(filePath);
      if (stats.isDirectory()) return walk(filePath);
      else if (stats.isFile()) return filePath;
    })
  );

  return files
  // @ts-ignore
    .reduce((all, folderContents) => all.concat(folderContents), [])
    .filter(file => exts.includes(extname(file)));
}
