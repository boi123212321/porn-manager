import { Router } from "express";
import { Stats } from "fs";
import { basename, dirname, resolve } from "path";

import { readdirAsync, statAsync } from "../utils/fs/async";
import { logger } from "../utils/logger";

const router = Router();

interface FileDTO {
  name: string;
  path: string;
  size: number;
  createdOn: number;
  dir: boolean;
}

interface FolderDTO {
  name: string;
  path: string;
  size: number;
  createdOn: number;
  files: FileDTO[];
  parentFolder: string;
  hasParentFolder: boolean;
}

router.get("/directory", async (req, res) => {
  let path = resolve(String(req.query.path || process.cwd()));
  let validDirectory = false;

  let stats: Stats | null = null;
  const files: FileDTO[] = [];
  let entries: string[] = [];

  while (!validDirectory) {
    try {
      stats = await statAsync(path);
      entries = await readdirAsync(path);
      validDirectory = true;
    } catch (err) {
      validDirectory = false;
      path = dirname(path);
    }
  }

  for (const entry of entries) {
    try {
      const filePath = resolve(path, entry);
      const entryStats = await statAsync(filePath);
      files.push({
        name: entry,
        path: filePath,
        size: entryStats.size,
        createdOn: entryStats.mtime.valueOf(),
        dir: entryStats.isDirectory(),
      });
    } catch (err) {
      logger.warn(`Could not stat entry ${entry} for directory list`);
    }
  }

  files.sort((a, b) => {
    if (a.dir === b.dir) {
      return a.name.localeCompare(b.name);
    }
    return a.dir ? -1 : 1;
  });

  const parentFolder = resolve(path, "..");

  const folder: FolderDTO = {
    name: basename(path),
    path,
    size: stats?.size || 0,
    createdOn: stats?.mtime.valueOf() || 0,
    files,
    parentFolder,
    hasParentFolder: path !== parentFolder,
  };

  res.json(folder);
});

export default router;
