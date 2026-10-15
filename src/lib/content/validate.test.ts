// Валидатор контента: текущий content/ проходит; каждая фикстура из tests/fixtures/validate/cases ломает одно правило.
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { containsBare, stripSym, validateContent } from "./validate";

const fixtures = "tests/fixtures/validate";
const tmp = mkdtempSync(join(tmpdir(), "validate-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

/** base + наложенный случай во временной папке. */
function run(name?: string): string[] {
  const dir = join(tmp, name ?? "base");
  cpSync(join(fixtures, "base"), dir, { recursive: true });
  if (name) cpSync(join(fixtures, "cases", name), dir, { recursive: true, force: true });
  return validateContent(dir).problems;
}

describe("корректный контент", () => {
  it("текущий content/ проходит", () => {
    const { problems, stats } = validateContent(process.cwd());
    expect(problems).toEqual([]);
    expect(stats.courses).toBe(9);
    expect(stats.tex).toBeGreaterThan(20);
  });

  it("базовая фикстура проходит", () => {
    expect(run()).toEqual([]);
  });
});

describe("каждая проверка ловит свою фикстуру", () => {
  const cases: [string, (string | RegExp)[]][] = [
    ["concept-cycle", [/граф понятий: цикл la\.(vector|dot) → la\.(dot|vector) → la\.\1/]],
    ["concept-missing", ["la.matrix.prerequisites: нет понятия «la.tensor»", "la.matrix.lesson: нет урока «no-such-lesson»"]],
    [
      "formula-refs",
      [
        "dependsOn.concepts[0]: нет понятия «la.norm»",
        "dependsOn.rules[0]: нет правила «rule.no-such-rule»",
        "derivation.steps[0].by[0]: нет правила «rule.missing-step-rule»",
        "usedIn[0]: «demo/basics/no-such-lesson» — не понятие и не ключ урока",
      ],
    ],
    ["tex-error", [/dot-symmetric\.yaml: statement: KaTeX не разобрал/]],
    ["tex-untrusted", [/next\.mdx: строка 9: команда \\href запрещена/]],
    ["sym-undeclared", [/next\.mdx: строка \d+: символ «w» в \\sym не объявлен/]],
    ["sym-bare", [/next\.mdx: строка \d+: символ «X» \(роль data\) написан без \\sym/]],
    ["role-conflict", [/символ «theta»: роль (target|param), а в .* — (param|target)/]],
    ["note-label", [/next\.mdx: строка 11: заметка <Note> без подписи label/]],
    ["prose-math", ["dot-symmetric.yaml: corollary: «ᵀ» вне формулы", "dot-symmetric.yaml: pitfall: «_» вне формулы"]],
    ["lesson-duplicate", ["lessons[1].number: номер «1.1» уже занят", "lessons[2].slug: урок «intro» повторяется в модуле"]],
    ["course-requires", ["requires: нет курса «no-such-course»"]],
    ["redirect-target", ["цели «demo/basics/intro-renamed» нет среди уроков", "lessons.demo/basics/intro: старый ключ всё ещё занят уроком"]],
    ["mdx-orphan", ["extra.mdx: урока «extra» нет в module.yaml", "next.mdx: title: «Другое название», а в"]],
    [
      "pycode-refs",
      [
        /next\.mdx: строка 13: сниппет «la\/fit\.py#solv»: нет региона «solv»; в файле есть: solve/,
        "next.mdx: строка 13: лабораторной notebooks/la/no-such-lab.ipynb нет",
        "next.mdx: строка 15: лабораторной notebooks/la/missing.ipynb нет",
      ],
    ],
  ];

  it.each(cases)("%s", (name, expected) => {
    const problems = run(name);
    for (const e of expected) {
      expect(problems, `ожидалась проблема ${String(e)}\nполучено:\n${problems.join("\n")}`).toEqual(
        expect.arrayContaining([typeof e === "string" ? expect.stringContaining(e) : expect.stringMatching(e)]),
      );
    }
  });
});

describe("вспомогательные функции", () => {
  it("stripSym убирает \\sym вместе с вложенными скобками", () => {
    expect(stripSym("\\sym{X}{X_{i}} + \\sym{t}{\\theta^{\\star}} = y")).toBe(" +  = y");
  });

  it("containsBare видит голый символ и не путает его с командами и текстом", () => {
    expect(containsBare(" = X^\\top y", "X")).toBe(true);
    expect(containsBare("\\Xi + \\operatorname{XOR}(a)", "X")).toBe(false);
    expect(containsBare("\\theta_j", "\\theta")).toBe(true);
    expect(containsBare("\\thetaa", "\\theta")).toBe(false);
  });
});
