const webpack = require('webpack');

module.exports = function override(config, env) {
  // Adding fallbacks for Node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    path: require.resolve('path-browserify'),
    os: require.resolve('os-browserify/browser'),
    crypto: require.resolve('crypto-browserify'),
  };

  return config;
};