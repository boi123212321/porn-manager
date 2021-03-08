import "mocha";

import { expect } from "chai";
import path from "path";

import { ApplyActorLabelsEnum } from "../../../src/config/schema";
import { onActorCreate } from "../../../src/plugins/events/actor";
import { indexActors } from "../../../src/search/actor";
import { indexImages } from "../../../src/search/image";
import Actor from "../../../src/types/actor";
import Image from "../../../src/types/image";
import Label from "../../../src/types/label";
import { startTestServer, stopTestServer } from "../../testServer";
import { CONFIG_FIXTURES } from "../initPluginFixtures";
import { actorCollection, imageCollection, labelCollection } from "./../../../src/database";
import { resolvePlugin } from "../../../src/plugins";

describe("plugins", () => {
  describe("events", () => {
    describe("actor", () => {
      afterEach(() => {
        stopTestServer();
      });

      CONFIG_FIXTURES.forEach((configFixture) => {
        ["actorCreated", "actorCustom"].forEach((ev: string) => {
          const event: "actorCreated" | "actorCustom" = ev as any;
          const plugins = configFixture.config.plugins.events[event];
          expect(plugins).to.have.lengthOf(1); // This test should only run 1 plugin for the given event
          const [pluginName] = resolvePlugin(plugins[0]);

          const actorPluginFixture = require(path.resolve(
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
            expect(await Image.getActors(existingImage)).to.have.lengthOf(0);

            const initialName = "initial actor name";
            const initialAliases = [];
            let actor = new Actor(initialName, initialAliases);

            expect(actor.name).to.equal(initialName);
            expect(actor.aliases).to.deep.equal(initialAliases);

            expect(actor.name).to.not.equal(actorPluginFixture.result.name);
            expect(actor.bornOn).to.not.equal(actorPluginFixture.result.bornOn);
            expect(actor.aliases).to.not.deep.equal(actorPluginFixture.result.aliases);
            expect(actor.rating).to.not.equal(actorPluginFixture.result.rating);
            expect(actor.favorite).to.not.equal(actorPluginFixture.result.favorite);
            expect(actor.bookmark).to.not.equal(actorPluginFixture.result.bookmark);
            expect(actor.nationality).to.not.equal(actorPluginFixture.result.nationality);
            expect(actor.thumbnail).to.be.null;

            const result = await onActorCreate(actor, [], event);
            actor = result.actor;

            expect(actor.name).to.equal(actorPluginFixture.result.name);
            expect(actor.bornOn).to.equal(actorPluginFixture.result.bornOn);
            expect(actor.aliases).to.deep.equal(actorPluginFixture.result.aliases);
            expect(actor.rating).to.equal(actorPluginFixture.result.rating);
            expect(actor.favorite).to.equal(actorPluginFixture.result.favorite);
            expect(actor.bookmark).to.equal(actorPluginFixture.result.bookmark);
            expect(actor.nationality).to.equal(actorPluginFixture.result.nationality);
            expect(actor.thumbnail).to.be.a("string");

            actorCollection.upsert(actor._id, actor);
            await indexActors([actor]);

            const existingImageActors = await Image.getActors(existingImage);
            expect(existingImageActors).to.have.lengthOf(1);
            expect(existingImageActors[0]._id).to.equal(actor._id);
          });

          describe("labels", () => {
            async function seedDb() {
              expect(await Image.getAll()).to.be.empty;

              // Use the same name as the plugin
              const actorLabel = new Label("existing actor label");
              await labelCollection.upsert(actorLabel._id, actorLabel);

              return { actorLabel };
            }

            it(`config ${configFixture.name}: event '${event}': should not add labels`, async function () {
              await startTestServer.call(this, {
                plugins: configFixture.config.plugins,
                matching: {
                  applyActorLabels: [],
                },
              });

              const { actorLabel } = await seedDb();

              let actor = new Actor("initial actor name", []);
              expect(actor.thumbnail).to.be.null;

              const actorLabels: string[] = [];

              const result = await onActorCreate(actor, actorLabels, event);
              actor = result.actor;

              await result.commit();

              expect(actor.thumbnail).to.be.a("string");

              // Plugin created 1 thumbnail 2 extra
              const images = await Image.getAll();
              expect(images).to.have.lengthOf(3);

              // Did not attach actor labels to any images
              for (const image of images) {
                expect(await Image.getLabels(image)).to.be.empty;
              }

              expect(actorLabels).to.have.lengthOf(1);
              expect(actorLabels[0]).to.equal(actorLabel._id);
            });

            it(`config ${configFixture.name}: event '${event}': should add labels`, async function () {
              await startTestServer.call(this, {
                plugins: configFixture.config.plugins,
                matching: {
                  applyActorLabels: [
                    ApplyActorLabelsEnum.enum["plugin:actor:create"],
                    ApplyActorLabelsEnum.enum["plugin:actor:custom"],
                  ],
                },
              });

              const { actorLabel } = await seedDb();

              let actor = new Actor("initial actor name", []);
              expect(actor.thumbnail).to.be.null;

              const actorLabels: string[] = [];

              const result = await onActorCreate(actor, actorLabels, event);
              actor = result.actor;

              await result.commit();

              expect(actor.thumbnail).to.be.a("string");

              // Plugin created 1 thumbnail 2 extra
              const images = await Image.getAll();
              expect(images).to.have.lengthOf(3);

              // Did attach actor labels to images
              for (const image of images) {
                // Only non thumbnail images are indexed and could be applied labels
                if (!image.name.includes("thumbnail")) {
                  const imageLabels = await Image.getLabels(image);
                  expect(imageLabels).to.have.lengthOf(1);
                  expect(imageLabels[0]._id).to.equal(actorLabel._id);
                }
              }

              expect(actorLabels).to.have.lengthOf(1);
              expect(actorLabels[0]).to.equal(actorLabel._id);
            });
          });
        });
      });
    });
  });
});
