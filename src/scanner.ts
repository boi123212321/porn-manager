import { checkImageFolders, checkVideoFolders } from "./queue/check";
import { tryStartProcessing } from "./queue/processing";
import { handleError, logger } from "./utils/logger";

export let nextScanTimestamp = null as number | null;
let nextScanTimeout: NodeJS.Timeout | null = null;
export let isScanning = false;

/**
 * Triggers a scan (if none is currently running), then schedules the next one if
 * `nextScanMs` is given
 *
 * @param nextScanMs - after this scan *A*, in how long another scan *B* should be executed.
 * If a scan *C* was previously scheduled, will cancel it in favour of *B*.
 * If falsy, will leave *C* untouched and not schedule *B*
 */
export async function scanFolders(nextScanMs = 0): Promise<void> {
  if (isScanning) {
    logger.debug("Aborting scan: already scanning");
    return;
  }

  // If we will be scheduling another scan after this one, cancel
  // the existing scheduled one
  if (nextScanMs && nextScanTimeout) {
    clearTimeout(nextScanTimeout);
  }

  try {
    logger.info("Scanning folders");
    isScanning = true;

    logger.verbose("Scanning video folders");
    await checkVideoFolders().catch((err: Error) => {
      handleError("Error while scanning video folders...", err);
    });
    logger.info("Video scan done.");

    // Start processing as soon as video scan is done
    logger.verbose("Starting processing worker");
    tryStartProcessing().catch((err: Error) => {
      handleError("Couldn't start processing: ", err);
    });

    await checkImageFolders().catch((err: Error) => {
      handleError("Error while scanning image folders: ", err);
    });
    isScanning = false;
  } catch (err) {
    handleError("Scan failed: ", err);
  }

  // Always try to schedule a scan after the current one ends
  scheduleNextScan(nextScanMs);
}

/**
 * Schedules a scan for later on. Passes the delay to `scanFolders`
 * so that the scan will trigger another one after itself.
 *
 * @param nextScanMs - in how long to schedule a scan starting from now,
 * and how long after each subsequent scan
 */
export function scheduleNextScan(nextScanMs: number): void {
  if (!nextScanMs) {
    return;
  }

  const nextScanDate = new Date(Date.now() + nextScanMs);
  nextScanTimestamp = nextScanDate.valueOf();
  logger.warn(`Next scan at ${nextScanDate.toLocaleString()}`);

  nextScanTimeout = global.setTimeout(() => {
    scanFolders(nextScanMs).catch((err: Error) => {
      handleError("Scan failed: ", err);
    });
  }, nextScanMs);
}
