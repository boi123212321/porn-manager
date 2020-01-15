import { imageIndex } from "./image";
import { sceneIndex } from "./scene";
import { actorIndex } from "./actor";
import { studioIndex } from "./studio";
import { movieIndex } from "./movie";

import { buildImageIndex } from "./image";
import { buildSceneIndex } from "./scene";
import { buildActorIndex } from "./actor";
import { buildStudioIndex } from "./studio";
import { buildMovieIndex } from "./movie";

export const indices = {
  images: imageIndex,
  scenes: sceneIndex,
  actors: actorIndex,
  studios: studioIndex,
  movies: movieIndex
};

export async function buildIndices() {
  await buildImageIndex();
  await buildActorIndex();
  await buildSceneIndex();
  await buildStudioIndex();
  await buildMovieIndex();
}
