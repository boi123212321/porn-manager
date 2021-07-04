import { expect } from 'chai';
import { existsSync, unlinkSync } from 'fs';
import { before } from 'mocha';

import { labelCollection, sceneCollection, studioCollection } from '../../src/database';
import query from '../../src/graphql/resolvers/query';
import { indexScenes } from '../../src/search/scene';
import { indexStudios } from '../../src/search/studio';
import Label from '../../src/types/label';
import Scene from '../../src/types/scene';
import Studio from '../../src/types/studio';
import { downloadFile } from '../../src/utils/download';
import { TEST_VIDEOS } from '../fixtures/files/dynamicTestFiles';
import { startTestServer, stopTestServer } from '../testServer';

describe("types", () => {
  describe("studio", () => {
    describe("findUnmatchedScenes,pushLabelsToCurrentScenes", () => {
      const videoPathWithStudio = "./test/fixtures/files/dynamic/dynamic_video001_abc_studio.mp4";
      const videoPathWithoutStudio = "./test/fixtures/files/dynamic/dynamic_video001.mp4";

      async function seedDb(setStudioLabel: boolean) {
        const sceneWithStudioInPath = new Scene("scene_with_name");
        sceneWithStudioInPath.path = videoPathWithStudio;
        const sceneWithoutStudioInPath = new Scene("scene_without_name");
        sceneWithoutStudioInPath.path = videoPathWithoutStudio;
        const seedStudio = new Studio("abc studio");
        const seedLabel = new Label("def label");

        if (setStudioLabel) {
          expect(await Label.getAll()).to.be.empty;
          await labelCollection.upsert(seedLabel._id, seedLabel);
          expect(await Label.getAll()).to.have.lengthOf(1);

          await Studio.setLabels(seedStudio, [seedLabel._id]);
          expect(await Studio.getLabels(seedStudio)).to.have.lengthOf(1);
        }
        expect(await Studio.getAll()).to.be.empty;
        await studioCollection.upsert(seedStudio._id, seedStudio);
        await indexStudios([seedStudio]);
        expect(await Studio.getAll()).to.have.lengthOf(1);
        expect(await query.numStudios()).to.equal(1);

        expect(await Scene.getAll()).to.be.empty;
        await sceneCollection.upsert(sceneWithStudioInPath._id, sceneWithStudioInPath);
        await sceneCollection.upsert(sceneWithoutStudioInPath._id, sceneWithoutStudioInPath);

        await indexScenes([sceneWithStudioInPath, sceneWithoutStudioInPath]);
        expect(await Scene.getAll()).to.have.lengthOf(2);
        expect(await query.numScenes()).to.equal(2);

        return {
          sceneWithStudioInPath,
          sceneWithoutStudioInPath,
          seedStudio,
          seedLabel,
        };
      }

      before(async () => {
        await downloadFile(TEST_VIDEOS.MP4.url, videoPathWithStudio);
        await downloadFile(TEST_VIDEOS.MP4.url, videoPathWithoutStudio);
      });

      after(() => {
        if (existsSync(videoPathWithStudio)) {
          unlinkSync(videoPathWithStudio);
        }
        if (existsSync(videoPathWithoutStudio)) {
          unlinkSync(videoPathWithoutStudio);
        }
      });

      afterEach(() => {
        stopTestServer();
      });

      it("when name in path, attaches studio, adds no labels", async function () {
        await startTestServer.call(this);
        const { sceneWithStudioInPath, seedStudio } = await seedDb(false);

        expect(await Scene.getLabels(sceneWithStudioInPath)).to.have.lengthOf(0);

        const studioLabels = (await Studio.getLabels(seedStudio)).map((l) => l._id);
        await Studio.findUnmatchedScenes(seedStudio, studioLabels);

        const updatedScene = await Scene.getById(sceneWithStudioInPath._id);
        expect(updatedScene).to.not.be.null;
        expect((updatedScene as Scene).studio).to.equal(seedStudio._id);
        const sceneLabels = (await Scene.getLabels(sceneWithStudioInPath)).map((l) => l._id);
        expect(sceneLabels).to.have.lengthOf(0);
      });

      it("when name in path, attaches studio, adds labels", async function () {
        await startTestServer.call(this);
        const { sceneWithStudioInPath, seedStudio } = await seedDb(true);

        expect(await Scene.getLabels(sceneWithStudioInPath)).to.have.lengthOf(0);

        const studioLabels = (await Studio.getLabels(seedStudio)).map((l) => l._id);
        // Should attach labels to scene, since studio name is in path
        await Studio.findUnmatchedScenes(seedStudio, studioLabels);

        const updatedScene = await Scene.getById(sceneWithStudioInPath._id);
        expect(updatedScene).to.not.be.null;
        expect((updatedScene as Scene).studio).to.equal(seedStudio._id);
        const sceneLabels = (await Scene.getLabels(sceneWithStudioInPath)).map((l) => l._id);
        expect(sceneLabels).to.have.lengthOf(1);
        expect(sceneLabels[0]).to.equal(studioLabels[0]);
      });

      it("when already attached to scene, adds no labels", async function () {
        await startTestServer.call(this);
        const { sceneWithoutStudioInPath, seedStudio } = await seedDb(false);

        expect(await Scene.getLabels(sceneWithoutStudioInPath)).to.have.lengthOf(0);

        const studioLabels = (await Studio.getLabels(seedStudio)).map((l) => l._id);
        await Studio.findUnmatchedScenes(seedStudio, studioLabels);

        const sceneLabels = (await Scene.getLabels(sceneWithoutStudioInPath)).map((l) => l._id);
        expect(sceneLabels).to.have.lengthOf(0);

        sceneWithoutStudioInPath.studio = seedStudio._id;
        await sceneCollection.upsert(sceneWithoutStudioInPath._id, sceneWithoutStudioInPath);
        await Studio.pushLabelsToCurrentScenes(seedStudio, studioLabels);
        expect(await Scene.getLabels(sceneWithoutStudioInPath)).to.have.lengthOf(0);
      });

      it("when already attached to scene, adds labels", async function () {
        await startTestServer.call(this);
        const { sceneWithoutStudioInPath, seedStudio } = await seedDb(true);

        expect(await Scene.getLabels(sceneWithoutStudioInPath)).to.have.lengthOf(0);

        const studioLabels = (await Studio.getLabels(seedStudio)).map((l) => l._id);
        await Studio.findUnmatchedScenes(seedStudio, studioLabels);
        expect(await Scene.getLabels(sceneWithoutStudioInPath)).to.have.lengthOf(0);

        sceneWithoutStudioInPath.studio = seedStudio._id;
        await sceneCollection.upsert(sceneWithoutStudioInPath._id, sceneWithoutStudioInPath);
        await Studio.pushLabelsToCurrentScenes(seedStudio, studioLabels);
        const sceneLabels = (await Scene.getLabels(sceneWithoutStudioInPath)).map((l) => l._id);
        expect(sceneLabels).to.have.lengthOf(1);
        expect(sceneLabels[0]).to.equal(studioLabels[0]);
      });
    });
  });
});
