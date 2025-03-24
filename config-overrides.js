const { override, addWebpackAlias } = require('customize-cra');

module.exports = override(
  addWebpackAlias({
    'assert': require.resolve('assert/'),
    'crypto': require.resolve('crypto-browserify'),
    'https': require.resolve('https-browserify'),
    'stream': require.resolve('stream-browserify'),
    'http': require.resolve('stream-http'),
    'url': require.resolve('url/'),
    'util': require.resolve('util/'),
    'zlib': require.resolve('browserify-zlib')
  })
);