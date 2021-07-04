const endpoints = ["/api", "/assets", "/previews", "/dvd-renderer", "/flag"];

const proxy = endpoints.reduce((prox, endpoint) => {
  prox[endpoint] = {
    target: "http://localhost:3000",
  };
  return prox;
}, {});

module.exports = (config) => {
  config.devServer.proxy(proxy);
};
