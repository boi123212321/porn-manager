export interface IMissingSceneItem {
  _id: string;
  path: string;
}

import { sceneCollection } from "../database/index";
import * as logger from "../logger";
import { missingSceneCollection } from "../database/index";
export async function emptyRecycleBin() {
  const items = await missingSceneCollection.getAll();
  items.forEach(async item => {
    await sceneCollection
      .remove(item._id)
      .catch(err =>
        logger.error(
          `Failed to remove ${item._id} at path ${item.path} from the db. Error: ${err}`
        )
      );
    await missingSceneCollection.remove(item._id);
  });
}
export async function clearRecycleBin() {
  const items = await missingSceneCollection.getAll();
  items.forEach(async item => {
    await missingSceneCollection.remove(item._id);
  });
}
