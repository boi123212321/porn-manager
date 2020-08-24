import { existsSync, mkdirSync } from "fs";
import { join } from "path";

import { copyFileAsync, readdirAsync, rimrafAsync } from "./fs/async";
import * as log from "./logger";
import { libraryPath, mapAsync } from "./types/utility";

async function checkBackupMax(amount = 10) {
  const backups = await readdirAsync("backups");
  backups.sort();
  if (backups.length >= amount) {
    const oldestBackup = join("backups", backups[0]);
    log.log("Removing oldest backup: " + oldestBackup + "...");
    await rimrafAsync(oldestBackup);
  }
}

export async function createBackup(amount = 10): Promise<void> {
  const foldername = join("backups", new Date().valueOf().toString(36));
  mkdirSync(foldername);
  log.warn("Creating backup in " + foldername + "...");

  const files = [
    "actors.db",
    "images.db",
    "labels.db",
    "movies.db",
    "studios.db",
    "scenes.db",
    "markers.db",
    "actor_references.db",
    "marker_references.db",
    "movie_scenes.db",
    "labelled_items.db",
    "custom_fields.db",
    "scene_views.db",
  ];

  try {
    const transfers = await mapAsync(files, (file) => {
      return {
        from: libraryPath(file),
        to: join(foldername, file),
      };
    });

    for (const transfer of transfers) {
      if (!existsSync(transfer.from)) return;

      log.log(`Backup: ${transfer.from} -> ${transfer.to}...`);

      try {
        await copyFileAsync(transfer.from, transfer.to);
      } catch (error) {
        log.error(error);
        log.warn(`Couldn't back up ${transfer.from} to ${transfer.to}.`);
      }
    }

    await checkBackupMax(amount);
    log.success("Backup done.");
  } catch (err) {
    log.error(err);
  }
}
