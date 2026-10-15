// Движок упражнений: разбор чисел (точка и запятая), проверки всех типов, генераторы с seed, ГПСЧ.
import { describe, expect, it } from "vitest";
import { rng } from "../math/rng";
import { checkMatrix, checkNumeric, checkOrder, closeEnough, scrambled } from "./check";
import { generator, generators } from "./generators";
import { formatNumber, parseNumber } from "./parse";

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
