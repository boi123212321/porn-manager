import ActorMutations from "./mutations/actor";
import CustomFieldMutations from "./mutations/custom_field";
import ImageMutations from "./mutations/image";
import LabelMutations from "./mutations/label";
import MarkerMutations from "./mutations/marker";
import MovieMutations from "./mutations/movie";
import SceneMutations from "./mutations/scene";
import StudioMutations from "./mutations/studio";

export default {
  ...ImageMutations,
  ...ActorMutations,
  ...LabelMutations,
  ...SceneMutations,
  ...MovieMutations,
  ...StudioMutations,
  ...MarkerMutations,
  ...CustomFieldMutations,
};
