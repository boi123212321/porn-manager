import { appendFileSync, existsSync } from "fs";
import { basename, extname, resolve } from "path";
import YAML from "yaml";

import args from "../args";
import { getConfig } from "../config";
import { readFileAsync, walk } from "../fs/async";
import * as logger from "../logger";
import { libraryPath } from "../types/utility";
import { createFromFileData } from "./create";
import { validateImportFile } from "./validate";
import { verifyFileData } from "./verify";

// Previously imported files
let imported: string[] = [];

async function processFile(file: string) {
  let parsed = null as unknown;
  const fileContent = await readFileAsync(file, "utf-8");

  if (extname(file) === ".json") {
    try {
      parsed = JSON.parse(fileContent);
    } catch (error) {
      logger.error(`Broken import file: ${file}`);
      process.exit(1);
    }
  } else if (extname(file) === ".yaml" || extname(file) === ".yml") {
    try {
      parsed = YAML.parse(fileContent);
    } catch (error) {
      logger.error(`Broken import file: ${file}`);
      process.exit(1);
    }
  } else throw new Error(`Unsupported file type '${extname(file)}'.`);

  if (typeof parsed !== "object" || parsed === null)
    throw new Error(`${file}: Invalid import format.`);

  const errors = validateImportFile(JSON.parse(JSON.stringify(parsed)));
  if (errors.length) {
    logger.error(`Invalid structure of file: ${file}`);
    logger.error(errors);
    process.exit(1);
  }

  try {
    await verifyFileData(parsed);
  } catch (error) {
    logger.error(error.message);
    process.exit(1);
  }
  await createFromFileData(parsed);
}

export async function checkImportFolders(): Promise<void> {
  logger.log("Checking imports...");

  const config = getConfig();
  const importedFile = libraryPath("imported.txt");

  try {
    if (existsSync(importedFile))
      imported = (await readFileAsync(importedFile, "utf-8")).split("\n");
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }

  // Files to process
  const newFiles = [] as string[];

  if (config.EXCLUDE_FILES.length)
    logger.log(`Will ignore files: ${JSON.stringify(config.EXCLUDE_FILES)}`);

  for (const folder of config.BULK_IMPORT_PATHS) {
    const _path = resolve(folder);
    logger.log("Scanning import folder: " + _path);
    if (!existsSync(_path)) {
      logger.warn("Could not find import folder: " + _path);
      continue;
    }
    logger.log(`Checking import folder: ${_path}...`);

    await walk({
      dir: _path,
      extensions: [".json", ".yaml"],
      exclude: [],
      cb: (path) => {
        if (basename(path).startsWith(".")) return;
        if (imported.includes(path)) return;
        newFiles.push(path);
        imported.push(path);
      },
    });
  }

  if (newFiles.length) {
    logger.message(`Importing ${newFiles.length} new import files...`);

    for (const file of newFiles) {
      logger.log(`Reading import file: ${file}...`);
      try {
        await processFile(file);
        logger.message("Imported " + file);
        if (args["commit-import"]) appendFileSync(importedFile, file + "\n");
      } catch (err) {
        logger.error(`${file}: could not read file.`);
        logger.error(err.message);
        process.exit(1);
      }
    }
  }
}
