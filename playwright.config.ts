import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

/**
 * A pre-installed Chromium can be pointed at with PW_CHROMIUM (the cloud container ships one at
 * /opt/pw-browsers); otherwise Playwright's own managed browser is used (`npx playwright install chromium`).
 */
const preinstalled = ["/opt/pw-browsers/chromium-1243/chrome-linux64/chrome"].find((p) => existsSync(p));
const executablePath = process.env.PW_CHROMIUM ?? preinstalled;
const launchOptions = executablePath ? { executablePath, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } : { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] };

/**
 * End-to-end tests run against the static export in ./out (what ships), served by `serve`.
 * Run `npm run build` first, then `npm test`.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: 0,
  workers: 2,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    launchOptions,
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npx serve out -l 4173 --no-clipboard",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
});
