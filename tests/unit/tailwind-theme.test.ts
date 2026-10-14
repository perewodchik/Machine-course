// Tailwind 4 генерирует только встреченные классы, поэтому тест компилирует тему на фикстуре,
// где есть и наши классы, и классы дефолтной палитры (S1.03).
import { readFileSync } from "node:fs";
import path from "node:path";
import { compile } from "@tailwindcss/node";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "../..");
const themeDir = path.join(root, "src/design-system/tokens");

async function buildFixture(): Promise<string> {
  const html = readFileSync(path.join(root, "tests/fixtures/tailwind/sample.html"), "utf8");
  const candidates = [...html.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/));
  const compiler = await compile(readFileSync(path.join(themeDir, "theme.css"), "utf8"), {
    base: themeDir,
    onDependency: () => {},
  });
  return compiler.build(candidates);
}

describe("тема Tailwind из токенов", () => {
  it("генерирует наши классы", async () => {
    const css = await buildFixture();
    for (const cls of [".bg-paper", ".text-ink", ".rounded-panel", ".text-pen", ".font-ui"]) {
      expect(css).toContain(cls);
    }
  });

  it("не генерирует дефолтную палитру и тени", async () => {
    const css = await buildFixture();
    expect(css).not.toContain(".bg-indigo-500");
    expect(css).not.toContain(".shadow-lg");
  });
});
