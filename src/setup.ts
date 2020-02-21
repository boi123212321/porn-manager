import { defaultConfig, IConfig } from "./config/index";
import inquirer from "inquirer";
import { getFFMpegURL, getFFProbeURL, downloadFile } from "./ffmpeg-download";
const sha = require("js-sha512").sha512;
import * as path from "path";
import { existsAsync } from "./fs/async";
import * as logger from "./logger";
import { chmodSync } from "fs";

export default async () => {
  const { downloadFFMPEG } = await inquirer.prompt([
    {
      type: "confirm",
      name: "downloadFFMPEG",
      message: "Download FFMPEG binaries?",
      default: true
    }
  ]);

  const { usePassword } = await inquirer.prompt([
    {
      type: "confirm",
      name: "usePassword",
      message: "Set a password (protect server in LAN)?",
      default: true
    }
  ]);

  let password;

  if (usePassword) {
    password = (
      await inquirer.prompt([
        {
          type: "password",
          name: "password",
          message: "Enter a password"
        }
      ])
    ).password;

    let confirmPassword;

    do {
      confirmPassword = (
        await inquirer.prompt([
          {
            type: "password",
            name: "password",
            message: "Confirm password"
          }
        ])
      ).password;
    } while (password != confirmPassword);
  }

  const { useVideoFolders } = await inquirer.prompt([
    {
      type: "confirm",
      name: "useVideoFolders",
      message:
        "Do you have one or more folders you want to import VIDEOS from?",
      default: true
    }
  ]);

  const videoFolders = [] as string[];

  if (useVideoFolders) {
    let path;

    do {
      path = (
        await inquirer.prompt([
          {
            type: "input",
            name: "path",
            message: "Enter folder name (enter 'done' when done)",
            default: "done"
          }
        ])
      ).path;

      if (path != "done") {
        if (await existsAsync(path)) videoFolders.push(path);
        else logger.error(`Could not find ${path}`);
      }
    } while (path != "done");
  }

  const { useImageFolders } = await inquirer.prompt([
    {
      type: "confirm",
      name: "useImageFolders",
      message:
        "Do you have one or more folders you want to import IMAGES from?",
      default: true
    }
  ]);

  const imageFolders = [] as string[];

  if (useImageFolders) {
    let path;

    do {
      path = (
        await inquirer.prompt([
          {
            type: "input",
            name: "path",
            message: "Enter folder name (enter 'done' when done)",
            default: "done"
          }
        ])
      ).path;

      if (path != "done") {
        if (await existsAsync(path)) imageFolders.push(path);
        else logger.error(`Could not find ${path}`);
      }
    } while (path != "done");
  }

  let config = JSON.parse(JSON.stringify(defaultConfig)) as IConfig;

  if (downloadFFMPEG) {
    const ffmpegURL = getFFMpegURL();
    const ffprobeURL = getFFProbeURL();

    const ffmpegPath = path.basename(ffmpegURL);
    const ffprobePath = path.basename(ffprobeURL);

    await downloadFile(ffmpegURL, ffmpegPath);
    await downloadFile(ffprobeURL, ffprobePath);

    try {
      logger.log("CHMOD binaries...");
      chmodSync(ffmpegPath, "111");
      chmodSync(ffprobePath, "111");
    } catch (error) {
      logger.error("Could not make FFMPEG binaries executable");
    }

    config.FFMPEG_PATH = path.resolve(ffmpegPath);
    config.FFPROBE_PATH = path.resolve(ffprobePath);
  }

  if (usePassword) config.PASSWORD = sha(password);

  if (useVideoFolders) config.VIDEO_PATHS = videoFolders;

  if (useImageFolders) config.IMAGE_PATHS = imageFolders;

  return config;
};
