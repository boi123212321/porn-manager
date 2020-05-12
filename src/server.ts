import express from "express";
import * as logger from "./logger";
import Image from "./types/image";
import Scene from "./types/scene";
import * as path from "path";
import { checkPassword, passwordHandler } from "./password";
import { getConfig, watchConfig } from "./config/index";
import {
  loadStores,
  actorCollection,
  imageCollection,
  sceneCollection,
} from "./database/index";
import { existsAsync } from "./fs/async";
import { createBackup } from "./backup";
import BROKEN_IMAGE from "./broken_image";
import { mountApolloServer } from "./apollo";
import { buildIndices, twigsVersion } from "./search";
import { checkImportFolders } from "./import/index";
import cors from "./middlewares/cors";
import { spawnTwigs } from "./twigs";
import { httpLog } from "./logger";
import { renderHandlebars } from "./render";
import { dvdRenderer } from "./dvd_renderer";
import queueRouter from "./queue_router";
import { clearSceneIndex } from "./search/scene";
import { clearImageIndex } from "./search/image";
import { spawnIzzy, izzyVersion, resetIzzy } from "./izzy";
import https from "https";
import { readFileSync } from "fs";
import {
  destroyImporter,
  processLibrary,
  scheduleManualScan,
  scanFolders,
  getIsManualScanningLibrary,
} from "./queue/importer";

logger.message(
  "Check https://github.com/boi123212321/porn-vault for discussion & updates"
);

let serverReady = false;
let setupMessage = "Setting up...";

export default async () => {
  const app = express();
  app.use(express.json());
  app.use(cors);

  app.use(httpLog);

  app.get("/debug/timings/scenes", async (req, res) => {
    res.json(await sceneCollection.times());
  });
  app.get("/debug/timings/actors", async (req, res) => {
    res.json(await actorCollection.times());
  });
  app.get("/debug/timings/images", async (req, res) => {
    res.json(await imageCollection.times());
  });

  app.get("/setup", (req, res) => {
    res.json({
      serverReady,
      setupMessage,
    });
  });

  app.get("/", async (req, res, next) => {
    if (serverReady) next();
    else {
      res.status(404).send(
        await renderHandlebars("./views/setup.html", {
          message: setupMessage,
        })
      );
    }
  });

  app.get("/broken", (_, res) => {
    const b64 = BROKEN_IMAGE;

    var img = Buffer.from(b64, "base64");

    res.writeHead(200, {
      "Content-Type": "image/png",
      "Content-Length": img.length,
    });
    res.end(img);
  });

  const config = getConfig();

  const port = config.PORT || 3000;

  if (config.ENABLE_HTTPS) {
    https
      .createServer(
        {
          key: readFileSync(config.HTTPS_KEY),
          cert: readFileSync(config.HTTPS_CERT),
        },
        app
      )
      .listen(port, () => {
        console.log(`Server running on Port ${port}`);
      });
  } else {
    app.listen(port, () => {
      console.log(`Server running on Port ${port}`);
    });
  }

  app.use("/js", express.static("./app/dist/js"));
  app.use("/css", express.static("./app/dist/css"));
  app.use("/fonts", express.static("./app/dist/fonts"));
  app.use("/previews", express.static("./library/previews"));
  app.use("/assets", express.static("./assets"));
  app.get("/dvd-renderer/:id", dvdRenderer);

  app.get("/flag/:code", async (req, res) => {
    res.redirect(`/assets/flags/${req.params.code.toLowerCase()}.svg`);
  });

  app.get("/password", checkPassword);

  app.use(passwordHandler);

  app.get("/", async (req, res) => {
    const file = path.join(process.cwd(), "app/dist/index.html");

    if (await existsAsync(file)) res.sendFile(file);
    else {
      return res.status(404).send(
        await renderHandlebars("./views/error.html", {
          code: 404,
          message: `File <b>${file}</b> not found`,
        })
      );
    }
  });

  app.use("/scene/:scene", async (req, res, next) => {
    const scene = await Scene.getById(req.params.scene);

    if (scene && scene.path) {
      const resolved = path.resolve(scene.path);
      res.sendFile(resolved);
    } else next(404);
  });

  app.use("/image/:image", async (req, res, next) => {
    const image = await Image.getById(req.params.image);

    if (image && image.path) {
      const resolved = path.resolve(image.path);
      if (!(await existsAsync(resolved))) res.redirect("/broken");
      else res.sendFile(resolved);
    } else res.redirect("/broken");
  });

  app.get("/log", async (req, res) => {
    res.json(logger.getLog());
  });

  mountApolloServer(app);

  app.use(
    (
      err: number,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (typeof err == "number") return res.sendStatus(err);
      return res.sendStatus(500);
    }
  );

  app.use("/queue", queueRouter);

  app.get("/force-scan", (req, res) => {
    if (getIsManualScanningLibrary()) {
      res.status(409).json("Scan already in progress.");
    } else {
      scanFolders(true);
      res.status(200).json("Started scan.");
    }
  });

  if (config.BACKUP_ON_STARTUP === true) {
    setupMessage = "Creating backup...";
    await createBackup(config.MAX_BACKUP_AMOUNT || 10);
  }

  setupMessage = "Loading database...";
  if (await izzyVersion()) {
    logger.log("Izzy already running, clearing...");
    await resetIzzy();
  } else {
    await spawnIzzy();
  }
  await loadStores();

  setupMessage = "Starting search engine...";
  if (await twigsVersion()) {
    logger.log("Twigs already running, clearing indices...");
    await clearSceneIndex();
    await clearImageIndex();
  } else {
    await spawnTwigs();
  }

  setupMessage = "Checking imports...";
  await checkImportFolders();

  setupMessage = "Building search indices...";
  await buildIndices();

  serverReady = true;

  // checkPreviews();

  watchConfig();

  let willAutoIntervalScan = false;

  if (config.SCAN_ON_STARTUP) {
    willAutoIntervalScan = true;
    logger.message("Server start: will start scanning folders");
    await scanFolders();
  } else {
    logger.warn(
      "Scanning folders on startup is currently disabled. Enable in config.json & restart."
    );
  }

  if (config.DO_PROCESSING) {
    logger.message("Server start: will start processing");
    processLibrary();
  }

  if (!willAutoIntervalScan) {
    scheduleManualScan();
  }
};

export async function killServer() {
  logger.message("Cleaning up server resources");

  await destroyImporter();
}
