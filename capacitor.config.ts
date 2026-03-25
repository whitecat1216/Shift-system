import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.shiftpilot.app",
  appName: "Shift Pilot",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
};

export default config;
