// Сводка пилота: задания, тест «до и после», шаги выводов, опрос; понятные ошибки на чужих файлах.
import { describe, expect, it } from "vitest";
import type { JournalEvent } from "../state/journal";
import { parseReport, REPORT_KIND, REPORT_VERSION, summarize, toMarkdown, type PilotReport } from "./report";

const at = "2026-10-15T10:00:00.000Z";
const attempt = (item: string, correct: boolean, hints = 0): JournalEvent => ({ type: "attempt", lesson: "foundations/bridge/linear-regression", item, seed: 1, attempt: 1, correct, hints, ms: 1000, at });
const report = (participant: string, journal: JournalEvent[]): PilotReport => ({ kind: REPORT_KIND, version: REPORT_VERSION, participant, exportedAt: at, journal, marks: {} });

const reports = [
  report("a", [
    attempt("pre.v1", false),
    attempt("post.v1", true),
    { type: "step", lesson: "foundations/bridge/linear-regression", formula: "f.normal-equations", step: 2, predict: true, at },
    { type: "survey", lesson: "foundations/bridge/linear-regression", clarity: 4, stuck: "Способ 3. Максимум правдоподобия", at },
  ]),
  report("b", [
    attempt("pre.v1", true),
    attempt("post.v1", false, 1),
    attempt("post.v1", true, 1),
    { type: "step", lesson: "foundations/bridge/linear-regression", formula: "f.normal-equations", step: 5, predict: false, at },
    { type: "survey", lesson: "foundations/bridge/linear-regression", clarity: 2, comment: "Не понял шаг с градиентом", at },
  ]),
];

describe("сводка пилота", () => {
  it("задания: первая попытка, решили, попытки и подсказки", () => {
    const s = summarize(reports);
    expect(s.participants).toBe(2);
    expect(s.items.find((i) => i.item === "post.v1")).toEqual({ lesson: "foundations/bridge/linear-regression", item: "post.v1", learners: 2, firstTry: 0.5, solved: 1, attempts: 1.5, hints: 0.5 });
  });

  it("тест до и после урока — по парам pre.<урок> и post.<урок>", () => {
    expect(summarize(reports).prePost).toEqual([{ lesson: "foundations/bridge/linear-regression", learners: 2, pre: 0.5, post: 0.5 }]);
  });

  it("выводы: доля дошедших до каждого шага; опрос: средняя понятность, где споткнулись, комментарии", () => {
    const s = summarize(reports);
    expect(s.steps[0]!.reached).toEqual([1, 1, 1, 0.5, 0.5, 0.5]);
    expect(s.survey[0]).toEqual({ lesson: "foundations/bridge/linear-regression", answers: 2, clarity: 3, stuck: { "Способ 3. Максимум правдоподобия": 1 }, comments: ["Не понял шаг с градиентом"] });
  });

  it("Markdown для организатора", () => {
    const md = toMarkdown(summarize(reports));
    expect(md).toContain("Участников: 2.");
    expect(md).toContain("| foundations/bridge/linear-regression | 2 | 50 % | 50 % |");
    expect(md).toContain("- foundations/bridge/linear-regression: Не понял шаг с градиентом");
  });

  it("чужие файлы — понятные ошибки", () => {
    expect(() => parseReport("{", "x.json")).toThrow("x.json: это не JSON");
    expect(() => parseReport('{"kind":"other"}', "x.json")).toThrow(/не отчёт пилота/);
    expect(() => parseReport(JSON.stringify({ ...reports[0], version: 9 }), "x.json")).toThrow(/версия отчёта 9/);
    expect(parseReport(JSON.stringify(reports[0])).participant).toBe("a");
  });
});
