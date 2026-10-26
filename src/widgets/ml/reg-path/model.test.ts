// «Путь регуляризации»: лассо зануляет веса по одному при росте λ, гребневая — нет; решение с ограничением L1 при
// малом t лежит на оси (один вес — ноль), L2 — нет; без стандартизации путь меняется; ошибка на обучении не убывает с λ.
import { describe, expect, it } from "vitest";
import { constrained, design, lasso, path, ridge } from "./model";

const std = design(true);

describe("путь регуляризации", () => {
  it("лассо зануляет, гребневая сжимает без нулей; при большом λ — все нули", () => {
    const l1 = path(std, "l1");
    const l2 = path(std, "l2");
    const zeros = l1.map((p) => p.theta.filter((v) => v === 0).length);
    for (let k = 1; k < zeros.length; k++) expect(zeros[k]!).toBeGreaterThanOrEqual(zeros[k - 1]! - 1);
    expect(zeros.at(-1)).toBe(5);
    expect(l2.every((p) => p.theta.every((v) => v !== 0))).toBe(true);
    for (let k = 1; k < l2.length; k++) expect(l2[k]!.train).toBeGreaterThanOrEqual(l2[k - 1]!.train - 1e-9);
  });

  it("малое ограничение: ромб даёт вершину (один вес ноль), круг — нет", () => {
    const d2 = design(true, [0, 1]);
    const a = constrained(d2, "l1", 0.5);
    const b = constrained(d2, "l2", 0.5);
    expect(a.filter((v) => Math.abs(v) < 1e-9)).toHaveLength(1);
    expect(b.every((v) => Math.abs(v) > 1e-3)).toBe(true);
    expect(Math.hypot(...b)).toBeCloseTo(0.5, 4);
  });

  it("гребневая и лассо при λ → 0 совпадают с МНК", () => {
    const t0 = ridge(std.Xtr, std.ytr, 0);
    lasso(std.Xtr, std.ytr, 1e-9, undefined, 5000).forEach((v, j) => expect(v).toBeCloseTo(t0[j]!, 4));
  });

  it("площадь в см² без стандартизации: у МНК прогнозы те же, у гребневой — другие", () => {
    const raw = design(false);
    const pred = (X: number[][], t: number[]) => X.map((r) => r.reduce((a, v, j) => a + v * t[j]!, 0));
    const olsS = pred(std.Xva, ridge(std.Xtr, std.ytr, 0));
    const olsR = pred(raw.Xva, ridge(raw.Xtr, raw.ytr, 0));
    olsS.forEach((v, i) => expect(v).toBeCloseTo(olsR[i]!, 6));
    const rS = pred(std.Xva, ridge(std.Xtr, std.ytr, 0.5));
    const rR = pred(raw.Xva, ridge(raw.Xtr, raw.ytr, 0.5));
    expect(Math.max(...rS.map((v, i) => Math.abs(v - rR[i]!)))).toBeGreaterThan(0.1);
  });
});
