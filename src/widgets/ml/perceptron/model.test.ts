// «Перцептрон»: эпохи совпадают с ячейкой урока — на разделимых [2, 0], на неразделимых ошибки не кончаются;
// поправка — θ ± x; шаг α ×10 не меняет ошибок (θ умножается на 10).
import { describe, expect, it } from "vitest";
import { perceptronEpochs } from "../../../lib/math/softmax";
import { converged, errors, finishEpoch, initial, problem, step } from "./model";

describe("перцептрон", () => {
  it("эпохи — как в ячейке урока", () => {
    const sep = problem("separable");
    let s = initial();
    for (let e = 0; e < 5 && !converged(s); e++) s = finishEpoch(sep, s);
    expect(s.mistakes).toEqual([2, 0]);
    expect(errors(sep, s.theta)).toBe(0);
    const ov = problem("overlap");
    let t = initial();
    for (let e = 0; e < 20; e++) t = finishEpoch(ov, t);
    expect(t.mistakes.slice(-5)).toEqual([29, 27, 28, 29, 27]);
    expect(perceptronEpochs(ov.X, ov.y).mistakes.slice(-5)).toEqual([29, 27, 28, 29, 27]);
  });

  it("поправка на ошибке — θ ± x", () => {
    const p = problem("overlap");
    const s = step(p, initial());
    const { i, before, after } = s.last!;
    const sign = p.y[i]! === 1 ? 1 : -1;
    after.forEach((v, c) => expect(v).toBeCloseTo(before[c]! + sign * p.X[i]![c]!, 12));
  });

  it("шаг ×10: те же ошибки по эпохам", () => {
    const p = problem("overlap");
    expect(perceptronEpochs(p.X, p.y, 20, 10).mistakes).toEqual(perceptronEpochs(p.X, p.y, 20, 1).mistakes);
  });
});
