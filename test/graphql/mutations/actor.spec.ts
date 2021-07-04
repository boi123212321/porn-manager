import { expect } from "chai";
import { existsSync, unlinkSync } from "fs";
import { before } from "mocha";

import { actorCollection, labelCollection, sceneCollection } from "../../../src/database";
import actorMutations from "../../../src/graphql/mutations/actor";
import { indexActors } from "../../../src/search/actor";
import { indexScenes } from "../../../src/search/scene";
import Actor from "../../../src/types/actor";
import Label from "../../../src/types/label";
import Scene from "../../../src/types/scene";
import { downloadFile } from "../../../src/utils/download";
import { TEST_VIDEOS } from "../../fixtures/files/dynamicTestFiles";
import { startTestServer, stopTestServer } from "../../testServer";
import { ApplyActorLabelsEnum } from "./../../../src/config/schema";

describe("graphql", () => {
  describe("mutations", () => {
    describe("actor", () => {
      const videoPathWithActor =
        "./test/fixtures/files/dynamic/dynamic_video001_abc_actor_updated.mp4";
      const videoPathWithoutActor = "./test/fixtures/files/dynamic/dynamic_video001.mp4";

      async function seedDb() {
        const sceneWithActorInPath = new Scene("scene_with_name");
        sceneWithActorInPath.path = videoPathWithActor;
        const sceneWithoutActorInPath = new Scene("scene_without_name");
        sceneWithoutActorInPath.path = videoPathWithoutActor;

        expect(await Scene.getAll()).to.be.empty;
        await sceneCollection.upsert(sceneWithActorInPath._id, sceneWithActorInPath);
        await sceneCollection.upsert(sceneWithoutActorInPath._id, sceneWithoutActorInPath);

        await indexScenes([sceneWithActorInPath, sceneWithoutActorInPath]);
        expect(await Scene.getAll()).to.have.lengthOf(2);

        const seedLabel = new Label("def label");
        expect(await Label.getAll()).to.be.empty;
        await labelCollection.upsert(seedLabel._id, seedLabel);
        expect(await Label.getAll()).to.have.lengthOf(1);

        return {
          sceneWithActorInPath,
          sceneWithoutActorInPath,
          seedLabel,
        };
      }

      async function seedDbWithActor() {
        const { sceneWithActorInPath, sceneWithoutActorInPath, seedLabel } = await seedDb();

        const seedActor = new Actor("abc actor");
        await actorCollection.upsert(seedActor._id, seedActor);
        await indexActors([seedActor]);

        await Actor.setLabels(seedActor, [seedLabel._id]);
        const actorLabels = await Actor.getLabels(seedActor);
        expect(actorLabels).to.have.lengthOf(1);

        const updateLabel = new Label("ghi label");
        await labelCollection.upsert(updateLabel._id, updateLabel);
        expect(await Label.getAll()).to.have.lengthOf(2);

        // Actor labels are not attached to scenes, since we manually set the labels
        expect(await Scene.getActors(sceneWithActorInPath)).to.have.lengthOf(0);
        expect(await Scene.getLabels(sceneWithActorInPath)).to.have.lengthOf(0);
        expect(await Scene.getActors(sceneWithoutActorInPath)).to.have.lengthOf(0);
        expect(await Scene.getLabels(sceneWithoutActorInPath)).to.have.lengthOf(0);

        return {
          sceneWithActorInPath,
          sceneWithoutActorInPath,
          seedActor,
          seedLabel,
          updateLabel,
        };
      }

      before(async () => {
        await downloadFile(TEST_VIDEOS.MP4.url, videoPathWithActor);
        await downloadFile(TEST_VIDEOS.MP4.url, videoPathWithoutActor);
      });

      after(() => {
        if (existsSync(videoPathWithActor)) {
          unlinkSync(videoPathWithActor);
        }
        if (existsSync(videoPathWithoutActor)) {
          unlinkSync(videoPathWithoutActor);
        }
      });

      afterEach(() => {
        stopTestServer();
      });

      describe.skip("addActors", () => {
        it("creates actor, attaches to scenes", async function () {
          await startTestServer.call(this, {
            matching: {
              applyActorLabels: [],
            },
          });
          const { sceneWithActorInPath, sceneWithoutActorInPath, seedLabel } = await seedDb();

          const inputActor = {
            name: "abc actor",
            labels: [seedLabel._id],
          };

          expect(await Scene.getLabels(sceneWithActorInPath)).to.have.lengthOf(0);
          expect(await Scene.getLabels(sceneWithoutActorInPath)).to.have.lengthOf(0);

          const outputActor = await actorMutations.addActor(null, inputActor);

          expect(outputActor.name).to.equal(inputActor.name);
          const actorLabels = await Actor.getLabels(outputActor);
          expect(actorLabels).to.have.lengthOf(1);
          expect(actorLabels[0]._id).to.equal(seedLabel._id);

          // Did attach actor
          expect(await Scene.getActors(sceneWithActorInPath)).to.have.lengthOf(1);
          expect(await Scene.getActors(sceneWithoutActorInPath)).to.have.lengthOf(0);
          // Did not push labels
          expect(await Scene.getLabels(sceneWithActorInPath)).to.have.lengthOf(0);
          expect(await Scene.getLabels(sceneWithoutActorInPath)).to.have.lengthOf(0);
        });

        it("creates actor, attaches to scenes, pushes labels", async function () {
          await startTestServer.call(this, {
            matching: {
              applyActorLabels: [ApplyActorLabelsEnum.enum["event:actor:create"]],
            },
          });
          const { sceneWithActorInPath, sceneWithoutActorInPath, seedLabel } = await seedDb();

          const inputActor = {
            name: "abc actor",
            labels: [seedLabel._id],
          };

          expect(await Scene.getLabels(sceneWithActorInPath)).to.have.lengthOf(0);
          expect(await Scene.getLabels(sceneWithoutActorInPath)).to.have.lengthOf(0);

          const outputActor = await actorMutations.addActor(null, inputActor);

          expect(outputActor.name).to.equal(inputActor.name);
          const actorLabels = await Actor.getLabels(outputActor);
          expect(actorLabels).to.have.lengthOf(1);
          expect(actorLabels[0]._id).to.equal(seedLabel._id);

          // Did not attach actor
          expect(await Scene.getActors(sceneWithActorInPath)).to.have.lengthOf(1);
          expect(await Scene.getActors(sceneWithoutActorInPath)).to.have.lengthOf(0);
          // Did push labels
          expect(await Scene.getLabels(sceneWithActorInPath)).to.have.lengthOf(1);
          expect(await Scene.getLabels(sceneWithoutActorInPath)).to.have.lengthOf(0);
        });
      });

      describe("findUnmatchedScenes", () => {
        it("attaches to scene, when labels did change + applyActorLabels disabled: does not push labels", async function () {
          await startTestServer.call(this, {
            matching: {
              applyActorLabels: [],
            },
          });
          const {
            sceneWithActorInPath,
            sceneWithoutActorInPath,
            seedActor,
          } = await seedDbWithActor();

          const res = await actorMutations.attachActorToUnmatchedScenes(null, {
            id: seedActor._id,
          });
          expect(res).to.not.be.null;

          // Did attach actor
          expect(await Scene.getActors(sceneWithActorInPath)).to.have.lengthOf(1);
          // Did not push labels
          expect(await Scene.getLabels(sceneWithActorInPath)).to.have.lengthOf(0);

          expect(await Scene.getActors(sceneWithoutActorInPath)).to.have.lengthOf(0);
          expect(await Scene.getLabels(sceneWithoutActorInPath)).to.have.lengthOf(0);
        });

        it("attaches to scene, when labels did change + applyActorLabels enabled: does push labels", async function () {
          await startTestServer.call(this, {
            matching: {
              applyActorLabels: [ApplyActorLabelsEnum.enum["event:actor:find-unmatched-scenes"]],
            },
          });
          const {
            sceneWithActorInPath,
            sceneWithoutActorInPath,
            seedActor,
          } = await seedDbWithActor();

          const res = await actorMutations.attachActorToUnmatchedScenes(null, {
            id: seedActor._id,
          });
          expect(res).to.not.be.null;

          // Did attach actor
          expect(await Scene.getActors(sceneWithActorInPath)).to.have.lengthOf(1);
          // Did push labels
          expect(await Scene.getLabels(sceneWithActorInPath)).to.have.lengthOf(1);

          expect(await Scene.getActors(sceneWithoutActorInPath)).to.have.lengthOf(0);
          expect(await Scene.getLabels(sceneWithoutActorInPath)).to.have.lengthOf(0);
        });
      });

      describe("updateActor", () => {
        it("when labels did change + applyActorLabels disabled: does not push labels", async function () {
          await startTestServer.call(this, {
            matching: {
              applyActorLabels: [],
            },
          });
          const {
            sceneWithActorInPath,
            seedActor,
            seedLabel,
            updateLabel,
          } = await seedDbWithActor();

          const opts = {
            name: "abc actor updated",
            description: "new description",
            labels: [seedLabel._id, updateLabel._id],
          };

          const res = await actorMutations.attachActorToUnmatchedScenes(null, {
            id: seedActor._id,
          });
          expect(res).to.not.be.null;
          expect(await Scene.getActors(sceneWithActorInPath)).to.have.lengthOf(1);

          const outputActors = await actorMutations.updateActors(null, {
            ids: [seedActor._id],
            opts,
          });

          expect(outputActors).to.have.lengthOf(1);
          const outputActor = outputActors[0];
          expect(outputActor.description).to.equal(opts.description);
          const actorLabels = await Actor.getLabels(outputActor);
          expect(actorLabels).to.have.lengthOf(2);
          expect(!!actorLabels.find((l) => l._id === seedLabel._id)).to.be.true;
          expect(!!actorLabels.find((l) => l._id === updateLabel._id)).to.be.true;

          // Did not push labels
          expect(await Scene.getLabels(sceneWithActorInPath)).to.have.lengthOf(0);
        });

        it("when labels did change + applyActorLabels enabled: pushes labels", async function () {
          await startTestServer.call(this, {
            matching: {
              applyActorLabels: [ApplyActorLabelsEnum.enum["event:actor:update"]],
            },
          });
          const {
            sceneWithActorInPath,
            seedActor,
            seedLabel,
            updateLabel,
          } = await seedDbWithActor();

          const opts = {
            name: "abc actor updated",
            description: "new description",
            labels: [seedLabel._id, updateLabel._id],
          };

          const res = await actorMutations.attachActorToUnmatchedScenes(null, {
            id: seedActor._id,
          });
          expect(res).to.not.be.null;
          expect(await Scene.getActors(sceneWithActorInPath)).to.have.lengthOf(1);

          const outputActors = await actorMutations.updateActors(null, {
            ids: [seedActor._id],
            opts,
          });

          expect(outputActors).to.have.lengthOf(1);
          const outputActor = outputActors[0];
          expect(outputActor.description).to.equal(opts.description);
          const actorLabels = await Actor.getLabels(outputActor);
          expect(actorLabels).to.have.lengthOf(2);
          expect(!!actorLabels.find((l) => l._id === seedLabel._id)).to.be.true;
          expect(!!actorLabels.find((l) => l._id === updateLabel._id)).to.be.true;

          // Did push labels
          expect(await Scene.getLabels(sceneWithActorInPath)).to.have.lengthOf(2);
        });
      });
    });
  });
});
