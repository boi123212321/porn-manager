import { ApolloServer } from "apollo-server-express";
import { ApolloServerPlugin, GraphQLRequestListener } from "apollo-server-plugin-base";
import express from "express";
import { graphqlUploadExpress } from "graphql-upload";

import schema from "../graphql/types";
import { formatMessage, logger } from "../utils/logger";

const apolloLogger: ApolloServerPlugin = {
  requestDidStart(requestContext): GraphQLRequestListener {
    return {
      didEncounterErrors(requestContext) {
        logger.error(`Error in graphql api: ${formatMessage(requestContext.errors)}`);
      },
    };
  },
};

export function mountApolloServer(app: express.Application): void {
  const server = new ApolloServer({
    schema,
    context: ({ req }) => ({
      req,
    }),
    uploads: false,
    playground: !!process.env.PV_QL_PLAYGROUND,
    plugins: [apolloLogger],
  });
  app.use(graphqlUploadExpress());
  server.applyMiddleware({ app, path: "/api/ql" });
}
