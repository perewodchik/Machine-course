// Входная диагностика: порядок задач, пропуск по неверному ответу, бюджет времени, итог.
import { describe, expect, it } from "vitest";
import { advance, minutesLeft, summarize, type Outcome, type PlanItem } from "./plan";

// a → b → c, a → d; e ни на что не опирается
const items: PlanItem[] = [
  { lesson: "a", minutes: 2, requires: [] },
  { lesson: "b", minutes: 2, requires: ["a"] },
  { lesson: "c", minutes: 2, requires: ["b"] },
  { lesson: "d", minutes: 2, requires: ["a"] },
  { lesson: "e", minutes: 2, requires: [] },
];
const o = (entries: [string, Outcome][]) => new Map(entries);

describe("диагностика", () => {
  it("спрашивает по порядку банка", () => {
    expect(advance(items, o([]), 25)).toEqual({ next: 0, skipped: [] });
    expect(advance(items, o([["a", "right"]]), 25)).toEqual({ next: 1, skipped: [] });
  });

  it("неверный ответ пропускает задачи, которые на него опираются, но не дальше", () => {
    // a неверно: b и d пропущены; c опирается на пропущенную b — её спрашивают
    expect(advance(items, o([["a", "wrong"]]), 25)).toEqual({ next: 2, skipped: ["b"] });
    const after = o([["a", "wrong"], ["b", "skipped"], ["c", "right"]]);
    expect(advance(items, after, 25)).toEqual({ next: 4, skipped: ["d"] });
  });

  it("кончается, когда задачи кончились или следующая не влезает в бюджет", () => {
    const all = o(items.map((it) => [it.lesson, "right"] as [string, Outcome]));
    expect(advance(items, all, 25).next).toBeNull();
    expect(advance(items, o([["a", "right"], ["b", "right"]]), 5)).toEqual({ next: null, skipped: [] });
    expect(advance(items, o([["a", "right"]]), 4).next).toBe(1);
  });

  it("оставшееся время: без ответа и без заведомо пропущенных, не больше бюджета", () => {
    expect(minutesLeft(items, o([]), 25)).toBe(10);
    expect(minutesLeft(items, o([["a", "wrong"]]), 25)).toBe(4); // b и d пропустятся: остаются c и e
    expect(minutesLeft(items, o([]), 7)).toBe(7);
  });

  it("итог: «знаю» — только верно решённые, маршрут — остальные по порядку", () => {
    const s = summarize(items, o([["a", "right"], ["b", "wrong"], ["c", "skipped"], ["d", "right"]]));
    expect(s).toEqual({ known: ["a", "d"], route: ["b", "c", "e"], asked: 3 });
  });
});
