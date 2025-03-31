import 'dotenv/config';

export default {
  expo: {
    name: "Slot Game App",
    slug: "slot-game-app",
    version: process.env.APP_VERSION || "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#6200EA"
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.slotgame.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#6200EA"
      },
      package: "com.slotgame.app"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      apiUrl: process.env.API_URL || "http://localhost:3010/api/v1",
      env: process.env.NODE_ENV || "development",
      defaultGameId: process.env.DEFAULT_GAME_ID || "1e609c12-ac58-444a-a589-06228dd908bd"
    },
    // 開啟新架構
    newArchEnabled: true
  }
}; 