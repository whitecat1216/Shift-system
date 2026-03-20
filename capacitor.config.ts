import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.hotelshift.app",
  appName: "Hotel Shift AI",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
};

export default config;
