import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // NOTE: Update this to your final App Store / Play Store bundle ID before release.
  // It must be unique and never change once you publish.
  appId: "app.marketingteam.mta",
  appName: "Marketing Team",

  // This repo builds the client into dist/public
  webDir: "dist/public",
  bundledWebRuntime: false,

  server: {
    // Helps avoid cleartext traffic issues when the app makes https requests.
    androidScheme: "https",
  },
};

export default config;

