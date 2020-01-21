import Schema from "validate";
import { stringArray, limitRating, isValidDate } from "./common";

export const movieSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  frontCover: {
    type: String,
    required: false
  },
  backCover: {
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
  scenes: stringArray(false),
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
