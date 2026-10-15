// Граф уроков: обратные рёбра, «можно начинать», путь до урока с разделом CS229.
import { describe, expect, it } from "vitest";
import { available, dependents, pathForward, type GraphLesson } from "./graph";

// a → b → d, a → c → d → e; e — урок с разделом CS229
const lessons: GraphLesson[] = [
  { key: "a", requires: [] },
  { key: "b", requires: ["a"] },
  { key: "c", requires: ["a"] },
  { key: "d", requires: ["b", "c"] },
  { key: "e", requires: ["d"] },
  { key: "f", requires: [] },
];

describe("граф уроков", () => {
  it("обратные рёбра — в порядке списка", () => {
    expect(dependents(lessons).get("a")).toEqual(["b", "c"]);
    expect(dependents(lessons).get("e")).toEqual([]);
  });

  it("можно начинать — без галочки и со всеми пререквизитами", () => {
    expect(available(lessons, () => false)).toEqual(["a", "f"]);
    const known = new Set(["a", "b"]);
    expect(available(lessons, (k) => known.has(k))).toEqual(["c", "f"]);
  });

  it("путь вперёд до цели — кратчайший; сам урок — тоже цель", () => {
    expect(pathForward("a", lessons, (k) => k === "e")).toEqual(["a", "b", "d", "e"]);
    expect(pathForward("e", lessons, (k) => k === "e")).toEqual(["e"]);
    expect(pathForward("f", lessons, (k) => k === "e")).toBeNull();
  });
});
