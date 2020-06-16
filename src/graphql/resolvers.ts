import { GraphQLJSONObject } from "graphql-type-json";
import GraphQLLong from "graphql-type-long";

import MutationResolver from "./mutation";
import ActorResolver from "./resolvers/actor";
import CustomFieldResolver from "./resolvers/custom_field";
import ImageResolver from "./resolvers/image";
import LabelResolver from "./resolvers/label";
import MarkerResolver from "./resolvers/marker";
import MovieResolver from "./resolvers/movie";
import QueryResolvers from "./resolvers/query";
import SceneResolver from "./resolvers/scene";
import SceneViewResolver from "./resolvers/scene_view";
import StudioResolver from "./resolvers/studio";

const resolvers = {
  Long: <unknown>GraphQLLong,
  Object: <unknown>GraphQLJSONObject,

  Actor: ActorResolver,
  Scene: SceneResolver,
  Image: ImageResolver,
  Query: QueryResolvers,
  Mutation: MutationResolver,
  Label: LabelResolver,
  Movie: MovieResolver,
  Studio: StudioResolver,
  CustomField: CustomFieldResolver,
  Marker: MarkerResolver,
  SceneView: SceneViewResolver,
};

export default resolvers;
