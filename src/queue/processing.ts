import { spawn } from "child_process";

import { getConfig } from "../config";
import { processingCollection } from "../database";
import { logger } from "../utils/logger";

export interface ISceneProcessingItem {
  _id: string;
}

let processing = false;

export function setProcessingStatus(value: boolean): void {
  processing = value;
}

export function isProcessing(): boolean {
  return processing;
}

export function removeSceneFromQueue(_id: string): Promise<ISceneProcessingItem> {
  logger.verbose(`Removing ${_id} from processing queue...`);
  return processingCollection.remove(_id);
}

export function getLength(): Promise<number> {
  return processingCollection.count();
}

export async function getHead(): Promise<ISceneProcessingItem | null> {
  logger.verbose("Getting queue head");
  const item = await processingCollection.getHead();
  return item;
}

export function enqueueScene(_id: string): Promise<ISceneProcessingItem> {
  logger.verbose(`Adding scene "${_id}" to processing queue`);
  return processingCollection.upsert(_id, { _id });
}

export async function tryStartProcessing(): Promise<void> {
  const config = getConfig();
  if (!config.processing.doProcessing) {
    return;
  }

  const queueLen = await getLength();
  if (queueLen > 0 && !isProcessing()) {
    logger.info("Starting processing worker...");
    setProcessingStatus(true);
    spawn(process.argv[0], process.argv.slice(1).concat(["--process-queue"]), {
      cwd: process.cwd(),
      detached: false,
      stdio: "inherit",
    }).on("exit", (code) => {
      logger.info(`Processing process exited with code ${code}`);
      setProcessingStatus(false);
    });
  } else if (!queueLen) {
    logger.info("No more videos to process.");
  }
}
