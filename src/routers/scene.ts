import { Request, Response, Router } from "express";
import ffmpeg from "fluent-ffmpeg";
import path from "path";

import { sceneCollection } from "../database";
import { CopyMP4Transcoder } from "../transcode/copyMp4";
import { MP4Transcoder } from "../transcode/mp4";
import { SceneStreamTypes, TranscodeOptions } from "../transcode/transcoder";
import { WebmTranscoder } from "../transcode/webm";
import Scene from "../types/scene";
import { handleError, logger } from "../utils/logger";

function streamTranscode(
  scene: Scene & { path: string },
  req: Request,
  res: Response,
  options: TranscodeOptions
): void {
  res.writeHead(200, {
    "Accept-Ranges": "bytes",
    Connection: "keep-alive",
    "Transfer-Encoding": "chunked",
    "Content-Disposition": "inline",
    "Content-Transfer-Enconding": "binary",
    "Content-Type": options.mimeType,
  });

  const startQuery = (req.query as { start?: string }).start || "0";
  const startSeconds = Number.parseFloat(startQuery);
  if (Number.isNaN(startSeconds)) {
    res.status(400).send(`Could not parse start query as number: ${startQuery}`);
    return;
  }

  options.inputOptions.unshift(`-ss ${startSeconds}`);

  // Time out the request after 2mn to prevent accumulating
  // too many ffmpeg processes. After that, the user should reload the page
  req.setTimeout(2 * 60 * 1000);

  let command: ffmpeg.FfmpegCommand | null = null;

  command = ffmpeg(scene.path)
    .inputOptions(options.inputOptions)
    .outputOptions(options.outputOptions)
    .on("start", (commandLine: string) => {
      logger.verbose(`Spawned Ffmpeg with command: ${commandLine}`);
    })
    .on("end", () => {
      logger.verbose(`Scene "${scene.path}" has been converted successfully`);
    })
    .on("error", (err) => {
      handleError(
        `Request finished or an error happened while transcoding scene "${scene.path}"`,
        err
      );
    });

  res.on("close", () => {
    logger.verbose("Stream request closed, killing transcode");
    command?.kill("SIGKILL");
  });

  command.pipe(res, { end: true });
}

function streamDirect(scene: Scene & { path: string }, _: Request, res: Response): Response | void {
  const resolved = path.resolve(scene.path);
  return res.sendFile(resolved);
}

const router = Router();

router.get("/:scene", async (req, res, next) => {
  const sc = await Scene.getById(req.params.scene);
  if (!sc || !sc.path) {
    return next(404);
  }
  const scene = sc as Scene & { path: string };

  const streamType = (req.query as { type?: SceneStreamTypes }).type;

  if (!streamType || streamType === SceneStreamTypes.DIRECT) {
    return streamDirect(scene, req, res);
  }

  try {
    if (!scene.meta.container || !scene.meta.videoCodec || !scene.meta.bitrate) {
      logger.verbose(
        `Scene ${scene._id} doesn't have codec information to determine supported transcodes, running ffprobe`
      );
      await Scene.runFFProbe(scene);

      // Doesn't matter if this fails
      await sceneCollection.upsert(scene._id, scene).catch((err) => {
        handleError("Failed to update scene after updating codec information", err);
      });
    }
  } catch (err) {
    handleError("Error getting video codecs for transcode", err);
    return res.status(500).send("Could not determine video codecs for transcoding");
  }

  const TranscoderClass = {
    [SceneStreamTypes.MP4_DIRECT]: CopyMP4Transcoder,
    [SceneStreamTypes.MP4_TRANSCODE]: MP4Transcoder,
    [SceneStreamTypes.WEBM_TRANSCODE]: WebmTranscoder,
  }[streamType];
  if (!TranscoderClass) {
    return res.sendStatus(400);
  }
  const transcoder = new TranscoderClass(scene);

  const validateRes = transcoder.validateRequirements();
  if (validateRes !== true) {
    return res.status(400).send(validateRes.message);
  }

  const transcodeOpts = transcoder.getTranscodeOptions();
  return streamTranscode(scene, req, res, transcodeOpts);
});

export default router;
