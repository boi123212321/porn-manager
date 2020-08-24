import v8 from "v8";

import * as logger from "./logger";

export function printMaxMemory(): void {
  logger.message(
    `Max. memory: ${Math.round(v8.getHeapStatistics().total_available_size / 1024 / 1024)} MB`
  );
}
