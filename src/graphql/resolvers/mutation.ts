import { database } from "../../database";
import Actor from "../../types/actor";
import Label from "../../types/label";
import { ReadStream, createWriteStream, statSync } from "fs";
import { extname } from "path";
import Scene from "../../types/scene";
import ffmpeg from "fluent-ffmpeg";
import * as logger from "../../logger";

interface HashMap<T> {
  [key: string]: T;
}

type AnyMap = HashMap<any>;

export default {
  async uploadScene(parent, args: AnyMap) {
    const { filename, mimetype, createReadStream } = await args.file;
    const ext = extname(filename);

    // !TODO check mimetype
    // !TODO check if ffmpeg/ffprobe exist

    const scene = new Scene(filename.split(".")[0]);
    const path = `./library/scenes/${scene.id}${ext}`;
    scene.path = path;

    const read = createReadStream() as ReadStream;
    const write = createWriteStream(path);

    const pipe = read.pipe(write);

    await new Promise((resolve, reject) => {
      pipe.on("close", () => resolve());
    });

    // File written, now process
    logger.SUCCESS(`SUCCESS: File written to ${path}`);

    await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(path, (err, data) => {
        const meta = data.streams[0];
        const { size } = statSync(path);

        if (meta) {
          scene.meta.dimensions = {
            width: meta.width,
            height: meta.height,
          }
          scene.meta.duration = parseInt(meta.duration);
        }
        else {
          logger.WARN("WARN: Could not get video meta data.");
        }

        scene.meta.size = size;
        resolve();
      })
    })

    const thumbnailFiles = await scene.generateThumbnails();

    for(const file of thumbnailFiles) {
      // !TODO create image in library
    }

    if (args.actors) {
      scene.actors = args.actors;
    }

    database
      .get('scenes')
      .push(scene)
      .write();

    // Done

    return scene;
  },
  addActor(parent, args: AnyMap) {
    const actor = new Actor(args.name, args.aliases)

    database
      .get('actors')
      .push(actor)
      .write();

    return actor;
  },
  addLabel(parent, args: AnyMap) {
    const label = new Label(args.name, args.aliases);

    database
      .get("labels")
      .push(label)
      .write();

    return label;
  },
}