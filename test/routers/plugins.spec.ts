import "mocha";

import axios from "axios";
import { expect } from "chai";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import path from "path";

import { getConfig, stopConfigFileWatcher } from "../../src/config";
import defaultConfig from "../../src/config/default";
import { IConfig } from "../../src/config/schema";
import { PluginCheck, PluginsConfig } from "../../src/routers/plugins";
import { startTestServer, stopTestServer } from "../testServer";

const serverRoute = (route: string): string => {
  const config = getConfig();
  return `http://localhost:${config.server.port}${route}`;
};

const actorPluginSimplePath = path.resolve("./test/plugins/fixtures/actor_plugin.fixture.js");
const actorPluginMetadataPath = path.resolve(
  "./test/plugins/fixtures/actor_plugin_metadata.fixture.js"
);

describe("routers", () => {
  describe("plugins", () => {
    describe("GET / - getPluginsConfig", () => {
      afterEach(() => {
        stopTestServer();
      });

      it("should return correct plugin info when no metadata", async function () {
        const pluginsConfig: IConfig["plugins"] = {
          ...defaultConfig.plugins,
          events: {
            actorCreated: ["actor_plugin_fixture_js"],
            actorCustom: ["actor_plugin_fixture_js"],
            sceneCreated: [],
            sceneCustom: [],
            movieCreated: [],
            studioCreated: [],
            studioCustom: [],
          },
          register: {
            actor_plugin_fixture_js: {
              path: "./test/plugins/fixtures/actor_plugin.fixture.js",
            },
            scene_plugin_fixture_js: {
              path: "./test/plugins/fixtures/scene_plugin.fixture.js",
            },
          },
        };

        await startTestServer.call(this, {
          plugins: pluginsConfig,
        });

        let res: any;
        await expect(
          (async () => {
            res = await axios.get(serverRoute("/api/plugins"));
          })()
        ).to.eventually.be.fulfilled;
        expect(res.data).to.not.be.null;
        const receivedConfig = res.data as PluginsConfig;

        Object.entries(pluginsConfig.events).forEach(([eventName, pluginNames]) => {
          expect(receivedConfig.events).to.have.property(eventName);
          expect(receivedConfig.events[eventName]).to.be.an("array");
          expect(receivedConfig.events[eventName]).to.deep.equal(pluginNames);
        });

        Object.entries(pluginsConfig.register).forEach(([pluginName, plugin]) => {
          expect(receivedConfig.register).to.have.property(pluginName);
          expect(receivedConfig.register[pluginName].id).to.equal(pluginName);
          expect(receivedConfig.register[pluginName].path).to.equal(plugin.path);
          expect(receivedConfig.register[pluginName].args).to.deep.equal({});
          expect(receivedConfig.register[pluginName].requiredVersion).to.equal("");
          expect(receivedConfig.register[pluginName].version).to.equal("");
          expect(receivedConfig.register[pluginName].events).to.deep.equal([]);
          expect(receivedConfig.register[pluginName].authors).to.deep.equal([]);
          expect(receivedConfig.register[pluginName].description).to.equal("");
        });
      });

      it("should return correct plugin info when has metadata", async function () {
        const actorPluginMetadataName = "actor_plugin__metadata_fixture_js";
        const pluginsConfig: IConfig["plugins"] = {
          ...defaultConfig.plugins,
          events: {
            actorCreated: [actorPluginMetadataName],
            actorCustom: [actorPluginMetadataName],
            sceneCreated: [],
            sceneCustom: [],
            movieCreated: [],
            studioCreated: [],
            studioCustom: [],
          },
          register: {
            [actorPluginMetadataName]: {
              path: actorPluginMetadataPath,
            },
          },
        };

        await startTestServer.call(this, {
          plugins: pluginsConfig,
        });

        let res: any;
        await expect(
          (async () => {
            res = await axios.get(serverRoute("/api/plugins"));
          })()
        ).to.eventually.be.fulfilled;
        expect(res.data).to.not.be.null;
        const receivedConfig = res.data as PluginsConfig;

        const actorPluginMetadataFixture = require(actorPluginMetadataPath);
        expect(receivedConfig.register).to.have.property(actorPluginMetadataName);
        const plugin = receivedConfig.register[actorPluginMetadataName];
        expect(plugin.id).to.equal(actorPluginMetadataName);
        expect(plugin.path).to.equal(actorPluginMetadataPath);
        expect(plugin.args).to.deep.equal({});
        expect(plugin.requiredVersion).to.equal(actorPluginMetadataFixture.requiredVersion);
        expect(plugin.name).to.equal(actorPluginMetadataFixture.info.name);
        expect(plugin.version).to.equal(actorPluginMetadataFixture.info.version);
        expect(plugin.events).to.deep.equal(actorPluginMetadataFixture.info.events);
        expect(plugin.authors).to.deep.equal(actorPluginMetadataFixture.info.authors);
        expect(plugin.description).to.equal(actorPluginMetadataFixture.info.description);
      });
    });

    describe("POST / - update plugin config", () => {
      const configJSONFilename = path.resolve("config.test.json");
      const configYAMLFilename = path.resolve("config.test.yaml");

      afterEach(() => {
        stopTestServer();
        stopConfigFileWatcher?.();
        for (const configFilename of [configJSONFilename, configYAMLFilename]) {
          if (existsSync(configFilename)) {
            unlinkSync(configFilename);
          }
          expect(existsSync(configFilename)).to.be.false;
        }
      });

      it("should refuse invalid schema", async function () {
        await startTestServer.call(this);

        await expect(axios.post(serverRoute("/api/plugins"), {})).to.eventually.be.rejected;

        let config = JSON.parse(JSON.stringify(defaultConfig));
        delete config.plugins.events;
        await expect(axios.post(serverRoute("/api/plugins"), config.plugins)).to.eventually.be
          .rejected;

        config = JSON.parse(JSON.stringify(defaultConfig));
        delete config.plugins.register;
        await expect(axios.post(serverRoute("/api/plugins"), config.plugins)).to.eventually.be
          .rejected;

        config = JSON.parse(JSON.stringify(defaultConfig));
        config.plugins.allowActorThumbnailOverwrite = "test";
        await expect(axios.post(serverRoute("/api/plugins"), config.plugins)).to.eventually.be
          .rejected;
      });

      it("should cancel when plugins invalid", async function () {
        let initialConfig = JSON.parse(JSON.stringify(defaultConfig)) as IConfig;
        await startTestServer.call(this, { plugins: initialConfig.plugins });

        expect(getConfig().plugins).to.deep.equal(initialConfig.plugins);

        const testPluginName = "testPlugin";
        const inputConfig = JSON.parse(JSON.stringify(defaultConfig)) as IConfig;
        inputConfig.plugins.register = {
          [testPluginName]: {
            path: "fake path",
          },
        };

        await expect(axios.post(serverRoute("/api/plugins"), inputConfig.plugins)).to.eventually.be
          .rejected;

        expect(getConfig().plugins).to.deep.equal(initialConfig.plugins);
      });

      it("should save,write new config", async function () {
        let initialConfig = JSON.parse(JSON.stringify(defaultConfig)) as IConfig;
        await startTestServer.call(this, { plugins: initialConfig.plugins });

        expect(getConfig().plugins).to.deep.equal(initialConfig.plugins);

        const testPluginName = "testPlugin";
        const inputConfig = JSON.parse(JSON.stringify(defaultConfig)) as IConfig;
        inputConfig.plugins.register = {
          [testPluginName]: {
            path: actorPluginMetadataPath,
          },
        };

        let res: any;
        await expect(
          (async () => {
            res = await axios.post(serverRoute("/api/plugins"), inputConfig.plugins);
          })()
        ).to.eventually.be.fulfilled;
        expect(res.data).to.not.be.null;
        // Check received config contains new register
        const receivedConfig = res.data as PluginsConfig;
        expect(receivedConfig.register).to.have.property(testPluginName);
        expect(receivedConfig.register[testPluginName].path).to.equal(actorPluginMetadataPath);

        // Check current config and config file contain new register
        expect(getConfig().plugins).to.deep.equal(inputConfig.plugins);
        expect(JSON.parse(readFileSync(configJSONFilename, "utf-8")).plugins).to.deep.equal(
          inputConfig.plugins
        );

        // Check that the config file is still being watched, reacts to change
        const secondaryTestConfig = {
          ...getConfig(),
          SECOND_TEST: true,
        };
        expect(getConfig()).to.not.deep.equal(secondaryTestConfig);

        writeFileSync(configJSONFilename, JSON.stringify(secondaryTestConfig), {
          encoding: "utf-8",
        });

        // 3s should be enough to detect file change and reload
        await new Promise((resolve) => setTimeout(resolve, 3 * 1000));

        expect(getConfig()).to.deep.equal(secondaryTestConfig);
      });
    });

    describe("POST /validate - validate a plugin", () => {
      afterEach(() => {
        stopTestServer();
      });

      it("should reject when path is wrong extension", async function () {
        await startTestServer.call(this);

        await expect(
          axios.post(serverRoute("/api/plugins/validate"), {
            path: `${actorPluginMetadataPath}.fake`,
          })
        ).to.eventually.be.rejected;
      });

      it("should reject when path does not exist", async function () {
        await startTestServer.call(this);

        await expect(
          axios.post(serverRoute("/api/plugins/validate"), {
            path: "./fake_path.js",
          })
        ).to.eventually.be.rejected;
      });

      it("should return basic info", async function () {
        await startTestServer.call(this);

        let res: any;
        await expect(
          (async () => {
            res = await axios.post(serverRoute("/api/plugins/validate"), {
              path: actorPluginSimplePath,
            });
          })()
        ).to.eventually.be.fulfilled;
        expect(res.data).to.not.be.null;
        const checkResult = res.data as PluginCheck;

        expect(checkResult.name).to.equal("");
        expect(checkResult.path).to.equal(actorPluginSimplePath);
        expect(checkResult.arguments).to.deep.equal([]);
        expect(checkResult.requiredVersion).to.equal("");
        expect(checkResult.version).to.equal("");
        expect(checkResult.events).to.deep.equal([]);
        expect(checkResult.authors).to.deep.equal([]);
        expect(checkResult.description).to.equal("");
        expect(checkResult.hasValidArgs).to.be.true;
        expect(checkResult.hasValidVersion).to.be.true;
      });

      it("should return info when has metadata", async function () {
        await startTestServer.call(this);

        let res: any;
        await expect(
          (async () => {
            res = await axios.post(serverRoute("/api/plugins/validate"), {
              path: actorPluginMetadataPath,
            });
          })()
        ).to.eventually.be.fulfilled;
        expect(res.data).to.not.be.null;
        const checkResult = res.data as PluginCheck;

        const actorPluginMetadataFixture = require(actorPluginMetadataPath);
        expect(checkResult.path).to.equal(actorPluginMetadataPath);
        expect(checkResult.arguments).to.deep.equal([]);
        expect(checkResult.requiredVersion).to.equal(actorPluginMetadataFixture.requiredVersion);
        expect(checkResult.name).to.equal(actorPluginMetadataFixture.info.name);
        expect(checkResult.version).to.equal(actorPluginMetadataFixture.info.version);
        expect(checkResult.events).to.deep.equal(actorPluginMetadataFixture.info.events);
        expect(checkResult.authors).to.deep.equal(actorPluginMetadataFixture.info.authors);
        expect(checkResult.description).to.equal(actorPluginMetadataFixture.info.description);
        expect(checkResult.hasValidArgs).to.be.true;
        expect(checkResult.hasValidVersion).to.be.true;
      });
    });

    describe("POST /downloadBulk - download plugins", async function () {
      const PDF_URL = "https://file-examples-com.github.io/uploads/2017/10/file-sample_150kB.pdf";
      const PDF_PATH = path.resolve("plugins/file-sample_150kB.pdf");

      const TS_URL = "https://github.com/porn-vault/porn-vault/raw/dev/src/index.ts";
      const TS_PATH = path.resolve("plugins/index.ts");
      const JS_URL = "https://github.com/porn-vault/porn-vault/raw/dev/version.js";
      const JS_PATH = path.resolve("plugins/version.js");

      before(async () => {
        await startTestServer.call(this);
      });

      after(() => {
        stopTestServer();
        for (const filepath of [PDF_PATH, TS_PATH, JS_PATH]) {
          if (existsSync(filepath)) {
            unlinkSync(filepath);
          }
        }
      });

      it("should reject empty array", async () => {
        await expect(
          axios.post(serverRoute("/api/plugins/downloadBulk"), {
            urls: [],
          })
        ).to.eventually.be.rejected;
      });

      it("should reject invalid extension", async () => {
        await expect(
          axios.post(serverRoute("/api/plugins/downloadBulk"), {
            urls: [PDF_URL],
          })
        ).to.eventually.be.rejected;

        expect(existsSync(PDF_PATH)).to.be.false;
      });

      it("should accept valid extension", async () => {
        let res: any;
        await expect(
          (async () => {
            res = await axios.post(serverRoute("/api/plugins/downloadBulk"), {
              urls: [TS_URL, JS_URL],
            });
          })()
        ).to.eventually.be.fulfilled;
        expect(res.data).to.not.be.null;
        const downloadedPlugins = res.data as { id: string; path: string }[];

        expect(downloadedPlugins).to.deep.equal([
          {
            id: "index",
            path: TS_PATH,
          },
          {
            id: "version",
            path: JS_PATH,
          },
        ]);

        expect(existsSync(TS_PATH)).to.be.true;
        expect(existsSync(JS_PATH)).to.be.true;
      });
    });
  });
});
