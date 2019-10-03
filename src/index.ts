import express from "express"
import * as logger from "./logger";
import { ApolloServer, gql } from "apollo-server-express";
import "./ffmpeg";
import "./database";
import config from "./config";
import Image from "./types/image";
import types from "./graphql/types"
import resolvers from "./graphql/resolvers"
import Scene from "./types/scene";

const app = express();

/* app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(`${req.method} ${req.originalUrl}: ${new Date().toLocaleString()}`);
  next();
}); */

app.use("/scene/:scene", (req, res, next) => {
  const scene = Scene.getById(req.params.scene);

  if (scene && scene.path)
    res.sendFile(scene.path);
  else
    next(404);
})

app.use("/image/:image", (req, res, next) => {
  const image = Image.getById(req.params.image);

  if (image)
    res.sendFile(image.path);
  else
    next(404);
})

const server = new ApolloServer({ typeDefs: gql(types), resolvers });
server.applyMiddleware({ app, path: "/ql" });

app.use((err: number, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (typeof err == "number") {
    return res.sendStatus(err);
  }
  return res.sendStatus(500);
});

app.listen(3000, () => {
  logger.SUCCESS("Server running on Port 3000");
  console.log("Config:\n", config);
})