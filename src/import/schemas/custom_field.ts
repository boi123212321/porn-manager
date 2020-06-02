import Schema from "validate";

import { CustomFieldType } from "../../types/custom_field";
import { stringArray } from "./common";

export const customFieldSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: Object.keys(CustomFieldType),
  },
  values: {
    ...stringArray(false),
  },
});
