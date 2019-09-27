import Vue from "vue";
import path from "path";
import fs from "fs";

import ActorsModule from "@/store_modules/actors";
import GlobalsModule from "@/store_modules/globals";
import ImagesModule from "@/store_modules/images";
import VideosModule from "@/store_modules/videos";

import Video from "@/classes/video";
import Actor from "@/classes/actor";
import Image from "@/classes/image";

let exportTimeout: NodeJS.Timeout | null = null;

export async function exportToDisk(timeout?: number): Promise<void> {
  return new Promise(async (resolve, reject) => {

    if (exportTimeout !== null)
      clearTimeout(exportTimeout);

    exportTimeout = setTimeout(() => {
      try {
        const cwd = process.cwd();
        const libraryPath = path.resolve(cwd, "library/");

        if (!fs.existsSync(libraryPath))
          fs.mkdirSync(libraryPath);

        const videoPath = path.resolve(libraryPath, "videos.json");
        fs.writeFileSync(videoPath, JSON.stringify(VideosModule.getAll), "utf-8");

        const actorPath = path.resolve(libraryPath, "actors.json");
        fs.writeFileSync(actorPath, JSON.stringify(ActorsModule.getAll), "utf-8");

        const imagePath = path.resolve(libraryPath, "images.json");
        fs.writeFileSync(imagePath, JSON.stringify(ImagesModule.getAll), "utf-8");

        const settingsPath = path.resolve(libraryPath, "settings.json");
        fs.writeFileSync(settingsPath, JSON.stringify({
          copyThumbnails: GlobalsModule.copyThumbnails,
          thumbnailsOnImportInterval: GlobalsModule.thumbnailsOnImportInterval,
          ffmpegPath: GlobalsModule.ffmpegPath,
          ffprobePath: GlobalsModule.ffprobePath,
          theme: GlobalsModule.theme,
          customFields: GlobalsModule.customFields
        }), "utf-8");

        console.log("Saved to disk.");

        resolve();
      }
      catch (err) {
        reject(err);
      }
    }, timeout || 2000);
  })
}

export function loadFromDisk(): Promise<void> {
  return new Promise((resolve, reject) => {
    const cwd = process.cwd();
    const libraryPath = path.resolve(cwd, "library/");

    if (fs.existsSync(libraryPath)) {
      const videoPath = path.resolve(libraryPath, "videos.json");
      const actorPath = path.resolve(libraryPath, "actors.json");
      const imagePath = path.resolve(libraryPath, "images.json");
      const settingsPath = path.resolve(libraryPath, "settings.json");

      if (fs.existsSync(videoPath)) {
        let fileContent = fs.readFileSync(videoPath, "utf-8");

        if (fileContent) {
          var videos = JSON.parse(fileContent);
          if (videos && Array.isArray(videos)) {
            VideosModule.set(
              videos.map((o: any) => Object.assign(new Video(), o))
            );
          }
        }
        else {
          VideosModule.set([]);
        }
      }

      if (fs.existsSync(actorPath)) {
        let fileContent = fs.readFileSync(actorPath, "utf-8");

        if (fileContent) {
          const actors = JSON.parse(fileContent);
          if (actors && Array.isArray(actors)) {
            ActorsModule.set(
              actors.map((o: any) => Object.assign(new Actor(), o))
            );
          }
        }
        else {
          ActorsModule.set([]);
        }
      }

      if (fs.existsSync(imagePath)) {
        let fileContent = fs.readFileSync(imagePath, "utf-8");

        if (fileContent) {
          const images = JSON.parse(fileContent);
          if (images && Array.isArray(images)) {
            ImagesModule.set(

              images.map((o: any) => Object.assign(new Image(), o))
            );
          }
        }
        else {
          ImagesModule.set([]);
        }
      }

      if (fs.existsSync(settingsPath)) {
        let fileContent = fs.readFileSync(settingsPath, "utf-8");

        if (fileContent) {
          const settings = JSON.parse(fileContent);
          if (settings) {
            GlobalsModule.set(settings);
          }
        }
      }
    } else {
      exportToDisk();
    }

    resolve();
  })
}