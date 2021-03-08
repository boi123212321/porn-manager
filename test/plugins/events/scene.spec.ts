import "mocha";

import { expect } from "chai";
import path from "path";

import { ApplyActorLabelsEnum, ApplyStudioLabelsEnum } from "../../../src/config/schema";
import { onSceneCreate } from "../../../src/plugins/events/scene";
import { indexActors } from "../../../src/search/actor";
import { indexImages } from "../../../src/search/image";
import { indexStudios } from "../../../src/search/studio";
import Actor from "../../../src/types/actor";
import Image from "../../../src/types/image";
import Label from "../../../src/types/label";
import Scene from "../../../src/types/scene";
import Studio from "../../../src/types/studio";
import { startTestServer, stopTestServer } from "../../testServer";
import { CONFIG_FIXTURES } from "../initPluginFixtures";
import {
  actorCollection,
  imageCollection,
  labelCollection,
  studioCollection,
} from "./../../../src/database";
import { resolvePlugin } from "../../../src/plugins";

describe("plugins", () => {
  describe("events", () => {
    describe("scene", () => {
      afterEach(() => {
        stopTestServer();
      });

      CONFIG_FIXTURES.forEach((configFixture) => {
        ["sceneCreated", "sceneCustom"].forEach((ev: string) => {
          const event: "sceneCreated" | "sceneCustom" = ev as any;
          const plugins = configFixture.config.plugins.events[event];
          expect(plugins).to.have.lengthOf(1); // This test should only run 1 plugin for the given event
          const [pluginName] = resolvePlugin(plugins[0]);

          const scenePluginFixture = require(path.resolve(
            configFixture.config.plugins.register[pluginName].path
          ));

          it(`config ${configFixture.name}: event '${event}': runs fixture plugin, changes properties`, async function () {
            await startTestServer.call(this, {
              plugins: configFixture.config.plugins,
            });

            const existingImage = new Image("existing image");
            existingImage.path = path.resolve("test/fixtures/files/image001.jpg");
            await imageCollection.upsert(existingImage._id, existingImage);
            await indexImages([existingImage]);

            const initialName = "initial scene name";
            let scene = new Scene(initialName);

            expect(scene.name).to.equal(initialName);

            expect(scene.name).to.not.equal(scenePluginFixture.result.name);
            // expect(scene.path).to.not.equal(scenePluginFixture.result.path);
            expect(scene.description).to.not.equal(scenePluginFixture.result.description);
            expect(scene.releaseDate).to.not.equal(scenePluginFixture.result.releaseDate);
            expect(scene.addedOn).to.not.equal(scenePluginFixture.result.addedOn);
            expect(scene.rating).to.not.equal(scenePluginFixture.result.rating);
            expect(scene.favorite).to.not.equal(scenePluginFixture.result.favorite);
            expect(scene.bookmark).to.not.equal(scenePluginFixture.result.bookmark);
            expect(scene.thumbnail).to.be.null;

            const result = await onSceneCreate(scene, [], [], event);
            scene = result.scene;

            expect(scene.name).to.equal(scenePluginFixture.result.name);
            // expect(scene.path).to.equal(scenePluginFixture.result.path);
            expect(scene.description).to.equal(scenePluginFixture.result.description);
            expect(scene.releaseDate).to.equal(scenePluginFixture.result.releaseDate);
            expect(scene.addedOn).to.equal(scenePluginFixture.result.addedOn);
            expect(scene.rating).to.equal(scenePluginFixture.result.rating);
            expect(scene.favorite).to.equal(scenePluginFixture.result.favorite);
            expect(scene.bookmark).to.equal(scenePluginFixture.result.bookmark);
            expect(scene.thumbnail).to.be.a("string");

            const updatedImage = await Image.getById(existingImage._id);
            expect(updatedImage).to.not.be.null;
            expect((updatedImage as Image).scene).to.equal(scene._id);
          });

          describe("labels", () => {
            async function seedDb() {
              expect(await Image.getAll()).to.be.empty;

              const actorLabel = new Label("dummy label");
              const studioLabel = new Label("fake studio label");
              const sceneLabel = new Label("existing scene label");
              await labelCollection.upsert(actorLabel._id, actorLabel);
              await labelCollection.upsert(studioLabel._id, studioLabel);
              await labelCollection.upsert(sceneLabel._id, sceneLabel);

              expect(await Actor.getAll()).to.be.empty;
              // same name as name returned from scene plugin
              const seedActor = new Actor("existing actor name");
              await actorCollection.upsert(seedActor._id, seedActor);
              await Actor.setLabels(seedActor, [actorLabel._id]);
              await indexActors([seedActor]);

              expect(await Studio.getAll()).to.be.empty;
              // same name as name returned from scene plugin
              const seedStudio = new Studio("existing studio");
              await studioCollection.upsert(seedStudio._id, seedStudio);
              await Studio.setLabels(seedStudio, [studioLabel._id]);
              await indexStudios([seedStudio]);

              const expectedLabelIds = [actorLabel._id, studioLabel._id, sceneLabel._id];

              return {
                actorLabel,
                seedActor,
                studioLabel,
                seedStudio,
                expectedLabelIds,
                sceneLabel,
              };
            }

            it(`config ${configFixture.name}: event '${event}': should not add labels`, async function () {
              await startTestServer.call(this, {
                plugins: configFixture.config.plugins,
                matching: {
                  applyActorLabels: [],
                  applyStudioLabels: [],
                  applySceneLabels: false,
                },
              });

              const { sceneLabel } = await seedDb();

              let scene = new Scene("initial scene name");

              const sceneLabels: string[] = [];

              const result = await onSceneCreate(scene, sceneLabels, [], event);
              scene = result.scene;

              await result.commit();

              expect(scene.thumbnail).to.be.a("string");
              expect(scene.studio).to.be.a("string");

              // Plugin created 1 thumbnail 2 extra
              const images = await Image.getAll();
              expect(images).to.have.lengthOf(3);

              // Did not attach labels to any images
              for (const image of images) {
                expect(await Image.getLabels(image)).to.be.empty;
              }

              // Only contains the direct labels
              expect(sceneLabels).to.have.lengthOf(1);
              expect(sceneLabels[0]).to.equal(sceneLabel._id);
            });

            it(`config ${configFixture.name}: event '${event}': should add labels`, async function () {
              await startTestServer.call(this, {
                plugins: configFixture.config.plugins,
                matching: {
                  applyActorLabels: [
                    ApplyActorLabelsEnum.enum["plugin:scene:create"],
                    ApplyActorLabelsEnum.enum["plugin:scene:custom"],
                  ],
                  applyStudioLabels: [
                    ApplyStudioLabelsEnum.enum["plugin:scene:create"],
                    ApplyStudioLabelsEnum.enum["plugin:scene:custom"],
                  ],
                  applySceneLabels: true,
                },
              });

              const { expectedLabelIds } = await seedDb();

              let scene = new Scene("initial scene name");
              expect(scene.thumbnail).to.be.null;

              const sceneLabels: string[] = [];

              const result = await onSceneCreate(scene, sceneLabels, [], event);
              scene = result.scene;

              await result.commit();

              expect(scene.thumbnail).to.be.a("string");
              expect(scene.studio).to.be.a("string");

              // Plugin created 1 thumbnail 2 extra
              const images = await Image.getAll();
              expect(images).to.have.lengthOf(3);

              // Did attach actor/studio labels to images
              for (const image of images) {
                // Only non thumbnail images are indexed and could be applied labels
                if (!image.name.includes("thumbnail")) {
                  const imageLabels = await Image.getLabels(image);
                  expect(imageLabels).to.have.lengthOf(3);
                  expect(
                    expectedLabelIds.every((id) => !!imageLabels.find((label) => label._id === id))
                  ).to.be.true;
                }
              }

              // Did attach actor/studio labels to scene + own labels from plugin
              expect(sceneLabels).to.have.lengthOf(3);
              expect(
                expectedLabelIds.every(
                  (id) => !!sceneLabels.find((sceneLabel) => sceneLabel === id)
                )
              ).to.be.true;
            });
          });
        });
      });
    });
  });
});
