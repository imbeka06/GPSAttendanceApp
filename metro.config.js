const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase v11+ uses package exports that Metro cannot resolve correctly.
// Disabling this prevents the "@firebase/util" bundling error.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
