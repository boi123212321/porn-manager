import { existsSync, mkdir } from "fs";
import { resolve } from "path";
import { promisify } from "util";

import { rimrafAsync } from "../src/fs/async";

// Assume these work perfectly
export const mkdirAsync = promisify(mkdir);

export const TEST_TEMP_DIR = resolve(process.cwd(), "temp");

export async function createTempTestingDir() {
  if (!existsSync(TEST_TEMP_DIR)) {
    await mkdirAsync(TEST_TEMP_DIR);
  }
}

export async function unlinkTempTestingDir() {
  if (existsSync(TEST_TEMP_DIR)) {
    await rimrafAsync(TEST_TEMP_DIR);
  }
}
