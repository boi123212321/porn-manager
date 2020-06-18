import { spawn } from "child_process";

import { processingCollection } from "../database/index";
import * as logger from "../logger";
import { getConfig } from "../config";

export interface ISceneProcessingItem {
  _id: string;
}

let processing = false;

export function setProcessingStatus(value: boolean) {
  processing = value;
}

export function isProcessing() {
  return processing;
}

export function removeSceneFromQueue(_id: string) {
  logger.log(`Removing ${_id} from processing queue...`);
  return processingCollection.remove(_id);
}

export function getLength(): Promise<number> {
  return processingCollection.count();
}

export async function getHead(): Promise<ISceneProcessingItem | null> {
  const items = await processingCollection.getAll();
  return items[0] || null;
}

export function enqueueScene(_id: string) {
  return processingCollection.upsert(_id, { _id });
}

export async function tryStartProcessing() {
  const config = getConfig();
  if (!config.DO_PROCESSING) return;

  const queueLen = await getLength();
  if (queueLen > 0 && !isProcessing()) {
    logger.message("Starting processing worker...");
    setProcessingStatus(true);
    spawn(process.argv[0], process.argv.slice(1).concat(["--process-queue"]), {
      cwd: process.cwd(),
      detached: false,
      stdio: "inherit",
    }).on("exit", (code) => {
      logger.warn(`Processing process exited with code ${code}`);
      setProcessingStatus(false);
    });
  } else if (!queueLen) {
    logger.success("No more videos to process.");
  }
}
