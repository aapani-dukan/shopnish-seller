const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// यह लाइन CommonJS और ES Modules के टकराव को सुलझाती है
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

module.exports = config;