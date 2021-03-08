import "mocha";

import { expect } from "chai";
import { existsSync, readFileSync, unlinkSync } from "fs";
import path from "path";

import { ApplyStudioLabelsEnum } from "../../../src/config/schema";
import { MAX_STUDIO_RECURSIVE_CALLS, onStudioCreate } from "../../../src/plugins/events/studio";
import { indexImages } from "../../../src/search/image";
import Image from "../../../src/types/image";
import Label from "../../../src/types/label";
import Studio from "../../../src/types/studio";
import { startTestServer, stopTestServer } from "../../testServer";
import { CONFIG_FIXTURES } from "../initPluginFixtures";
import { imageCollection, labelCollection } from "./../../../src/database";
import { resolvePlugin } from "../../../src/plugins";

describe("plugins", () => {
  describe("events", () => {
    describe("studio", () => {
      afterEach(() => {
        stopTestServer();
      });

      describe("basic run", () => {
        CONFIG_FIXTURES.forEach((configFixture) => {
          ["studioCreated", "studioCustom"].forEach((ev: string) => {
            const event: "studioCreated" | "studioCustom" = ev as any;
            const plugins = configFixture.config.plugins.events[event];
            expect(plugins).to.have.lengthOf(1); // This test should only run 1 plugin for the given event
            const [pluginName] = resolvePlugin(plugins[0]);

            const scenePluginFixture = require(path.resolve(
              configFixture.config.plugins.register[pluginName].path
            ));

            it(`event '${event}': runs fixture plugin, changes properties`, async function () {
              await startTestServer.call(this, {
                plugins: configFixture.config.plugins,
              });

              const existingImage = new Image("existing image");
              existingImage.path = path.resolve("test/fixtures/files/image001.jpg");
              await imageCollection.upsert(existingImage._id, existingImage);
              await indexImages([existingImage]);

              const initialName = "initial studio name";
              let studio = new Studio(initialName);

              expect(studio.name).to.equal(initialName);

              expect(studio.name).to.not.equal(scenePluginFixture.result.name);
              expect(studio.description).to.not.equal(scenePluginFixture.result.description);
              expect(studio.favorite).to.not.equal(scenePluginFixture.result.favorite);
              expect(studio.bookmark).to.not.equal(scenePluginFixture.result.bookmark);
              expect(studio.aliases).to.not.deep.equal(scenePluginFixture.result.aliases);
              expect(studio.thumbnail).to.be.null;

              studio = await onStudioCreate(studio, [], event);

              expect(studio.name).to.equal(scenePluginFixture.result.name);
              expect(studio.description).to.equal(scenePluginFixture.result.description);
              expect(studio.favorite).to.equal(scenePluginFixture.result.favorite);
              expect(studio.bookmark).to.equal(scenePluginFixture.result.bookmark);
              expect(studio.aliases).to.deep.equal(scenePluginFixture.result.aliases);
              expect(studio.thumbnail).to.be.a("string");

              const updatedImage = await Image.getById(existingImage._id);
              expect(updatedImage).to.not.be.null;
              expect((updatedImage as Image).studio).to.equal(studio._id);
            });

            describe("labels", () => {
              async function seedDb() {
                expect(await Image.getAll()).to.be.empty;

                const studioLabel = new Label("existing studio label");
                await labelCollection.upsert(studioLabel._id, studioLabel);

                const expectedLabels = [studioLabel._id];

                return { studioLabel, expectedLabels };
              }

              it(`config ${configFixture.name}: event '${event}': should not add labels`, async function () {
                await startTestServer.call(this, {
                  plugins: configFixture.config.plugins,
                  matching: {
                    applyActorLabels: [],
                    applyStudioLabels: [],
                  },
                });

                const { studioLabel } = await seedDb();

                let studio = new Studio("initial studio name");

                const studioLabels: string[] = [];
                studio = await onStudioCreate(studio, studioLabels, event);
                expect(studio.thumbnail).to.be.a("string");

                // Plugin created 1 thumbnail 2 extra
                const images = await Image.getAll();
                expect(images).to.have.lengthOf(3);

                // Did not attach labels to any images
                for (const image of images) {
                  expect(await Image.getLabels(image)).to.be.empty;
                }

                // Only contains direct labels
                expect(studioLabels).to.have.lengthOf(1);
                expect(studioLabels[0]).to.equal(studioLabel._id);
              });

              it(`config ${configFixture.name}: event '${event}': should add labels`, async function () {
                await startTestServer.call(this, {
                  plugins: configFixture.config.plugins,
                  matching: {
                    applyActorLabels: [],
                    applyStudioLabels: [
                      ApplyStudioLabelsEnum.enum["plugin:studio:create"],
                      ApplyStudioLabelsEnum.enum["plugin:studio:custom"],
                    ],
                  },
                });

                const { studioLabel } = await seedDb();

                let studio = new Studio("initial studio name");

                const studioLabels: string[] = [];
                studio = await onStudioCreate(studio, studioLabels, event);
                expect(studio.thumbnail).to.be.a("string");

                // Plugin created 1 thumbnail 2 extra
                const images = await Image.getAll();
                expect(images).to.have.lengthOf(3);

                // Should labels to any images that are not thumbnails
                for (const image of images) {
                  // Only non thumbnail images are indexed and could be applied labels
                  if (!image.name.includes("thumbnail")) {
                    const imageLabels = await Image.getLabels(image);
                    expect(imageLabels).to.have.lengthOf(1);
                    expect(imageLabels[0]._id).to.equal(studioLabel._id);
                  }
                }

                // Only contains direct labels
                expect(studioLabels).to.have.lengthOf(1);
                expect(studioLabels[0]).to.equal(studioLabel._id);
              });
            });
          });
        });
      });

      describe("recursive checks", () => {
        const callCountPath = "./test/plugins/fixtures/studio/call_count";

        const getCallCount = () => {
          if (existsSync(callCountPath)) {
            return parseInt(readFileSync(callCountPath, "utf-8"));
          }
          return 0;
        };

        function cleanup() {
          if (existsSync(callCountPath)) {
            unlinkSync(callCountPath);
          }
        }

        beforeEach(() => {
          cleanup();
        });

        afterEach(() => {
          cleanup();
        });

        ["studioCreated", "studioCustom"].forEach((ev: string) => {
          const event: "studioCreated" | "studioCustom" = ev as any;
          it(`event '${event}': does not create parent when !plugins.createMissingStudios`, async function () {
            expect(getCallCount()).to.equal(0);

            await startTestServer.call(this, {
              plugins: {
                events: {
                  actorCreated: [],
                  actorCustom: [],
                  sceneCreated: [],
                  sceneCustom: [],
                  movieCreated: [],
                  studioCreated: ["studio_plugin_recursive"],
                  studioCustom: ["studio_plugin_recursive"],
                },
                register: {
                  studio_plugin_recursive: {
                    path: "./test/plugins/fixtures/studio/recursive.fixture.js",
                  },
                },
                createMissingStudios: false,
              },
            });

            let studio = new Studio("studio_1");

            await onStudioCreate(studio, [], event);
            expect(getCallCount()).to.equal(1);
          });

          it(`event '${event}': creates parents, does not call recursively more than ${
            1 + MAX_STUDIO_RECURSIVE_CALLS
          }`, async function () {
            expect(getCallCount()).to.equal(0);

            await startTestServer.call(this, {
              plugins: {
                events: {
                  actorCreated: [],
                  actorCustom: [],
                  sceneCreated: [],
                  sceneCustom: [],
                  movieCreated: [],
                  studioCreated: ["studio_plugin_recursive"],
                  studioCustom: ["studio_plugin_recursive"],
                },
                register: {
                  studio_plugin_recursive: {
                    path: "./test/plugins/fixtures/studio/recursive.fixture.js",
                  },
                },
                createMissingStudios: true,
              },
            });

            let studio = new Studio("studio_1");

            await onStudioCreate(studio, [], event);
            // The total call count should be the initial call + recursive calls
            expect(getCallCount()).to.equal(1 + MAX_STUDIO_RECURSIVE_CALLS);
          });
        });
      });
    });
  });
});
