// «Матрица-пазл»: редьюсер, счёт, подсказки; свойства (fast-check) — детерминизм и решаемость каждого уровня.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { rng } from "../../lib/math/rng";
import { apply, det, IDENTITY, SHAPE, LIMIT, matrixPuzzle as game, optimalMoves, same, solve, viewport, type Level, type State } from "./model";

const level = (target: Level["target"], step = 1, family: Level["family"] = "general"): Level => ({ family, target, step });
const play = (s: State, actions: Parameters<typeof game.step>[1][]) => actions.reduce(game.step, s);

describe("ходы", () => {
  it("nudge меняет один элемент на шаг и считает ход; столбцы — образы e₁ и e₂", () => {
    const s = play(game.init(level([[0, -1], [1, 0]]), rng(1)), [
      { type: "nudge", i: 0, j: 0, dir: -1 },
      { type: "nudge", i: 1, j: 0, dir: 1 },
    ]);
    expect(s.A).toEqual([[0, 0], [1, 1]]);
    expect(s.moves).toBe(2);
    expect(game.feedback(s)).toMatch(/Первый столбец на месте/);
    expect(game.status(s)).toBe("playing");
  });

  it("решённый уровень застывает; reset возвращает единичную матрицу и обнуляет ходы", () => {
    const start = game.init(level([[2, 0], [0, 1]]), rng(1));
    const solved = game.step(start, { type: "nudge", i: 0, j: 0, dir: 1 });
    expect(game.status(solved)).toBe("solved");
    expect(game.score(solved)).toBe(1);
    expect(game.step(solved, { type: "nudge", i: 1, j: 1, dir: 1 })).toBe(solved);
    const again = game.step(solved, { type: "reset" });
    expect(again.A).toEqual(IDENTITY);
    expect(again.moves).toBe(0);
  });

  it("на краю поля ход не считается", () => {
    let s = game.init(level([[-1, 0], [0, 1]]), rng(1));
    for (let k = 0; k < 10; k++) s = game.step(s, { type: "nudge", i: 0, j: 1, dir: 1 });
    expect(s.A[0][1]).toBe(LIMIT);
    expect(s.moves).toBe(LIMIT);
  });

  it("счёт — доля оптимума: лишние ходы его снижают", () => {
    const s = play(game.init(level([[2, 0], [0, 1]]), rng(1)), [
      { type: "nudge", i: 0, j: 1, dir: 1 },
      { type: "nudge", i: 0, j: 1, dir: -1 },
      { type: "nudge", i: 0, j: 0, dir: 1 },
    ]);
    expect(game.status(s)).toBe("solved");
    expect(game.score(s)).toBeCloseTo(1 / 3);
    expect(game.feedback(s)).toBe("Фигуры совпали за 3; минимум — 1.");
  });

  it("шаг 0.5 у вырожденных уровней: без хвостов вроде 0.30000000000000004", () => {
    const s = play(game.init(level([[1, 0.5], [0, 0]], 0.5, "singular"), rng(1)), [
      { type: "nudge", i: 0, j: 1, dir: 1 },
      { type: "nudge", i: 1, j: 1, dir: -1 },
      { type: "nudge", i: 1, j: 1, dir: -1 },
    ]);
    expect(s.A).toEqual([[1, 0.5], [0, 0]]);
    expect(game.status(s)).toBe("solved");
  });
});

describe("подсказки и описание", () => {
  it("подсказки идут лесенкой: идея → как найти → ответ для первого неготового столбца", () => {
    let s = game.init(level([[0, -1], [1, 0]]), rng(1));
    s = game.step(s, { type: "hint" });
    expect(game.hint!(s)).toMatch(/Первый столбец A — это Ae₁/);
    s = game.step(s, { type: "hint" });
    expect(game.hint!(s)).toMatch(/поделите её координаты на 0.8/);
    s = game.step(s, { type: "hint" });
    expect(game.hint!(s)).toBe("Цель отправляет e₁ в (0, 1): поставьте этот столбец.");
  });

  it("describe называет матрицу, определитель, столбцы и опорные точки цели — замена рисунку для скринридера", () => {
    const s = game.init(level([[0, -1], [1, 0]]), rng(1));
    const text = game.describe(s);
    expect(text).toContain("A: первая строка 1, 0; вторая строка 0, 1. det A = 1.");
    expect(text).toContain("Угол F (0.8, 0) сейчас в (0.8, 0), нужен в (0, 0.8)");
    expect(text).toContain("вершина (0, 3) сейчас в (0, 3), нужна в (−3, 0)");
  });
});

describe("уровни", () => {
  it("семейства по порядку сложности; у вырожденного det = 0, у отражения −1", () => {
    const families = [1, 2, 3, 4, 5, 6].map((d) => game.generate(rng(7), d));
    expect(families.map((l) => l.family)).toEqual(["stretch", "shear", "rotation", "reflection", "singular", "general"]);
    expect(det(families[3]!.target)).toBe(-1);
    expect(det(families[4]!.target)).toBe(0);
    expect(det(families[2]!.target)).toBe(1);
  });

  it("свойство: один seed — один и тот же уровень и одна и та же партия", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 31 }), fc.integer({ min: 1, max: 8 }), fc.array(fc.tuple(fc.integer({ min: 0, max: 1 }), fc.integer({ min: 0, max: 1 }), fc.boolean()), { maxLength: 30 }), (seed, d, moves) => {
        const a = game.generate(rng(seed), d);
        const b = game.generate(rng(seed), d);
        expect(a).toEqual(b);
        const actions = moves.map(([i, j, up]) => ({ type: "nudge" as const, i: i as 0 | 1, j: j as 0 | 1, dir: (up ? 1 : -1) as 1 | -1 }));
        expect(play(game.init(a, rng(seed)), actions)).toEqual(play(game.init(b, rng(seed)), actions));
      }),
    );
  });

  it("свойство: каждый сгенерированный уровень решается, и бот укладывается в оптимум", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 31 }), fc.integer({ min: 1, max: 8 }), (seed, d) => {
        const lvl = game.generate(rng(seed), d);
        // цель достижима: элементы кратны шагу и в пределах поля, это не единичная матрица
        for (const row of lvl.target) for (const v of row) {
          expect(Math.abs(v)).toBeLessThanOrEqual(LIMIT);
          expect(Math.abs(v / lvl.step - Math.round(v / lvl.step))).toBeLessThan(1e-9);
        }
        expect(same(lvl.target, IDENTITY)).toBe(false);
        const start = game.init(lvl, rng(seed));
        const end = play(start, solve(start));
        expect(game.status(end)).toBe("solved");
        expect(end.moves).toBe(optimalMoves(IDENTITY, lvl.target, lvl.step));
        expect(game.score(end)).toBe(1);
      }),
    );
  });

  it("свойство: поле квадратное и вмещает начало координат, исходную F и цель", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 31 }), fc.integer({ min: 1, max: 8 }), (seed, d) => {
        const lvl = game.generate(rng(seed), d);
        const v = viewport(lvl);
        expect(v.x[1] - v.x[0]).toBe(v.y[1] - v.y[0]);
        for (const [x, y] of [[0, 0] as const, ...SHAPE, ...SHAPE.map((p) => apply(lvl.target, p))]) {
          expect(x).toBeGreaterThanOrEqual(v.x[0]);
          expect(x).toBeLessThanOrEqual(v.x[1]);
          expect(y).toBeGreaterThanOrEqual(v.y[0]);
          expect(y).toBeLessThanOrEqual(v.y[1]);
        }
      }),
    );
  });
});
