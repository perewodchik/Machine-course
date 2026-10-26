// Карта готовности (S5.02): content/readiness.yaml совпадает со строками «Вход» программ курсов ML; диапазоны номеров
// разворачиваются по порядку курса; задачи V.2 считаются по первой попытке.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { expandNumbers, fragmentScore, toRefresh, v2Text, verdictText } from "./readiness";

const root = path.resolve(__dirname, "../../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");
const modules = (parse(read("content/courses/foundations/course.yaml")) as { modules: string[] }).modules;
const order = modules.flatMap((m) => (parse(read(`content/courses/foundations/${m}/module.yaml`)) as { lessons: { number: string }[] }).lessons.map((l) => l.number));
const readiness = parse(read("content/readiness.yaml")) as { courses: { course: string; math: string[] }[] };

/** Номера уроков математики из строки программы курса: «III.2», «I.9–I.11», «II.8–II.9★». */
function mathInReadme(course: string): string[] {
  const text = read(`docs/program/${course}/README.md`);
  const line = course === "ml-basics" ? /Нужны уроки математики: ([^\n]*?)\. Урок/.exec(text)![1]! : /^\*\*Вход:\*\*.*?Математика: ([^\n]*)$/m.exec(text)![1]!;
  const num = String.raw`(?:0|I{1,3}|IV|V)\.\d+`;
  return [...line.matchAll(new RegExp(`${num}(?:\\s*–\\s*${num})?★?`, "g"))].map((m) => m[0]);
}

describe("карта готовности", () => {
  it("диапазоны разворачиваются по порядку курса, ★ — пометка", () => {
    expect(expandNumbers(["I.9–I.11"], order)).toEqual(["I.9", "I.10", "I.11"]);
    expect(expandNumbers(["II.8–II.9★", "V.1"], order)).toEqual(["II.8", "II.9", "V.1"]);
    expect(() => expandNumbers(["IV.9"], order)).toThrow("нет урока IV.9");
  });

  it("списки уроков совпадают со строками «Вход» программ курсов", () => {
    expect(readiness.courses.map((c) => c.course)).toEqual(["ml-basics", "ml-classic", "ml-tabular", "deep-learning", "unsupervised", "rl", "llm"]);
    for (const c of readiness.courses) expect(new Set(expandNumbers(c.math, order)), c.course).toEqual(new Set(expandNumbers(mathInReadme(c.course), order)));
  });

  it("освежить — уроки без галочки; задачи V.2 — по первой попытке и только фрагменты курса", () => {
    const marks = { "foundations/a/b": { known: true, at: "", by: "learner" as const } };
    expect(toRefresh(marks, ["foundations/a/b", "foundations/a/c"])).toEqual(["foundations/a/c"]);
    const at = "";
    const ev = (item: string, correct: boolean, lesson = "foundations/bridge/math-in-ml") => ({ type: "attempt", lesson, item, seed: 1, attempt: 1, correct, hints: 0, ms: 1, at });
    const events = [ev("f.pca-eigen:error:2", false), ev("f.pca-eigen:error:2", true), ev("f.em-jensen:rule:3", true), ev("f.svm-dual:fill:3", false), ev("f.pca-eigen:fill:1", true, "foundations/x/y")];
    expect(fragmentScore(events, "foundations/bridge/math-in-ml", ["f.pca-eigen", "f.em-jensen"])).toEqual({ answered: 2, correct: 1 });
  });

  it("итог: «освежить 3 урока из 31», «1 урок», «11 уроков», «готов»", () => {
    expect(verdictText(3, 31)).toBe("Освежить 3 урока из 31.");
    expect(verdictText(1, 5)).toBe("Освежить 1 урок из 5.");
    expect(verdictText(11, 30)).toBe("Освежить 11 уроков из 30.");
    expect(verdictText(0, 31)).toBe("Готов: отмечены все нужные уроки — 31.");
    expect(v2Text(0, 1)).toBe("Урок V.2: с первой попытки верно 0 из 1 задачи по этому курсу.");
    expect(v2Text(3, 5)).toBe("Урок V.2: с первой попытки верно 3 из 5 задач по этому курсу.");
  });
});
