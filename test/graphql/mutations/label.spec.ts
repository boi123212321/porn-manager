import { expect } from "chai";

import labelMutations from "../../../src/graphql/mutations/label";
import { indexScenes } from "../../../src/search/scene";
import Scene from "../../../src/types/scene";
import { startTestServer, stopTestServer } from "../../testServer";
import { sceneCollection } from "./../../../src/database";

describe("graphql", () => {
  describe("mutations", () => {
    describe("label", () => {
      afterEach(() => {
        stopTestServer();
      });

      describe("addLabel", () => {
        it("creates and matches label to scene", async function () {
          await startTestServer.call(this, {
            matching: {
              applyActorLabels: [],
            },
          });
          const seedScene = new Scene("seed_scene");
          seedScene.path = "contains_test_label.mp4";
          await sceneCollection.upsert(seedScene._id, seedScene);
          await indexScenes([seedScene]);

          expect(await Scene.getLabels(seedScene)).to.have.lengthOf(0);

          const addLabel = {
            name: "test",
          };

          const outputLabel = await labelMutations.addLabel(null, addLabel);

          expect(outputLabel.name).to.equal(addLabel.name);

          expect(await Scene.getLabels(seedScene)).to.have.lengthOf(1);
        });
      });
    });
  });
});
