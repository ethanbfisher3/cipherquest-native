const path = require("path")
const { getDefaultConfig } = require("expo/metro-config")

const config = getDefaultConfig(__dirname)
const localNodeModules = path.resolve(__dirname, "node_modules")

// Force Metro to resolve packages from this app's node_modules.
config.resolver.nodeModulesPaths = [localNodeModules]
config.resolver.disableHierarchicalLookup = true
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  "react-native-svg": path.resolve(localNodeModules, "react-native-svg"),
}

module.exports = config
