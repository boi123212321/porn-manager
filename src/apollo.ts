import { ApolloServer, gql } from "apollo-server-express";
import types from "./graphql/types";
import resolvers from "./graphql/resolvers";
import express from "express";

export function mountApolloServer(app: express.Application) {
  const server = new ApolloServer({ typeDefs: gql(types), resolvers });
  server.applyMiddleware({ app, path: "/ql" });
}
