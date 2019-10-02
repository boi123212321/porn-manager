import GraphQLLong from 'graphql-type-long';
import QueryResolvers from "./resolvers/query";
import ActorResolver from "./resolvers/actor";
import MutationResolver from "./resolvers/mutation";

const resolvers = {
  Long: GraphQLLong,
  Actor: ActorResolver,
  Query: QueryResolvers,
  Mutation: MutationResolver
}

export default resolvers;