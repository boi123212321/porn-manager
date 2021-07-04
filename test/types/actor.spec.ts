import { expect } from 'chai';
import { existsSync, unlinkSync } from 'fs';
import { before } from 'mocha';

import { actorCollection, labelCollection, sceneCollection } from '../../src/database';
import { indexActors } from '../../src/search/actor';
import { indexScenes } from '../../src/search/scene';
import Actor from '../../src/types/actor';
import Label from '../../src/types/label';
import Scene from '../../src/types/scene';
import { downloadFile } from '../../src/utils/download';
import { TEST_VIDEOS } from '../fixtures/files/dynamicTestFiles';
import { startTestServer, stopTestServer } from '../testServer';

describe("types", () => {
  describe("actor", () => {
    describe("findUnmatchedScenes,pushLabelsToCurrentScenes", () => {
      const videoPathWithActor = "./test/fixtures/files/dynamic/dynamic_video001_abc_actor.mp4";
      const videoPathWithoutActor = "./test/fixtures/files/dynamic/dynamic_video001.mp4";

      async function seedDb(setActorLabel: boolean) {
        const sceneWithActorInPath = new Scene("scene_with_name");
        sceneWithActorInPath.path = videoPathWithActor;
        const sceneWithoutActorInPath = new Scene("scene_without_name");
        sceneWithoutActorInPath.path = videoPathWithoutActor;
        const seedActor = new Actor("abc actor");
        const seedLabel = new Label("def label");

        if (setActorLabel) {
          expect(await Label.getAll()).to.be.empty;
          await labelCollection.upsert(seedLabel._id, seedLabel);
          expect(await Label.getAll()).to.have.lengthOf(1);
          await Actor.setLabels(seedActor, [seedLabel._id]);
          expect(await Actor.getLabels(seedActor)).to.have.lengthOf(1);
        }
        expect(await Actor.getAll()).to.be.empty;
        await actorCollection.upsert(seedActor._id, seedActor);
        await indexActors([seedActor]);
        expect(await Actor.getAll()).to.have.lengthOf(1);

        expect(await Scene.getAll()).to.be.empty;
        await sceneCollection.upsert(sceneWithActorInPath._id, sceneWithActorInPath);
        await sceneCollection.upsert(sceneWithoutActorInPath._id, sceneWithoutActorInPath);

        await indexScenes([sceneWithActorInPath, sceneWithoutActorInPath]);
        expect(await Scene.getAll()).to.have.lengthOf(2);

        return {
          sceneWithActorInPath,
          sceneWithoutActorInPath,
          seedActor,
          seedLabel,
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

      it("when name in path, attaches actor, adds no labels to new scene", async function () {
        await startTestServer.call(this);
        const { sceneWithActorInPath, seedActor } = await seedDb(false);

        expect(await Scene.getLabels(sceneWithActorInPath)).to.have.lengthOf(0);

        const actorLabels = (await Actor.getLabels(seedActor)).map((l) => l._id);
        await Actor.findUnmatchedScenes(seedActor, actorLabels);

        const sceneActors = await Scene.getActors(sceneWithActorInPath);
        expect(sceneActors).to.have.lengthOf(1);
        expect(sceneActors[0]._id).to.equal(seedActor._id);
        const sceneLabels = (await Scene.getLabels(sceneWithActorInPath)).map((l) => l._id);
        expect(sceneLabels).to.have.lengthOf(0);
      });

      it("when name in path, attaches actor, adds labels to new scene", async function () {
        await startTestServer.call(this);
        const { sceneWithActorInPath, seedActor } = await seedDb(true);

        expect(await Scene.getLabels(sceneWithActorInPath)).to.have.lengthOf(0);

        const actorLabels = (await Actor.getLabels(seedActor)).map((l) => l._id);
        // Should attach labels to scene, since actor name is in path
        await Actor.findUnmatchedScenes(seedActor, actorLabels);

        const sceneActors = await Scene.getActors(sceneWithActorInPath);
        expect(sceneActors).to.have.lengthOf(1);
        expect(sceneActors[0]._id).to.equal(seedActor._id);
        const sceneLabels = (await Scene.getLabels(sceneWithActorInPath)).map((l) => l._id);
        expect(sceneLabels).to.have.lengthOf(1);
        expect(sceneLabels[0]).to.equal(actorLabels[0]);
      });

      it("when already attached to scene, adds no labels", async function () {
        await startTestServer.call(this);
        const { sceneWithoutActorInPath, seedActor } = await seedDb(false);

        expect(await Scene.getLabels(sceneWithoutActorInPath)).to.have.lengthOf(0);

        const actorLabels = (await Actor.getLabels(seedActor)).map((l) => l._id);
        await Actor.findUnmatchedScenes(seedActor, actorLabels);

        const sceneLabels = (await Scene.getLabels(sceneWithoutActorInPath)).map((l) => l._id);
        expect(sceneLabels).to.have.lengthOf(0);

        await Scene.setActors(sceneWithoutActorInPath, [seedActor._id]);
        await Actor.pushLabelsToCurrentScenes(seedActor, actorLabels);
        expect(await Scene.getLabels(sceneWithoutActorInPath)).to.have.lengthOf(0);
      });

      it("when already attached to scene, adds labels", async function () {
        await startTestServer.call(this);
        const { sceneWithoutActorInPath, seedActor } = await seedDb(true);

        expect(await Scene.getLabels(sceneWithoutActorInPath)).to.have.lengthOf(0);

        const actorLabels = (await Actor.getLabels(seedActor)).map((l) => l._id);
        await Actor.findUnmatchedScenes(seedActor, actorLabels);
        expect(await Scene.getLabels(sceneWithoutActorInPath)).to.have.lengthOf(0);

        await Scene.setActors(sceneWithoutActorInPath, [seedActor._id]);
        await Actor.pushLabelsToCurrentScenes(seedActor, actorLabels);
        const sceneLabels = (await Scene.getLabels(sceneWithoutActorInPath)).map((l) => l._id);
        expect(sceneLabels).to.have.lengthOf(1);
        expect(sceneLabels[0]).to.equal(actorLabels[0]);
      });
    });
  });
});
