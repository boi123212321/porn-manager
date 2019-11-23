import ActorMutations from "./mutations/actor";
import LabelMutations from "./mutations/label";
import SceneMutations from "./mutations/scene";
import ImageMutations from "./mutations/image";
import MovieMutations from "./mutations/movie";

export default {
  ...ImageMutations,
  ...ActorMutations,
  ...LabelMutations,
  ...SceneMutations,
  ...MovieMutations
};
