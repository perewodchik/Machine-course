// Движок упражнений: разбор чисел (точка и запятая), проверки всех типов, генераторы с seed, ГПСЧ.
import { describe, expect, it } from "vitest";
import { rng } from "../math/rng";
import { checkMatrix, checkNumeric, checkOrder, closeEnough, scrambled } from "./check";
import { generator, generators } from "./generators";
import { formatNumber, parseNumber } from "./parse";
import { renderInline } from "../../markdown/core/inline";
import type { ExerciseSpec } from "./types";

describe("разбор ответа", () => {
  it.each([
    ["0.5", 0.5],
    ["0,5", 0.5],
    [" −0,25 ", -0.25],
    ["-3", -3],
    ["1/2", 0.5],
    ["−3/4", -0.75],
    [".5", 0.5],
    ["1e-3", 0.001],
    ["12 345", 12345],
  ])("«%s» → %s", (raw, v) => {
    expect(parseNumber(raw)).toBeCloseTo(v, 12);
  });

  it.each(["", "abc", "1/0", "0.5.5", "--1", "1,2,3"])("«%s» — не число", (raw) => {
    expect(parseNumber(raw)).toBeNull();
  });

  it("вывод — с точкой и настоящим минусом", () => {
    expect(formatNumber(0.5)).toBe("0.5");
    expect(formatNumber(-0.25)).toBe("−0.25");
    expect(formatNumber(-0.00001)).toBe("0");
    expect(formatNumber(1 / 3)).toBe("0.3333");
  });
});

describe("проверки", () => {
  it("число с допуском, ввод с запятой засчитывается", () => {
    expect(checkNumeric("0,5", 0.5)).toEqual({ value: 0.5, correct: true });
    expect(checkNumeric("0.504", 0.5).correct).toBe(true);
    expect(checkNumeric("0.51", 0.5).correct).toBe(false);
    expect(checkNumeric("полтора", 1.5)).toEqual({ value: null, correct: false });
    expect(closeEnough(101, 100, 0, 0.02)).toBe(true);
  });

  it("матрица: клетки по отдельности, пустая клетка — null", () => {
    const r = checkMatrix([["1", "2,0"], ["", "5"]], [[1, 2], [3, 4]], 0);
    expect(r.cells).toEqual([[true, true], [null, false]]);
    expect(r.correct).toBe(false);
    expect(r.complete).toBe(false);
    expect(checkMatrix([["1", "2"], ["3", "4"]], [[1, 2], [3, 4]]).correct).toBe(true);
  });

  it("порядок шагов: позиции на своих местах", () => {
    expect(checkOrder([0, 2, 1, 3])).toEqual({ positions: [true, false, false, true], correct: false });
    expect(checkOrder([0, 1, 2]).correct).toBe(true);
  });

  it("перемешанный порядок не совпадает с верным", () => {
    const r = rng(1);
    for (let n = 2; n < 7; n++) {
      const s = scrambled(n, (xs) => r.shuffle(xs));
      expect([...s].sort()).toEqual(Array.from({ length: n }, (_, i) => i));
      expect(s.some((v, i) => v !== i)).toBe(true);
    }
    // даже если перемешивание каждый раз возвращает исходный порядок
    expect(scrambled(3, (xs) => xs)).toEqual([1, 2, 0]);
  });
});

describe("генераторы", () => {
  it("детерминированы: один seed — одна задача", () => {
    for (const g of generators.values()) expect(g.make(42)).toEqual(g.make(42));
  });

  it("разные seed дают разные задачи", () => {
    for (const g of generators.values()) {
      const prompts = new Set(Array.from({ length: 8 }, (_, s) => g.make(s + 1).prompt));
      expect(prompts.size, g.id).toBeGreaterThan(3);
    }
  });

  it("ответы сходятся с условием", () => {
    for (let s = 1; s <= 30; s++) {
      const det = generator("la.det2").make(s);
      if (det.kind !== "numeric") throw new Error("ожидалась числовая задача");
      const m = /pmatrix\}(-?\d+) & (-?\d+) \\\\ (-?\d+) & (-?\d+)\\end/.exec(det.prompt)!;
      const [a, b, c, d] = m.slice(1).map(Number) as [number, number, number, number];
      expect(det.answer).toBe(a * d - b * c);
      const shapes = generator("la.shapes").make(s);
      if (shapes.kind !== "choice") throw new Error("ожидался выбор");
      expect(shapes.options.filter((o) => o.correct)).toHaveLength(1);
    }
  });

  // задачи диагностики (content/diagnostic.yaml): ответ пересчитывается по числам из условия
  const num = (spec: ReturnType<typeof make>) => {
    if (spec.kind !== "numeric") throw new Error(`ожидалась числовая задача: ${spec.prompt}`);
    return spec;
  };
  const make = (id: string, s: number) => generator(id).make(s);
  const coefOf = (c: string) => (c === "" ? 1 : c === "-" ? -1 : Number(c));
  const signed = (sign: string | undefined, v: string | undefined) => (v === undefined ? 0 : sign === "-" ? -Number(v) : Number(v));

  it("задачи модуля 0: ответы сходятся с условием", () => {
    for (let s = 1; s <= 40; s++) {
      const am = num(make("basics.argmin", s));
      const [, sign, shift, b] = /f\(x\) = \(x(?: ([-+]) (\d+))?\)\^2 \+ (\d+)/.exec(am.prompt)!;
      const a = sign === "-" ? Number(shift) : sign === "+" ? -Number(shift) : 0;
      expect(am.answer).toBe(a);
      expect(Number(b)).not.toBe(a);

      const ind = num(make("basics.indicator-sum", s));
      const xs = /x = \(([^)]*)\)/.exec(ind.prompt)![1]!.split(", ").map(Number);
      const t = Number(/x_i > (-?\d+)/.exec(ind.prompt)![1]);
      expect(xs).toContain(t);
      expect(ind.answer).toBe(xs.filter((x) => x > t).reduce((acc, x) => acc + x, 0));

      const sg = num(make("basics.sigmoid", s));
      const p = Number(/\\sigma\(z\) = (0\.\d+)/.exec(sg.prompt)![1]);
      expect(sg.answer).toBeCloseTo(1 - p, 10);

      const ch = num(make("basics.chain-rule", s));
      const [, ca, bs, bv, k] = /\((-?\d*)x(?: ([-+]) (\d+))?\)\^(\d)/.exec(ch.prompt)!;
      const x0 = Number(/f'\((-?\d+)\)/.exec(ch.prompt)![1]);
      const [aa, bb, kk] = [coefOf(ca!), signed(bs, bv), Number(k)];
      expect(ch.answer).toBe(kk * aa * (aa * x0 + bb) ** (kk - 1));

      const ig = num(make("basics.integral", s));
      const [, c, m, qs, qv] = /\\int_0\^\{(\d+)\} \((\d*)x(?: ([-+]) (\d+))?\)/.exec(ig.prompt)!;
      const [cc, mm, qq] = [Number(c), coefOf(m!), signed(qs, qv)];
      expect(ig.answer).toBeCloseTo((mm * cc * cc) / 2 + qq * cc, 10);

      const np = make("basics.numpy-shapes", s);
      if (np.kind !== "choice") throw new Error("ожидался выбор");
      const [, n, d] = /np\.ones\(\((\d+), (\d+)\)\)/.exec(np.prompt)!.map(Number);
      const code = /форма у \$\\texttt\{([^}]*)\}/.exec(np.prompt)![1];
      const expected = { "X @ theta": `(${n},)`, "X.mean(axis=0)": `(${d},)`, "X.T @ X": `(${d}, ${d})` }[code!];
      const right = np.options.filter((o) => o.correct);
      expect(right).toHaveLength(1);
      expect(right[0]!.text).toContain(expected!);

      const nt = make("basics.notation", s);
      if (nt.kind !== "choice") throw new Error("ожидался выбор");
      const [, i, j] = /x\^\{\((\d+)\)\}_(\d+)/.exec(nt.prompt)!;
      expect(nt.options.filter((o) => o.correct).map((o) => o.text)).toEqual([`${j}-й признак ${i}-го объекта`]);
    }
  });

  it("задачи модулей I и III для диагностики: ответы сходятся с условием", () => {
    for (let s = 1; s <= 40; s++) {
      const lc = make("la.lincomb", s);
      if (lc.kind !== "matrix") throw new Error("ожидалась матрица");
      const vecs = [...lc.prompt.matchAll(/pmatrix\}(-?\d+) \\\\ (-?\d+)\\end/g)].map((mm) => [Number(mm[1]), Number(mm[2])]);
      const [, ac, bsign, bc] = /Вычислите \$(-?\d*)u ([-+]) (\d*)v\$/.exec(lc.prompt)!;
      const [a, b] = [coefOf(ac!), (bsign === "-" ? -1 : 1) * (bc === "" ? 1 : Number(bc))];
      const [u, v] = vecs as [number[], number[]];
      expect(lc.answer).toEqual([[a * u[0]! + b * v[0]!], [a * u[1]! + b * v[1]!]]);

      const dt = num(make("la.dot", s));
      const [uu, vv] = [...dt.prompt.matchAll(/= \(([^)]*)\)/g)].map((mm) => mm[1]!.split(", ").map(Number)) as [number[], number[]];
      expect(dt.answer).toBe(uu.reduce((acc, x, k) => acc + x * vv[k]!, 0));

      const un = num(make("prob.union", s));
      const [pa, pb, pab] = [...un.prompt.matchAll(/= (0\.\d+)/g)].map((mm) => Number(mm[1]));
      expect(un.answer).toBeCloseTo(pa! + pb! - pab!, 10);
      expect(pab!).toBeLessThan(Math.min(pa!, pb!));

      const ct = num(make("prob.conditional-table", s));
      const [, n11, n12] = /\\text\{ходил\} & (\d+) & (\d+)/.exec(ct.prompt)!.map(Number);
      expect(ct.answer).toBeCloseTo(n11! / (n11! + n12!), 3);
    }
  });

  it("все тексты задач разбираются KaTeX", () => {
    const texts = (sp: ExerciseSpec) => [
      sp.prompt,
      ...(sp.hints ?? []),
      sp.right ?? "",
      sp.wrong ?? "",
      ...("label" in sp ? [sp.label] : []),
      ...("options" in sp ? sp.options.flatMap((o) => [o.text, o.why]) : []),
      ...("reveal" in sp ? [sp.reveal] : []),
      ...("steps" in sp ? sp.steps : []),
    ];
    for (const g of generators.values()) {
      for (let s = 1; s <= 12; s++) for (const t of texts(g.make(s))) expect(() => renderInline(t), `${g.id}, seed ${s}: ${t}`).not.toThrow();
    }
  });

  it("неизвестный генератор — понятная ошибка", () => {
    expect(() => generator("la.nope")).toThrow("нет генератора задач «la.nope»");
  });
});

describe("ГПСЧ", () => {
  it("воспроизводим и равномерен в пределах", () => {
    const a = rng(7);
    const b = rng(7);
    const xs = Array.from({ length: 1000 }, () => a.int(1, 6));
    expect(xs).toEqual(Array.from({ length: 1000 }, () => b.int(1, 6)));
    expect(Math.min(...xs)).toBe(1);
    expect(Math.max(...xs)).toBe(6);
    expect(rng(3).nonzero(-1, 1)).not.toBe(0);
  });
});
