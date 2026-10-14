import { describe, expect, it } from "vitest";
import { buildCourseTree, neighbours, sortCourses } from "./catalog";
import type { Course, Module } from "./types";

const course: Course = {
  id: "demo",
  title: { ru: "Демо" },
  summary: "Курс для теста",
  cs229Edition: "main-notes-2026-spring",
  modules: ["a", "b"],
};
const modules = new Map<string, Module>([
  ["demo/a", { id: "a", number: "1", title: "Первый", hours: [1, 2], lessons: [{ slug: "x", number: "1.1", title: "Икс" }, { slug: "y", number: "1.2", title: "Игрек", optional: true }] }],
  ["demo/b", { id: "b", number: "2", title: { ru: "Второй" }, hours: [1, 1], lessons: [{ slug: "z", number: "2.1", title: "Зет" }] }],
]);

describe("buildCourseTree", () => {
  it("строит ключи, ссылки и счётчики без уроков ★", () => {
    const t = buildCourseTree(course, modules);
    expect(t.title).toBe("Демо");
    expect(t.lessons.map((l) => l.key)).toEqual(["demo/a/x", "demo/a/y", "demo/b/z"]);
    expect(t.lessons[0]!.href).toBe("/demo/a/x/");
    expect(t.modules.map((m) => m.required)).toEqual([1, 1]);
    expect(t.required).toBe(2);
  });

  it("падает с путём файла, если модуля нет", () => {
    expect(() => buildCourseTree({ ...course, modules: ["a", "c"] }, modules)).toThrow("content/courses/demo/c/module.yaml");
  });

  it("падает, если id модуля не совпадает с папкой", () => {
    const bad = new Map(modules);
    bad.set("demo/b", { ...modules.get("demo/b")!, id: "bb" });
    expect(() => buildCourseTree(course, bad)).toThrow("не совпадает с папкой");
  });

  it("находит соседние уроки через границу модуля", () => {
    const t = buildCourseTree(course, modules);
    const { prev, next } = neighbours(t, "demo/a/y");
    expect(prev?.slug).toBe("x");
    expect(next?.slug).toBe("z");
    expect(neighbours(t, "demo/a/x").prev).toBeUndefined();
  });
});

describe("sortCourses", () => {
  it("ставит курс без номера первым, остальные по номеру", () => {
    const sorted = sortCourses([{ id: "rl", number: 7 }, { id: "ml-basics", number: 1 }, { id: "foundations" }]);
    expect(sorted.map((c) => c.id)).toEqual(["foundations", "ml-basics", "rl"]);
  });
});
