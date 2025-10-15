module.exports = function override(config) {
  config.resolve.fallback = {
    http: false,
    https: false,
    util: false,
    zlib: false,
    stream: false,
    url: false,
    assert: false
  };
  return config;
};
