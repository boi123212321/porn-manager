import { buildImageIndex } from "./image";
import { buildActorIndex } from "./actor";
import { buildStudioIndex } from "./studio";
import { buildMovieIndex } from "./movie";
import { buildSceneIndex } from "./scene";

export async function buildIndices() {
  await buildSceneIndex();
  await buildActorIndex();
  await buildMovieIndex();
  await buildStudioIndex();
  await buildImageIndex();
}
