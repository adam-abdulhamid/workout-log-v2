import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { outputFolder: "./playwright-report" }]],
  outputDir: "./test-results",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },


  projects: [
    // Auth setup - runs first to authenticate
    {
      name: "auth-setup",
      testMatch: /auth\.setup\.ts/,
      testDir: "./fixtures",
    },

    // Data setup - seeds test data after authentication
    {
      name: "data-setup",
      testMatch: /test-data\.setup\.ts/,
      testDir: "./fixtures",
      use: {
        storageState: "./e2e/.auth/user.json",
      },
      dependencies: ["auth-setup"],
    },

    // Mobile viewport (using Chromium with mobile viewport)
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
        storageState: "./e2e/.auth/user.json",
      },
      dependencies: ["data-setup"],
    },

    // Desktop viewport (standard)
    {
      name: "desktop-chrome",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        storageState: "./e2e/.auth/user.json",
      },
      dependencies: ["data-setup"],
    },

    // Desktop large viewport
    {
      name: "desktop-large",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
        storageState: "./e2e/.auth/user.json",
      },
      dependencies: ["data-setup"],
    },
  ],

  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
