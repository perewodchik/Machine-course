// Аудит генераторов задач (S7.10, AUDIT-2026-11-15.md, находки 7–9 и 16): у выбора не меньше трёх вариантов;
// разных условий на 60 seed не меньше, чем variants в уроках; в текстах нет длинных хвостов чисел и «e^{-0}»;
// отзыв на неверный числовой ответ не печатает верное число.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generators } from "./generators";
import { formatNumber } from "./parse";
import type { ExerciseSpec } from "./types";

const SEEDS = Array.from({ length: 60 }, (_, i) => i + 1);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".mdx") ? [p] : [];
  });
}

/** Сколько вариантов просят уроки: наибольшее variants={…} у каждого генератора. */
function requestedVariants(): Map<string, number> {
  const out = new Map<string, number>();
  for (const f of walk("content/courses")) {
    for (const m of readFileSync(f, "utf8").matchAll(/<Exercise\s+gen="([^"]+)"[^>]*?variants=\{(\d+)\}/g)) {
      out.set(m[1]!, Math.max(out.get(m[1]!) ?? 0, Number(m[2])));
    }
  }
  return out;
}

const texts = (s: ExerciseSpec): string[] => {
  const t = [s.prompt, ...(s.hints ?? []), s.right ?? "", s.wrong ?? ""];
  if ("options" in s) for (const o of s.options) t.push(o.text, o.why);
  if ("label" in s && typeof s.label === "string") t.push(s.label);
  return t;
};

describe("аудит генераторов", () => {
  const variants = requestedVariants();

  it.each([...generators.keys()])("%s", (id) => {
    const g = generators.get(id)!;
    const prompts = new Set<string>();
    for (const seed of SEEDS) {
      const s = g.make(seed);
      prompts.add(JSON.stringify([s.prompt, "options" in s ? s.options.map((o) => o.text) : null]));
      if (s.kind === "choice" || s.kind === "predict") expect(s.options.length, `seed ${seed}: вариантов выбора`).toBeGreaterThanOrEqual(3);
      for (const t of texts(s)) {
        expect(t, `seed ${seed}: длинный хвост числа`).not.toMatch(/\d\.\d{6,}/);
        expect(t, `seed ${seed}: e^{-0}`).not.toMatch(/e\^\{-0\}/);
      }
      if (s.kind === "numeric" && s.wrong) {
        const shown = formatNumber(s.answer);
        // верное число не печатаем в отзыве на ошибку (короткие целые вроде 2 встречаются в тексте по другим причинам)
        if (shown.replace(/[−-]/, "").length >= 3) expect(s.wrong, `seed ${seed}: верный ответ ${shown} в отзыве на ошибку`).not.toContain(shown);
      }
    }
    const need = variants.get(id) ?? 0;
    expect(prompts.size, `разных условий на 60 seed, урок просит variants={${need}}`).toBeGreaterThanOrEqual(need);
  });
});
