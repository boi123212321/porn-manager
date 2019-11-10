import GraphQLLong from 'graphql-type-long';
import QueryResolvers from "./resolvers/query";
import ActorResolver from "./resolvers/actor";
import SceneResolver from "./resolvers/scene";
import MutationResolver from "./mutation";
import ImageResolver from "./resolvers/image";

const resolvers = {
  Long: GraphQLLong,
  Actor: ActorResolver,
  Scene: SceneResolver,
  Image: ImageResolver,
  Query: QueryResolvers,
  Mutation: MutationResolver
}

export default resolvers;