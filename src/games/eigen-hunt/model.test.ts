// «Охота на собственные векторы»: уровни строятся с нужными собственными парами, бот проходит все, промахи считаются.
import { describe, expect, it } from "vitest";
import { rng } from "../../lib/math/rng";
import { apply, eigenHunt, KINDS, lambdaOptions, LEVELS, lineAngle, solve, unit, type Level, type State } from "./model";

const play = (level: Level, actions: Parameters<typeof eigenHunt.step>[1][]): State => actions.reduce((s, a) => eigenHunt.step(s, a), eigenHunt.init(level, rng(1)));

describe("уровни", () => {
  it("собственные пары уровня верны: Av = λv, и бот решает каждый уровень", () => {
    for (let seed = 1; seed <= 50; seed++)
      for (let k = 1; k <= LEVELS; k++) {
        const level = eigenHunt.generate(rng(seed * 1000 + k), k);
        expect(level.kind).toBe(KINDS[k - 1]);
        for (const e of level.eigen) {
          const v = unit(e.angle);
          const w = apply(level.A, v);
          expect(w[0]).toBeCloseTo(e.lambda * v[0], 6);
          expect(w[1]).toBeCloseTo(e.lambda * v[1], 6);
          // на собственном направлении прямые v и Av совпадают
          expect(lineAngle(level.A, e.angle)).toBeCloseTo(0, 6);
        }
        const s = play(level, solve(eigenHunt.init(level, rng(1))));
        expect(eigenHunt.status(s), `${level.kind}, seed ${seed}`).toBe("solved");
        expect(eigenHunt.score(s)).toBe(1);
      }
  });

  it("у поворота на 90° угол между v и Av всегда 90°", () => {
    const level = eigenHunt.generate(rng(5), 6);
    for (const a of [0, 30, 77, 145]) expect(lineAngle(level.A, a)).toBeCloseTo(90, 9);
  });
});

describe("ходы", () => {
  const sym = eigenHunt.generate(rng(3), 2);

  it("поймать мимо — промах; неверное λ — промах; верное λ записывается", () => {
    let s = play(sym, [{ type: "set", angle: 10 }, { type: "catch" }]);
    expect(s.misses).toBe(1);
    s = play(sym, [{ type: "set", angle: 45 }, { type: "catch" }]);
    expect(s.pending).toBe(45);
    const opts = lambdaOptions(s);
    expect(opts).toContain(sym.eigen[0]!.lambda);
    const wrong = opts.find((o) => o !== sym.eigen[0]!.lambda)!;
    s = eigenHunt.step(s, { type: "lambda", value: wrong });
    expect(s.misses).toBe(1);
    s = eigenHunt.step(s, { type: "lambda", value: sym.eigen[0]!.lambda });
    expect(s.found).toHaveLength(1);
  });

  it("«Таких направлений нет» на обычном уровне — промах, на повороте — решение", () => {
    expect(play(sym, [{ type: "none" }]).misses).toBe(1);
    const rot = eigenHunt.generate(rng(5), 6);
    expect(eigenHunt.status(play(rot, [{ type: "none" }]))).toBe("solved");
  });

  it("подсказки ведут к характеристическому уравнению и к ответу", () => {
    let s = eigenHunt.init(sym, rng(1));
    s = eigenHunt.step(eigenHunt.step(s, { type: "hint" }), { type: "hint" });
    expect(eigenHunt.hint!(s)).toMatch(/^Характеристическое уравнение: λ² − /);
    s = eigenHunt.step(s, { type: "hint" });
    expect(eigenHunt.hint!(s)).toMatch(/^Направление около \d+°, λ = /);
  });
});
