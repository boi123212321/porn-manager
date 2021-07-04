const applyDev = require('./config/dev')

module.exports = {
  transpileDependencies: ["vuetify"],
  chainWebpack: (config) => {
    if (process.env.NODE_ENV === "development") {
      applyDev(config);
    }
  },
};
