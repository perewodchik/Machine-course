// Компаньон CS229 (S5.03): разделы собираются из поля cs229 уроков, формулы — по первой части названия раздела,
// генератор итоговой проверки берётся из MDX урока.
import { describe, expect, it } from "vitest";
import type { LessonEntry } from "./catalog";
import { finalGen, formulasFor, sections, sectionSlug } from "./companion";
import type { Formula } from "./types";

const lesson = (key: string, cs229: string[]) => ({ key, cs229, slug: key, number: "1", title: key, href: "/", course: "c", module: "m" }) as unknown as LessonEntry;

describe("компаньон CS229", () => {
  it("адрес раздела и порядок разделов", () => {
    expect(sectionSlug("Classification and logistic regression")).toBe("classification-and-logistic-regression");
    expect(sectionSlug("ML advice")).toBe("ml-advice");
    const s = sections([lesson("a", ["Linear regression"]), lesson("b", ["Deep learning", "Linear regression"])]);
    expect(s.map((x) => [x.name, x.lessons.map((l) => l.key)])).toEqual([
      ["Linear regression", ["a", "b"]],
      ["Deep learning", ["b"]],
    ]);
  });

  it("формулы — по разделу и подразделу, а не по подстроке", () => {
    const f = (id: string, section: string) => ({ id, cs229: [{ edition: "e", section }] }) as unknown as Formula;
    const all = [f("f.a", "Linear regression / The normal equations"), f("f.b", "Linear regression"), f("f.c", "Locally weighted linear regression")];
    expect(formulasFor("Linear regression", all).map((x) => x.id)).toEqual(["f.a", "f.b"]);
  });

  it("генератор итоговой проверки из MDX", () => {
    expect(finalGen('<Exercise gen="la.dot" n={1} />\n<Exercise gen="la.det2" seed={31} id="post.x" title="Итоговая проверка" final />')).toBe("la.det2");
    expect(finalGen('<Exercise fragment="f.x" ask="fill" step={3} id="post.v2" final />')).toBeUndefined();
    expect(finalGen("текст без задач")).toBeUndefined();
  });
});
