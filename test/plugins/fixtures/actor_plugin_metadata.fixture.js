const plugin = async (ctx) => {
  return await require("./actor_plugin.fixture.js")(ctx);
};

plugin.result = require("./actor_plugin.fixture.js").result;

plugin.requiredVersion = ">=0.27.0";

plugin.info = {
  events: ["actorCreated", "actorCustom"],
  arguments: [],
  version: "1.0.0",
  authors: ["test"],
  name: "actor_plugin_metadata",
  description: "test desc",
};

module.exports = plugin;
