// Регионы сниппетов: извлечение, снятие отступа, понятные ошибки (сборка падает на неразрешённой ссылке).
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadSnippet, parseRegions } from "./snippets";

const root = path.resolve(import.meta.dirname, "../../..");

describe("регионы", () => {
  it("снимает отступ региона и пустые строки по краям, сохраняет пустые строки внутри", () => {
    const regions = parseRegions("def f():\n    # region show\n\n    a = 1\n\n    b = 2\n    # endregion\n", "x.py");
    expect(regions.get("show")).toBe("a = 1\n\nb = 2");
  });

  it("фикстура: регион внутри служебной функции становится кодом верхнего уровня", () => {
    const regions = parseRegions(readFileSync(path.join(root, "tests/fixtures/snippets/la/demo.py"), "utf8"), "demo.py");
    expect(regions.get("show")).toBe('print(X.shape)\n\nprint("ok")');
    expect(regions.get("data")).toBe("X = np.ones((3, 2))");
  });

  it.each([
    ["# region a\n# region b\n# endregion\n", /x\.py:2: регион «b» внутри незакрытого «a»/],
    ["# region a\nx = 1\n", /x\.py:1: регион «a» не закрыт/],
    ["# endregion\n", /x\.py:1: # endregion без # region/],
    ["# region a\n# endregion\n# region a\n# endregion\n", /x\.py:3: регион «a» повторяется/],
  ])("ошибка разметки: %j", (text, error) => {
    expect(() => parseRegions(text, "x.py")).toThrow(error);
  });
});

describe("ссылка на сниппет", () => {
  it("сниппет урока V.1: регионы подряд через пустую строку, весь файл — для молчаливого запуска", () => {
    const s = loadSnippet("la/normal_equations.py#solve+demo", root);
    expect(s.code).toMatch(/^def normal_equations\(/);
    expect(s.code).toContain('\n\nX, y = make_data()\ntheta = normal_equations(X, y)\nprint("θ =", theta.round(3))');
    expect(s.source).toContain("import numpy as np");
  });

  it.each([
    ["la/normal_equations.py#solv", /нет региона «solv»; в файле есть: data, solve, loss, demo/],
    ["la/normal_equations.py", /после # укажите регион/],
    ["la/missing.py#x", /файла code\/snippets\/la\/missing\.py нет/],
    ["../secrets.py#x", /ожидается путь к \.py внутри code\/snippets/],
  ])("%s — понятная ошибка", (ref, error) => {
    expect(() => loadSnippet(ref, root)).toThrow(error);
  });
});
