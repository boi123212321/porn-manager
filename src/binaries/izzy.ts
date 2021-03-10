import Axios from "axios";
import { ChildProcess, spawn } from "child_process";
import { chmodSync, existsSync } from "fs";
import { arch, type } from "os";
import semver from "semver";

import { getConfig } from "../config";
import { downloadFile } from "../utils/download";
import { unlinkAsync } from "../utils/fs/async";
import { handleError, logger } from "../utils/logger";
import { configPath } from "../utils/path";

export let izzyProcess!: ChildProcess;

export const izzyPath = configPath(type() === "Windows_NT" ? "izzy.exe" : "izzy");

export async function deleteIzzy(): Promise<void> {
  logger.verbose("Deleting izzy");
  await unlinkAsync(izzyPath);
}

export async function resetIzzy(): Promise<void> {
  try {
    logger.verbose("Resetting izzy");
    await Axios.delete(`http://localhost:${getConfig().binaries.izzyPort}/collection`);
  } catch (error) {
    handleError(`Error while resetting izzy`, error);
    throw error;
  }
}

export const minIzzyVersion = "0.3.0";

export function exitIzzy() {
  logger.verbose("Closing izzy");
  return Axios.post(`http://localhost:${getConfig().binaries.izzyPort}/exit`);
}

export async function izzyHasMinVersion(): Promise<boolean> {
  const version = await izzyVersion();
  if (!version) {
    return false;
  }
  return semver.gte(version, minIzzyVersion);
}

export async function izzyVersion(): Promise<string | null> {
  try {
    logger.debug("Getting izzy version");
    const res = await Axios.get<{ version: string }>(
      `http://localhost:${getConfig().binaries.izzyPort}/`
    );
    return res.data.version;
  } catch {
    return null;
  }
}

interface IGithubAsset {
  // eslint-disable-next-line camelcase
  browser_download_url: string;
  name: string;
}

async function downloadIzzy() {
  logger.verbose("Fetching Izzy releases...");
  const releaseUrl = `https://api.github.com/repos/boi123212321/izzy/releases/latest`;

  const releaseInfo = (
    await Axios.get<{
      id: string;
    }>(releaseUrl)
  ).data;
  const releaseId = releaseInfo.id;

  const assetsUrl = `https://api.github.com/repos/boi123212321/izzy/releases/${releaseId}/assets`;

  const assets = (await Axios.get(assetsUrl)).data as IGithubAsset[];

  const downloadName = {
    Windows_NT: "izzy.exe",
    Linux: "izzy_linux",
    Darwin: "izzy_mac",
  }[type()] as string;

  if (arch() !== "x64") {
    throw new Error(`Unsupported architecture ${arch()}`);
  }

  const asset = assets.find((as) => as.name === downloadName);

  if (!asset) {
    throw new Error(`Izzy release not found: ${downloadName} for ${type()}`);
  }

  // eslint-disable-next-line camelcase
  await downloadFile(asset.browser_download_url, izzyPath);
}

export async function ensureIzzyExists(): Promise<0 | 1> {
  if (existsSync(izzyPath)) {
    logger.debug("Izzy binary found");
    return 0;
  } else {
    logger.info("Downloading latest Izzy (database) binary...");
    await downloadIzzy();
    return 1;
  }
}

export function spawnIzzy(): Promise<void> {
  return new Promise((resolve, reject) => {
    logger.debug("CHMOD Izzy...");
    chmodSync(izzyPath, "111");

    const port = getConfig().binaries.izzyPort;

    logger.debug(`Spawning Izzy on port ${port}`);

    izzyProcess = spawn(izzyPath, ["--port", port.toString()], {
      detached: true,
      stdio: "ignore",
    });

    izzyProcess
      .on("error", (err: Error) => {
        reject(err);
      })
      .on("exit", (code: number) => {
        logger.error(`Izzy exited with code ${code}, will exit`);
        process.exit(1);
      });

    izzyProcess.unref();
    setTimeout(resolve, 2500);
  });
}
