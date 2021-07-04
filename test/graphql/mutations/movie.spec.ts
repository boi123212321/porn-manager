import { expect } from "chai";

import movieMutations from "../../../src/graphql/mutations/movie";
import { getMovies } from "../../../src/graphql/resolvers/search/movie";
import { indexMovies } from "../../../src/search/movie";
import { indexScenes } from "../../../src/search/scene";
import Movie from "../../../src/types/movie";
import MovieScene from "../../../src/types/movie_scene";
import Scene from "../../../src/types/scene";
import { startTestServer, stopTestServer } from "../../testServer";
import { movieCollection, sceneCollection } from "./../../../src/database";

describe("graphql", () => {
  describe("mutations", () => {
    describe("movie", () => {
      afterEach(() => {
        stopTestServer();
      });

      describe("removeMovie", () => {
        it("removes the movie", async function () {
          // SETUP
          await startTestServer.call(this);

          const scene = new Scene("test scene");
          await sceneCollection.upsert(scene._id, scene);
          await indexScenes([scene]);

          const movie = new Movie("test movie");
          await movieCollection.upsert(movie._id, movie);
          await indexMovies([movie]);

          expect((await getMovies(null, { query: {}, seed: "" }))?.numItems).to.equal(1);
          expect(await Movie.getById(movie._id)).to.not.be.null;

          await Movie.setScenes(movie, [scene._id]);
          expect(await MovieScene.getByMovie(movie._id)).to.have.lengthOf(1);

          // TEST

          const removeRes = await movieMutations.removeMovies(null, { ids: [movie._id] });

          // RESULT

          expect(removeRes).to.be.true;

          expect((await getMovies(null, { query: {}, seed: "" }))?.numItems).to.equal(0);
          expect(await Movie.getById(movie._id)).to.be.null;
          expect(await MovieScene.getByMovie(movie._id)).to.have.lengthOf(0);
        });
      });
    });
  });
});
