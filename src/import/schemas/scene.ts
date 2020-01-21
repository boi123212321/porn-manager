import Schema from "validate";
import { stringArray, limitRating, isValidDate } from "./common";

export const sceneSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  thumbnail: {
    type: String,
    required: false
  },
  studio: {
    type: String,
    required: false
  },
  releaseDate: {
    type: Number,
    required: false,
    use: { isValidDate }
  },
  rating: {
    type: Number,
    required: false,
    use: { limitRating }
  },
  actors: stringArray(false),
  labels: stringArray(false),
  custom: {
    required: false,
    type: Object
  },
  bookmark: {
    required: false,
    type: Boolean
  },
  favorite: {
    required: false,
    type: Boolean
  }
});
