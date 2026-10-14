// Заголовки Cloudflare Pages (S1.12, ADR 0003): astro preview не читает public/_headers, поэтому правила
// сверяются здесь, а на живом превью — curl -I.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "../..");

/** Разбор формата _headers: строка без отступа — путь, строки с отступом — «Имя: значение», # — комментарий. */
function parseHeaders(text: string): Map<string, Record<string, string>> {
  const rules = new Map<string, Record<string, string>>();
  let current: Record<string, string> | undefined;
  for (const line of text.split("\n")) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      current = {};
      rules.set(line.trim(), current);
    } else {
      const i = line.indexOf(":");
      current![line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return rules;
}

const rules = parseHeaders(readFileSync(path.join(root, "public/_headers"), "utf8"));

describe("public/_headers", () => {
  it("COOP и COEP на всех путях — для SharedArrayBuffer в Pyodide", () => {
    expect(rules.get("/*")).toMatchObject({
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    });
  });

  it.each(["/_astro/*", "/py/*"])("постоянный кэш для %s", (route) => {
    expect(rules.get(route)?.["Cache-Control"]).toBe("public, max-age=31536000, immutable");
  });
});
