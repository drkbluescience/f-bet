const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          '@supabase/supabase-js',
          '@supabase/postgrest-js',
          '@supabase/gotrue-js',
          '@supabase/realtime-js',
          '@supabase/storage-js'
        ]
      }
    },
    argv
  );

  // Add fallbacks for Node.js modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "crypto": false, // Use native Web Crypto API instead
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer"),
    "util": require.resolve("util"),
    "url": require.resolve("url"),
    "querystring": require.resolve("querystring-es3"),
    "process": require.resolve("process/browser"),
    "path": require.resolve("path-browserify"),
    "os": require.resolve("os-browserify/browser"),
    "fs": false,
    "net": false,
    "tls": false,
    "http": false,
    "https": false,
    "zlib": false,
    "assert": false,
  };

  // Add plugins for polyfills
  const webpack = require('webpack');
  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    })
  );

  // Ensure proper module resolution
  config.resolve.alias = {
    ...config.resolve.alias,
    '@supabase/postgrest-js': require.resolve('@supabase/postgrest-js'),
    '@supabase/gotrue-js': require.resolve('@supabase/gotrue-js'),
    '@supabase/realtime-js': require.resolve('@supabase/realtime-js'),
    '@supabase/storage-js': require.resolve('@supabase/storage-js'),
  };

  return config;
};
