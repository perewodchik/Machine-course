// «Тетрис размерностей»: стыки и форма произведения, решаемость каждого уровня, бот, подсказки, детерминизм.
import { describe, expect, it } from "vitest";
import { rng } from "../../lib/math/rng";
import { dimTetris, KINDS, LEVELS, makeLevel, moves, optimalMoves, product, solutions, solve, type Level, type State } from "./model";

const play = (level: Level, actions: Parameters<typeof dimTetris.step>[1][]): State => actions.reduce((s, a) => dimTetris.step(s, a), dimTetris.init(level, rng(1)));

const outer: Level = {
  kind: "outer",
  pieces: [
    { id: "u", name: "u", rows: 3, cols: 1, role: "data" },
    { id: "w", name: "w", rows: 3, cols: 1, role: "param" },
  ],
  target: [3, 3],
  allowT: true,
  story: "",
};

describe("стыки и форма", () => {
  it("uᵀw — число, uwᵀ — матрица 3 × 3; u·w не стыкуется", () => {
    expect(product(outer, [{ id: "u", t: true }, { id: "w", t: false }])).toEqual([1, 1]);
    expect(product(outer, [{ id: "u", t: false }, { id: "w", t: true }])).toEqual([3, 3]);
    expect(product(outer, [{ id: "u", t: false }, { id: "w", t: false }])).toBeNull();
  });

  it("решено только со всеми блоками и нужной формой", () => {
    expect(dimTetris.status(play(outer, [{ type: "place", id: "u" }, { type: "place", id: "w" }, { type: "transpose", index: 0 }]))).toBe("playing");
    const s = play(outer, [{ type: "place", id: "u" }, { type: "place", id: "w" }, { type: "transpose", index: 1 }]);
    expect(dimTetris.status(s)).toBe("solved");
    expect(dimTetris.score(s)).toBe(1);
  });

  it("ход по несуществующему блоку или индексу ничего не меняет", () => {
    const s = play(outer, [{ type: "place", id: "u" }]);
    for (const a of [{ type: "place", id: "u" }, { type: "place", id: "z" }, { type: "remove", index: 3 }, { type: "move", index: 0, dir: -1 }] as const) expect(dimTetris.step(s, a)).toBe(s);
  });
});

describe("уровни", () => {
  it("каждый уровень решаем, бот собирает его за минимум ходов", () => {
    for (let seed = 1; seed <= 60; seed++)
      for (let k = 1; k <= LEVELS; k++) {
        const level = dimTetris.generate(rng(seed * 1000 + k), k);
        expect(level.kind).toBe(KINDS[k - 1]);
        expect(solutions(level).length, `${level.kind}, seed ${seed}`).toBeGreaterThan(0);
        const s = play(level, solve(dimTetris.init(level, rng(1))));
        expect(dimTetris.status(s)).toBe("solved");
        expect(s.moves).toBe(optimalMoves(level));
      }
  });

  it("на первых двух уровнях решение единственно, транспонировать нельзя", () => {
    for (let seed = 1; seed <= 40; seed++)
      for (const kind of ["pair", "chain", "gradient", "normal"] as const) {
        const level = makeLevel(kind, rng(seed));
        // в «нормальных уравнениях» два одинаковых X: решения отличаются только тем, какой из них транспонирован
        expect(solutions(level).length).toBe(kind === "normal" ? 2 : 1);
      }
    expect(makeLevel("pair", rng(3)).allowT).toBe(false);
  });

  it("градиент МНК — Xᵀy, нормальные уравнения — XᵀXθ", () => {
    const g = makeLevel("gradient", rng(5));
    expect(solutions(g)[0]!.map((s) => (s.t ? `${s.id}ᵀ` : s.id)).join("")).toBe("Xᵀy");
    const n = makeLevel("normal", rng(5));
    expect(solutions(n).map((c) => c.map((s) => (s.t ? "Xᵀ" : s.id === "theta" ? "θ" : "X")).join(""))).toEqual(["XᵀXθ", "XᵀXθ"]);
  });

  it("детерминированы: один seed — один уровень", () => {
    expect(makeLevel("mixed", rng(9))).toEqual(makeLevel("mixed", rng(9)));
  });
});

describe("подсказки и разбор", () => {
  it("подсказки идут от формы к ответу; разбор называет несошедшийся стык", () => {
    const level = makeLevel("gradient", rng(2));
    let s = dimTetris.init(level, rng(1));
    s = dimTetris.step(s, { type: "hint" });
    expect(dimTetris.hint!(s)).toContain(`${level.target[0]} строк`);
    s = dimTetris.step(dimTetris.step(s, { type: "hint" }), { type: "hint" });
    expect(dimTetris.hint!(s)).toBe("Ответ: Xᵀ · y.");
    const bad = play(level, [{ type: "place", id: "X" }, { type: "place", id: "y" }]);
    expect(dimTetris.feedback(bad)).toMatch(/^Стык 1 не сходится/);
    expect(dimTetris.describe(bad)).toContain("стык не сходится");
    expect([1, 3, 5, 11, 12, 21, 22].map(moves)).toEqual(["1 ход", "3 хода", "5 ходов", "11 ходов", "12 ходов", "21 ход", "22 хода"]);
  });
});
