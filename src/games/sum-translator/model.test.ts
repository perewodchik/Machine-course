// «Переводчик сумм»: индексная запись произведения, проверка равенства на числах, решаемость уровней
// и отсутствие ложных «верно» (fast-check: все цепочки до трёх множителей сверяются на свежих числах).
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { rng } from "../../lib/math/rng";
import { chainShape, evaluate, formText, indexForm, KINDS, LEVELS, makeLevel, MAX_CHAIN, sumTranslator as game, verdict, type Action, type Factor, type Kind, type Level, type State } from "./model";

const level = (kind: Kind, seed = 1) => makeLevel(kind, rng(seed));
const tile = (l: Level, name: string) => l.tiles.findIndex((t) => t.name === name);
const f = (l: Level, name: string, t = false): Factor => ({ tile: tile(l, name), t });
const play = (s: State, actions: Action[]) => actions.reduce(game.step, s);
const size = (l: Level, name: string, dim: "rows" | "cols" = "rows") => l.tiles[tile(l, name)]![dim];

describe("индексная запись", () => {
  it("ответы уровней читаются как в уроке: индексы по порядку появления, у Xᵀy сумма по номеру объекта", () => {
    const dot = level("dot");
    expect(formText(indexForm(dot, dot.answer)!)).toBe(`Σ_{i=1}^{${size(dot, "x")}} x_i y_i`);
    const ones = level("ones");
    expect(formText(indexForm(ones, ones.answer)!)).toBe(`Σ_{i=1}^{${size(ones, "y")}} y_i`);
    const mv = level("matvec");
    expect(formText(indexForm(mv, mv.answer)!)).toBe(`Σ_{j=1}^{${size(mv, "x")}} A_ij x_j`);
    expect(indexForm(mv, mv.answer)!.free).toEqual([{ letter: "i", to: size(mv, "A") }]);
    const bl = level("bilinear");
    expect(formText(indexForm(bl, bl.answer)!)).toBe(`Σ_{i=1}^{${size(bl, "x")}} Σ_{j=1}^{${size(bl, "y")}} x_i A_ij y_j`);
    const outer = level("outer");
    expect(formText(indexForm(outer, outer.answer)!)).toBe("x_i y_j");
    expect(indexForm(outer, outer.answer)!.free.map((v) => v.letter)).toEqual(["i", "j"]);
    const xty = level("xty");
    expect(formText(indexForm(xty, xty.answer)!)).toBe(`Σ_{i=1}^{${size(xty, "X")}} X_ij y_i`);
    const gram = level("gram");
    expect(formText(indexForm(gram, gram.answer)!)).toBe(`Σ_{i=1}^{${size(gram, "X")}} X_ij X_ik`);
    expect(indexForm(gram, gram.answer)!.free.map((v) => v.letter)).toEqual(["j", "k"]);
  });

  it("единицы пропадают из записи; 1ᵀ1 — сумма единиц", () => {
    const ones = level("ones");
    const one = f(ones, "1");
    expect(formText(indexForm(ones, [{ ...one, t: true }, one])!)).toBe(`Σ_{i=1}^{${size(ones, "1")}} 1`);
  });

  it("нестыкующиеся множители: записи нет, размер называет место", () => {
    const mv = level("matvec");
    const chain = [f(mv, "x", true), f(mv, "A")];
    expect(indexForm(mv, chain)).toBeNull();
    expect(chainShape(mv, chain)).toEqual({ ok: false, at: 1, left: { rows: 1, cols: size(mv, "x") }, right: { rows: size(mv, "A"), cols: size(mv, "A", "cols") } });
  });
});

describe("проверка", () => {
  it("равные записи принимаются обе, неравные — с причиной", () => {
    const dot = level("dot");
    expect(verdict(dot, [f(dot, "y", true), f(dot, "x")])).toBe("ok");
    expect(verdict(dot, [f(dot, "x"), f(dot, "y", true)])).toBe("shape");
    expect(verdict(dot, [f(dot, "x", true), f(dot, "A"), f(dot, "y")])).toBe("value");
    const bl = level("bilinear");
    expect(verdict(bl, [f(bl, "y", true), f(bl, "A", true), f(bl, "x")])).toBe("ok");
    expect(verdict(bl, [f(bl, "x"), f(bl, "A")])).toBe("mismatch");
    const outer = level("outer");
    expect(verdict(outer, [f(outer, "A")])).toBe("value");
    const gram = level("gram");
    expect(verdict(gram, [f(gram, "X"), f(gram, "X", true)])).toBe("shape");
    expect(verdict(gram, [])).toBe("empty");
  });

  it("ходы: не больше MAX_CHAIN множителей, транспонирование и удаление, решённый уровень застывает", () => {
    const l = level("bilinear");
    const s0 = game.init(l, rng(1));
    const full = play(s0, Array.from({ length: MAX_CHAIN + 2 }, () => ({ type: "add", tile: 0 }) as Action));
    expect(full.chain).toHaveLength(MAX_CHAIN);
    const wrong = play(s0, [{ type: "add", tile: tile(l, "x") }, { type: "add", tile: tile(l, "A") }, { type: "check" }]);
    expect(wrong.last).toBe("mismatch");
    expect(game.feedback(wrong)).toMatch(/^У x столбцов 1, а у A строк/);
    const fixed = play(wrong, [{ type: "toggle", at: 0 }, { type: "add", tile: tile(l, "y") }, { type: "check" }]);
    expect(fixed.done).toBe(true);
    expect(fixed.checks).toBe(2);
    expect(game.score(fixed)).toBe(0.5);
    expect(game.step(fixed, { type: "remove", at: 0 })).toBe(fixed);
    expect(play(wrong, [{ type: "remove", at: 1 }]).chain).toEqual([{ tile: tile(l, "x"), t: false }]);
    // пустая проверка не считается попыткой
    expect(play(s0, [{ type: "check" }]).checks).toBe(0);
  });

  it("описание для скринридера называет задание и запись", () => {
    const l = level("dot");
    const s = play(game.init(l, rng(1)), [{ type: "add", tile: tile(l, "x") }, { type: "toggle", at: 0 }]);
    expect(game.describe(s)).toMatch(/^Задание: сумма по i от 1 до (\d): x i на y i\. Ваша запись: xᵀ — строка из \1 чисел, x i\.$/);
    const bad = play(s, [{ type: "add", tile: tile(l, "x") }, { type: "toggle", at: 1 }]);
    expect(game.describe(bad)).toMatch(/Ваша запись: xᵀ xᵀ — У xᵀ столбцов \d, а у xᵀ строк 1 — не перемножить\.$/);
  });
});

/** Все цепочки до трёх множителей с транспонированием. */
function chains(l: Level): Factor[][] {
  const one = l.tiles.flatMap((_, i) => [{ tile: i, t: false }, { tile: i, t: true }]);
  const out: Factor[][] = one.map((x) => [x]);
  for (const a of one) for (const b of one) out.push([a, b]);
  for (const a of one) for (const b of one) for (const c of one) out.push([a, b, c]);
  return out;
}

describe("уровни", () => {
  it("уровни идут по KINDS, генерация детерминирована", () => {
    expect(LEVELS).toBe(KINDS.length);
    KINDS.forEach((kind, k) => expect(game.generate(rng(7 * 1000 + k), k + 1).kind).toBe(kind));
    expect(game.generate(rng(42), 3)).toEqual(game.generate(rng(42), 3));
  });

  it("числа уровня не уравнивают ответ с другой цепочкой: seed 63044, уровень 2 — Σ yᵢ = n в обоих наборах", () => {
    const l = game.generate(rng(63044 * 1000 + 1), 2);
    const bad = l.tiles.findIndex((t) => t.ones);
    expect(verdict(l, [{ tile: bad, t: true }, { tile: bad, t: false }])).not.toBe("ok");
  });

  it("ответ принимается, а принятая цепочка равна ответу и на свежих числах (нет ложных «верно»)", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100_000 }), fc.integer({ min: 0, max: LEVELS - 1 }), (seed, k) => {
        const l = game.generate(rng(seed * 1000 + k), k + 1);
        expect(verdict(l, l.answer)).toBe("ok");
        const r = rng(seed + 17);
        const fresh: Level = { ...l, values: Array.from({ length: 4 }, () => l.tiles.map((t) => Array.from({ length: t.rows }, () => Array.from({ length: t.cols }, () => (t.ones ? 1 : r.int(-9, 9)))))) };
        for (const chain of chains(l)) {
          if (verdict(l, chain) !== "ok") continue;
          fresh.values.forEach((_, set) => expect(evaluate(fresh, chain, set)).toEqual(evaluate(fresh, l.answer, set)));
        }
      }),
      { numRuns: 60 },
    );
  });
});
