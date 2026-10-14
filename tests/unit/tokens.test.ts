// Токены: контраст текста и рамок в обеих темах (src/design-system/README.md, «Доступность»),
// одинаковые значения в двух блоках тёмной темы (системная настройка и переключатель).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrast, readTokens, resolve } from "../../src/design-system/tokens/read";

// Vitest не отдаёт CSS через ?raw (стили в тестах выключены) — читаем файл сами
const themes = readTokens(readFileSync("src/design-system/tokens/tokens.css", "utf8"));
const TEXT = ["ink", "ink-2", "ink-3", "pen", "pen-strong", "red-pen", "green-pen", "sym-1-text", "sym-2-text", "sym-3-text"];

describe.each(["light", "dark"] as const)("тема %s", (theme) => {
  const t = themes[theme];
  const paper = resolve(t, "paper");

  it.each(TEXT)("--%s: текст ≥ 4.5:1 к --paper", (name) => {
    expect(contrast(resolve(t, name), paper)).toBeGreaterThanOrEqual(4.5);
  });

  it("--control-border: рамки ≥ 3:1 к --paper", () => {
    expect(contrast(resolve(t, "control-border"), paper)).toBeGreaterThanOrEqual(3);
  });

  it("основной текст читается и на --surface и --paper-2", () => {
    for (const bg of ["surface", "paper-2"]) expect(contrast(resolve(t, "ink"), resolve(t, bg))).toBeGreaterThanOrEqual(7);
  });
});

it("два блока тёмной темы совпадают", () => {
  for (const [name, value] of Object.entries(themes.darkSystem)) expect(themes.dark[name], `--${name}`).toBe(value);
  expect(Object.keys(themes.darkSystem).length).toBeGreaterThan(15);
});
