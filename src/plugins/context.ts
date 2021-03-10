import axios from "axios";
import boxen from "boxen";
import cheerio from "cheerio";
import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import inquirer from "inquirer";
import jimp from "jimp";
import moment from "moment";
import ora from "ora";
import * as os from "os";
import * as nodepath from "path";
import readline from "readline";
import semver from "semver";
import * as util from "util";
import YAML from "yaml";
import * as zod from "zod";

import Image from "../types/image";
import { downloadFile } from "../utils/download";
import { logger } from "../utils/logger";
import { libraryPath } from "../utils/path";
import { extensionFromUrl } from "../utils/string";

export const modules = {
  $loader: ora,
  $boxen: boxen,
  $semver: semver,
  $os: os,
  $readline: readline,
  $inquirer: inquirer,
  $yaml: YAML,
  $jimp: jimp,
  $ffmpeg: ffmpeg,
  $fs: fs,
  $path: nodepath,
  $util: util,
  $axios: axios,
  $cheerio: cheerio,
  $moment: moment,
  $zod: zod,
};

export async function createLocalImage(
  path: string,
  name: string,
  thumbnail?: boolean
): Promise<Image> {
  path = nodepath.resolve(path);
  let img = await Image.getByPath(path);

  if (img) {
    return img;
  }

  logger.verbose(`Creating image from ${path}`);
  img = new Image(thumbnail ? `${name} (thumbnail)` : name);
  img.path = path;
  logger.verbose(`Created image ${img._id}`);

  return img;
}

export async function createImage(url: string, name: string, thumbnail?: boolean): Promise<Image> {
  logger.verbose(`Creating image from ${url}`);

  const img = new Image(name);
  if (thumbnail) {
    img.name += " (thumbnail)";
  }
  const ext = extensionFromUrl(url);
  const path = libraryPath(`images/${img._id}${ext}`);
  await downloadFile(url, path);
  img.path = path;
  logger.verbose(`Created image ${img._id}`);

  return img;
}
