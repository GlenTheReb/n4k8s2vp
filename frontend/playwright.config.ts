import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.WINDSIGHT_BASE_URL || "http://127.0.0.1:8000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
  webServer: process.env.WINDSIGHT_BASE_URL
    ? undefined
    : {
        command:
          "uv run --project .. uvicorn app:app --app-dir .. --host 127.0.0.1 --port 8000",
        url: "http://127.0.0.1:8000/api/health",
        reuseExistingServer: true,
      },
});
