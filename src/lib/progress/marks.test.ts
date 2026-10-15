// Галочки «знаю»: поставить и снять, ★ не в счётчике, миграция старых ключей и переименований, экспорт → импорт.
import { describe, expect, it } from "vitest";
import type { LessonMarks } from "../content/types";
import { countKnown, exportMarks, importMarks, isKnown, MarksFormatError, mergeMarks, migrate, SCHEMA_VERSION, setMark } from "./marks";

const AT = "2026-10-15T10:00:00.000Z";
const LATER = "2026-10-16T10:00:00.000Z";
const lessons = [
  { key: "foundations/calculus/convexity" },
  { key: "foundations/calculus/kkt", optional: true },
  { key: "foundations/calculus/gradient" },
];

describe("отметки", () => {
  it("ставит и снимает отметку, не меняя исходный объект", () => {
    const a: LessonMarks = {};
    const b = setMark(a, "foundations/calculus/convexity", true, "learner", AT);
    expect(isKnown(b, "foundations/calculus/convexity")).toBe(true);
    expect(a).toEqual({});
    const c = setMark(b, "foundations/calculus/convexity", false, "learner", LATER);
    expect(isKnown(c, "foundations/calculus/convexity")).toBe(false);
  });

  it("уроки ★ отмечаются, но в счётчик не входят", () => {
    let m: LessonMarks = {};
    m = setMark(m, "foundations/calculus/kkt", true, "learner", AT);
    expect(countKnown(m, lessons)).toEqual({ known: 0, total: 2 });
    m = setMark(m, "foundations/calculus/gradient", true, "lesson-check", AT);
    expect(countKnown(m, lessons)).toEqual({ known: 1, total: 2 });
  });
});

describe("миграция", () => {
  it("v1: ключи без курса получают foundations/, затем применяются переименования", () => {
    const v1 = {
      schemaVersion: 1,
      marks: {
        "calculus/convexity": { known: true, by: "learner", at: AT },
        "bridge/pca": { known: true, by: "diagnostic", at: AT },
        "bridge/broken": { known: "yes" },
      },
    };
    const out = migrate(v1, { "foundations/bridge/pca": "unsupervised/representations/pca" });
    expect(out.schemaVersion).toBe(SCHEMA_VERSION);
    expect(Object.keys(out.marks).sort()).toEqual(["foundations/calculus/convexity", "unsupervised/representations/pca"]);
  });

  it("цепочка переименований и слияние двух старых ключей: побеждает поздняя отметка", () => {
    const out = migrate(
      {
        schemaVersion: 2,
        marks: {
          "a/b/old": { known: true, by: "learner", at: AT },
          "a/b/mid": { known: false, by: "learner", at: LATER },
        },
      },
      { "a/b/old": "a/b/mid", "a/b/mid": "a/b/new" },
    );
    expect(out.marks).toEqual({ "a/b/new": { known: false, by: "learner", at: LATER } });
  });

  it("понятные ошибки на чужих файлах", () => {
    expect(() => migrate(null)).toThrow(MarksFormatError);
    expect(() => migrate({ marks: {} })).toThrow("нет schemaVersion");
    expect(() => migrate({ schemaVersion: 99, marks: {} })).toThrow("более новой версии");
    expect(() => importMarks("{не json")).toThrow("не читается как JSON");
  });
});

describe("экспорт и импорт", () => {
  it("экспорт → импорт восстанавливает отметки", () => {
    let m: LessonMarks = {};
    m = setMark(m, "foundations/calculus/convexity", true, "learner", AT);
    m = setMark(m, "ml-basics/evaluation/regularization", true, "lesson-check", LATER);
    expect(importMarks(exportMarks(m)).marks).toEqual(m);
  });

  it("слияние при импорте: по каждому уроку более поздняя отметка", () => {
    const here = setMark({}, "foundations/calculus/convexity", false, "learner", LATER);
    const file = setMark(setMark({}, "foundations/calculus/convexity", true, "learner", AT), "foundations/calculus/gradient", true, "learner", AT);
    const merged = mergeMarks(here, file);
    expect(isKnown(merged, "foundations/calculus/convexity")).toBe(false);
    expect(isKnown(merged, "foundations/calculus/gradient")).toBe(true);
  });
});
