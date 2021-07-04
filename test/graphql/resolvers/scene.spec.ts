import { expect } from "chai";
import { existsSync, unlinkSync } from "fs";

import sceneResolvers from "../../../src/graphql/resolvers/scene";
import { indexScenes } from "../../../src/search/scene";
import Scene from "../../../src/types/scene";
import { downloadFile } from "../../../src/utils/download";
import { TEST_VIDEOS } from "../../fixtures/files/dynamicTestFiles";
import { startTestServer, stopTestServer } from "../../testServer";
import { sceneCollection } from "./../../../src/database";

describe("graphql", () => {
  describe("mutations", () => {
    describe("scene", () => {
      async function seedDbWithScene() {
        const seedScene = new Scene("seed_scene");

        expect(await Scene.getAll()).to.be.empty;
        await sceneCollection.upsert(seedScene._id, seedScene);
        await indexScenes([seedScene]);
        expect(await Scene.getAll()).to.have.lengthOf(1);

        return {
          seedScene,
        };
      }

      afterEach(() => {
        stopTestServer();
      });

      describe("availableStreams", () => {
        for (const testName in TEST_VIDEOS) {
          const test = TEST_VIDEOS[testName];
          describe(testName, () => {
            const videoPath = `./test/fixtures/files/dynamic/${test.filename}`;

            before(async () => {
              await downloadFile(test.url, videoPath);
            });

            after(() => {
              if (existsSync(videoPath)) {
                unlinkSync(videoPath);
              }
            });

            it("gets correct streams", async function () {
              await startTestServer.call(this, {});

              const { seedScene } = await seedDbWithScene();
              seedScene.path = videoPath;
              await sceneCollection.upsert(seedScene._id, seedScene);

              const res = (await sceneResolvers.availableStreams(seedScene))!;
              expect(res).to.not.be.null;
              const resultStreamTypes = res.map((r) => r.streamType);
              expect(test.streamTypes).to.deep.equal(resultStreamTypes);
            });
          });
        }
      });
    });
  });
});
