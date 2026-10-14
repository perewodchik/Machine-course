// Модульные тесты: рядом с кодом (*.test.ts) и сквозные в tests/unit. E2E — Playwright в tests/e2e.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}", "tests/unit/**/*.test.ts", "scripts/**/*.test.ts"],
    environment: "node",
  },
});
