module.exports = {
  name: "Streamora",
  slug: "streamora",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#000000"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.streamora.app"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#000000"
    },
    package: "com.streamora.app"
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  extra: {
    eas: {
      projectId: "your-project-id"
    }
  },
  plugins: [
    "expo-notifications",
    "expo-router"
  ],
  scheme: "streamora", // Add scheme for deep linking
  experiments: {
    tsconfigPaths: true
  }
};