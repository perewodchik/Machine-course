// Схемы контента: весь текущий content/ проходит, битые фикстуры падают с понятной ошибкой «файл: поле: причина».
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ContentError, readYaml, validate, validateList } from "./files";
import * as s from "./schemas";

const files = (dir: string, re: RegExp): string[] =>
  readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((f) => re.test(f))
    .map((f) => join(dir, f))
    .sort();

/** Все проблемы проверки одним массивом (пусто — файл корректен). */
function problems(run: () => unknown): string[] {
  try {
    run();
    return [];
  } catch (e) {
    if (e instanceof ContentError) return e.problems;
    throw e;
  }
}

describe("текущий content/ проходит схемы", () => {
  const cases: [string, () => unknown][] = [
    ...files("content/courses", /^[^/]+\/course\.yaml$/).map((f): [string, () => unknown] => [f, () => validate(s.course, readYaml(f), f)]),
    ...files("content/courses", /^[^/]+\/[^/]+\/module\.yaml$/).map((f): [string, () => unknown] => [f, () => validate(s.module, readYaml(f), f)]),
    ...files("content/concepts", /\.yaml$/).map((f): [string, () => unknown] => [f, () => validateList(s.concept, readYaml(f), f)]),
    ...files("content/formulas/rules", /\.yaml$/).map((f): [string, () => unknown] => [f, () => validate(s.rule, readYaml(f), f)]),
    ...files("content/formulas", /^(?!rules\/).*\.yaml$/).map((f): [string, () => unknown] => [f, () => validate(s.formula, readYaml(f), f)]),
    ["content/glossary.yaml", () => validateList(s.glossaryEntry, readYaml("content/glossary.yaml"), "content/glossary.yaml")],
    ["content/redirects.yaml", () => validate(s.redirects, readYaml("content/redirects.yaml"), "content/redirects.yaml")],
  ];

  it("файлы найдены", () => {
    expect(cases.length).toBeGreaterThan(40);
  });

  it.each(cases)("%s", (_file, run) => {
    expect(problems(run)).toEqual([]);
  });

  it("id курса и модуля совпадают с папкой", () => {
    for (const f of files("content/courses", /(course|module)\.yaml$/)) {
      const data = readYaml(f) as { id: string };
      expect(f.split("/").at(-2), f).toBe(data.id);
    }
  });
});

describe("битые файлы: ошибка называет файл, поле и причину", () => {
  const dir = "tests/fixtures/content";
  const at = (name: string) => join(dir, name);

  it("понятия: префикс ID, пропущенное поле, тип, повтор ID", () => {
    const f = at("concepts-bad.yaml");
    const p = problems(() => validateList(s.concept, readYaml(f), f));
    expect(p).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^tests\/fixtures\/content\/concepts-bad\.yaml: \[0\]\.id: ID понятия: «раздел\.имя»/),
        expect.stringMatching(/concepts-bad\.yaml: \[1\]\.lesson: /),
        expect.stringMatching(/concepts-bad\.yaml: \[1\]\.prerequisites: .*массив/),
        `${f}: [3].id: ID «la.ok» уже встречался в этом файле`,
      ]),
    );
  });

  it("формула: TeX в двойных кавычках, несуществующая подцель, шаг без проверки", () => {
    const f = at("formula-bad.yaml");
    const p = problems(() => validate(s.formula, readYaml(f), f));
    expect(p).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/formula-bad\.yaml: statement: в TeX управляющий символ/),
        `${f}: derivation.steps[1].goal: подцель 3 не существует: в плане 1 подцели (нумерация с 0)`,
        `${f}: derivation.steps[1].check: у шага вывода нужна численная проверка check`,
      ]),
    );
  });

  it("правило без численных проверок", () => {
    const f = at("rule-bad.yaml");
    expect(problems(() => validate(s.rule, readYaml(f), f))).toEqual([`${f}: checks: у правила нужна хотя бы одна численная проверка`]);
  });

  it("модуль: часы не парой, slug не в kebab-case", () => {
    const f = at("module-bad.yaml");
    const p = problems(() => validate(s.module, readYaml(f), f));
    expect(p).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/module-bad\.yaml: hours: /),
        expect.stringMatching(/module-bad\.yaml: lessons\[0\]\.slug: латиница в нижнем регистре/),
      ]),
    );
  });

  it("курс: лишнее поле и пустой список модулей", () => {
    const f = at("course-bad.yaml");
    const p = problems(() => validate(s.course, readYaml(f), f));
    expect(p).toEqual(
      expect.arrayContaining([expect.stringMatching(/course-bad\.yaml: \(корень\): .*modulesOrder/), expect.stringMatching(/course-bad\.yaml: modules: /)]),
    );
  });

  it("frontmatter урока: минуты строкой, понятие без раздела", () => {
    const f = at("lesson-bad.yaml");
    const p = problems(() => validate(s.lessonFrontmatter, readYaml(f), f));
    expect(p).toEqual(
      expect.arrayContaining([expect.stringMatching(/lesson-bad\.yaml: concepts\[0\]: ID понятия/), expect.stringMatching(/lesson-bad\.yaml: minutes: .*число/)]),
    );
  });

  it("переименования: ключ урока без курса", () => {
    const f = at("redirects-bad.yaml");
    expect(problems(() => validate(s.redirects, readYaml(f), f))).toEqual([expect.stringMatching(/redirects-bad\.yaml: lessons\.bridge\/pca: старое имя: ключ урока/)]);
  });

  it("синтаксис YAML: номер строки и причина", () => {
    const f = at("syntax-bad.yaml");
    expect(problems(() => readYaml(f))).toEqual([expect.stringMatching(/^tests\/fixtures\/content\/syntax-bad\.yaml:4: YAML не разбирается: /)]);
  });
});
