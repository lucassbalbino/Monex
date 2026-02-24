const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the monorepo root so Metro can find packages/shared
config.watchFolders = [monorepoRoot];

// 2. Tell Metro where to find node_modules (mobile's own + monorepo root)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Ensure packages/shared is not treated as an external package
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
