// E2E и доступность. Сайт заранее собран (`npm run build`), сервер — `astro preview`.
// @playwright/test ровно 1.56.1: его Chromium (chromium-1194) лежит в /opt/pw-browsers (PLAYWRIGHT_BROWSERS_PATH).
import { defineConfig, devices } from "@playwright/test";

const port = 4321;

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0, // флейки не чинить повтором: искать причину
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    locale: "ru-RU",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    // узкий экран с сенсором: pointer: coarse включает цели касания 44 px
    { name: "mobile", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    // --ignore-lock: обычный сервер на переднем плане. Без флага Astro 7 под ИИ-агентом сам уходит в фон,
    // Playwright видит «сервер завершился» и не может его остановить.
    command: `npx astro preview --port ${port} --ignore-lock`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
