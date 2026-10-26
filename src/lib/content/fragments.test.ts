// Банк фрагментов V.2 (S5.01): каждый фрагмент — формула content/formulas/ml с шагами и подложенными ошибками;
// из каждого собираются не меньше двух задач трёх видов, у каждой ровно один верный вариант, тексты разбираются KaTeX.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { renderInline } from "../../markdown/core/inline";
import { ru } from "./catalog";
import { FRAGMENTS, fragmentPool, fragmentTask, type FragmentAsk } from "./fragments";
import type { Formula } from "./types";

const root = path.resolve(__dirname, "../../..");
const yamlDir = (d: string) => readdirSync(path.join(root, d)).map((f) => parse(readFileSync(path.join(root, d, f), "utf8")));
const formulas = new Map<string, Formula>(yamlDir("content/formulas/ml").map((f: Formula) => [f.id, f]));
const titles = new Map<string, string>([
  ...yamlDir("content/concepts").flat().map((c: { id: string; title: { ru: string } }) => [c.id, c.title.ru] as const),
  ...yamlDir("content/formulas/rules").map((r: { id: string; title: { ru: string } }) => [r.id, r.title.ru] as const),
]);
const titleOf = (id: string) => {
  const t = titles.get(id);
  if (!t) throw new Error(`нет названия у ${id}`);
  return t;
};
const pool = fragmentPool([...formulas.values()]);

/** Все задачи фрагмента: «какое правило» по каждому шагу с обоснованием, «восстанови» и «найди ошибку» по шагам с ошибками. */
function tasksOf(f: Formula) {
  return (f.derivation?.steps ?? []).flatMap((s, i) => {
    const asks: FragmentAsk[] = s.mutations?.length ? ["rule", "fill", "error"] : ["rule"];
    return asks.map((ask) => ({ ask, step: i + 1, spec: fragmentTask(f, { ask, step: i + 1, titleOf, pool }) }));
  });
}

describe("банк фрагментов V.2", () => {
  it("восемь фрагментов из карточки V.2, все в реестре, по четырём курсам ML", () => {
    expect(FRAGMENTS).toHaveLength(8);
    for (const e of FRAGMENTS) expect(formulas.has(e.formula), e.formula).toBe(true);
    expect(new Set(FRAGMENTS.map((e) => e.course))).toEqual(new Set(["ml-basics", "ml-classic", "deep-learning", "unsupervised"]));
  });

  it("у каждого фрагмента не меньше двух шагов с подложенными ошибками и ссылка на CS229", () => {
    for (const e of FRAGMENTS) {
      const f = formulas.get(e.formula)!;
      expect(f.cs229?.length, f.id).toBeGreaterThan(0);
      expect((f.derivation?.steps ?? []).filter((s) => s.mutations?.length).length, f.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("задачи: ровно один верный вариант, варианты различны, «найди ошибку» указывает на подменённую строку", () => {
    for (const e of FRAGMENTS) {
      const f = formulas.get(e.formula)!;
      const tasks = tasksOf(f);
      expect(tasks.length, f.id).toBeGreaterThanOrEqual(3);
      for (const t of tasks) {
        expect(t.spec.options.filter((o) => o.correct), `${f.id} ${t.ask} ${t.step}`).toHaveLength(1);
        expect(new Set(t.spec.options.map((o) => o.text)).size).toBe(t.spec.options.length);
        expect(t.spec.options.length).toBeGreaterThanOrEqual(2);
        if (t.ask === "error") expect(t.spec.options.findIndex((o) => o.correct)).toBe(t.step - 1);
        if (t.ask === "fill") {
          const s = f.derivation!.steps[t.step - 1]!;
          expect(t.spec.options.find((o) => o.correct)!.why).toContain(s.note ? ru(s.note).slice(0, 20) : "Верно");
        }
      }
    }
  });

  it("все тексты задач разбираются KaTeX", () => {
    for (const e of FRAGMENTS)
      for (const t of tasksOf(formulas.get(e.formula)!)) {
        for (const text of [t.spec.prompt, ...t.spec.options.flatMap((o) => [o.text, o.why])]) {
          const html = renderInline(text);
          expect(html, text).not.toContain("katex-error");
        }
      }
  });

  it("неверная подмена в «найди ошибку» не совпадает с верной строкой", () => {
    for (const e of FRAGMENTS) {
      const f = formulas.get(e.formula)!;
      for (const s of f.derivation?.steps ?? []) for (const m of s.mutations ?? []) expect(m.tex).not.toBe(s.tex);
    }
  });
});
