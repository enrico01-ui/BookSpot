import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./src/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Cek tampilan mobile cukup di smoke test, supaya suite tidak dua kali lebih lama
    {
      name: "mobile",
      testMatch: /home\.spec\.ts/,
      use: { ...devices["Pixel 7"] },
    },
  ],

  webServer: [
    {
      // Backend memakai .env.test (NODE_ENV=test -> rate limit longgar).
      // reuseExistingServer: false sengaja: kalau backend dev (database dev,
      // rate limit 5 login) masih jalan di port 4000, Playwright berhenti dengan error
      // alih-alih diam-diam menguji server yang salah.
      command: "npm run dev:e2e",
      cwd: "../backend",
      url: "http://localhost:4000/api/health",
      reuseExistingServer: false,
      timeout: 60_000,
      env: { NODE_ENV: "test", PORT: "4000" },
    },
    {
      command: "npm run dev",
      url: "http://localhost:5173",
      reuseExistingServer: !isCI,
      timeout: 60_000,
    },
  ],
});