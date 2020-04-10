import { ApolloServer } from "apollo-server-express";
import express from "express";
import schema from "./graphql/types";
import { getConfig } from "./config";

export function mountApolloServer(app: express.Application) {
  const config = getConfig();
  const server = new ApolloServer({
    schema,
    cacheControl: {
      defaultMaxAge: Math.max(0, config.CACHE_TIME),
    },
  });
  server.applyMiddleware({ app, path: "/ql" });
}
