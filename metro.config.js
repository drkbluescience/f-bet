const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push('db', 'mp3', 'ttf', 'obj', 'png', 'jpg');

// Add support for Node.js modules
config.resolver.nodeModulesPaths = [
  ...config.resolver.nodeModulesPaths,
  './node_modules',
];

// Configure resolver for better module resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add alias for better imports
config.resolver.alias = {
  '@': './src',
  '@/components': './src/components',
  '@/screens': './src/screens',
  '@/services': './src/services',
  '@/types': './src/types',
  '@/utils': './src/utils',
  '@/hooks': './src/hooks',
  '@/constants': './src/constants',
  '@/navigation': './src/navigation',
};

// Fix Supabase module resolution issues
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Configure transformer for better web support
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Add web-specific configuration and polyfills
config.resolver.alias = {
  ...config.resolver.alias,
  // Fix stream module for web
  'stream': 'readable-stream',
  // Fix buffer module for web
  'buffer': '@craftzdog/react-native-buffer',
  // Fix path module for web
  'path': 'path-browserify',
  // Fix os module for web
  'os': 'os-browserify/browser',
};

// Add source extensions for better module resolution
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs', 'mjs'];

// Configure for Supabase modules
config.resolver.unstable_enableSymlinks = false;

module.exports = config;
