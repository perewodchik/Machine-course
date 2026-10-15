// Символьные ответы: разбор TeX (Compute Engine), значение на матрицах, эквивалентность на случайных формах.
import { describe, expect, it } from "vitest";
import { matchMutation } from "./check";
import { equivalent, type SymbolShape } from "./equivalent";
import { evaluate, scalar } from "./evaluate";
import { parseTex } from "./parse";

const linreg: SymbolShape[] = [
  { name: "X", shape: ["n", "d"] },
  { name: "theta", shape: ["d", 1] },
  { name: "y", shape: ["n", 1] },
];
const check = (student: string, answer: string, symbols: SymbolShape[] = linreg) => equivalent(parseTex(student)!, parseTex(answer)!, symbols);

describe("эквивалентность на случайных матрицах", () => {
  it("равные формы записи градиента МНК", () => {
    expect(check(String.raw`X^\top(X\theta - y)`, String.raw`X^\top X\theta - X^\top y`)).toEqual({ ok: true });
    expect(check(String.raw`X^{T}X\theta-X^{T}y`, String.raw`X^\top X\theta - X^\top y`)).toEqual({ ok: true });
    expect(check(String.raw`(X\theta)^\top`, String.raw`\theta^\top X^\top`)).toEqual({ ok: true });
  });

  it("транспонирование без смены порядка — ошибка формы с понятным текстом", () => {
    const v = check(String.raw`X^\top \theta^\top`, String.raw`\theta^\top X^\top`);
    expect(v).toMatchObject({ ok: false, kind: "shape" });
    expect(v.ok || v.message).toContain("произведение 3 × 7 на 1 × 3");
  });

  it("форма верная, значения нет — ошибка значения", () => {
    expect(check(String.raw`X^\top X\theta + X^\top y`, String.raw`X^\top X\theta - X^\top y`)).toMatchObject({ ok: false, kind: "value" });
  });

  it("неверная форма ответа", () => {
    expect(check(String.raw`X\theta - y`, String.raw`X^\top(X\theta - y)`)).toEqual({ ok: false, kind: "shape", message: "форма ответа 7 × 1, а нужна 3 × 1" });
  });

  it("неизвестный символ и неразобранная запись", () => {
    expect(check(String.raw`X^\top w`, String.raw`X^\top y`)).toMatchObject({ ok: false, kind: "symbol" });
    expect(check(String.raw`X^\top (`, String.raw`X^\top y`)).toMatchObject({ ok: false, kind: "syntax" });
  });

  it("числа: логарифм, сигмоида, норма, след", () => {
    const pos: SymbolShape[] = [{ name: "a", positive: true }, { name: "b", positive: true }];
    expect(check(String.raw`\log a + \log b`, String.raw`\log(ab)`, pos)).toEqual({ ok: true });
    expect(check(String.raw`\ln(a) - \ln b`, String.raw`\log\frac{a}{b}`, pos)).toEqual({ ok: true });
    const z: SymbolShape[] = [{ name: "z" }];
    expect(check(String.raw`1 - \sigma(z)`, String.raw`\sigma(-z)`, z)).toEqual({ ok: true });
    expect(check(String.raw`\frac{e^{-z}}{1 + e^{-z}}`, String.raw`1 - \frac{1}{1+e^{-z}}`, z)).toEqual({ ok: true });
    const v: SymbolShape[] = [{ name: "x", shape: ["d", 1] }];
    expect(check(String.raw`\lVert x \rVert^2`, String.raw`x^\top x`, v)).toEqual({ ok: true });
    const sq: SymbolShape[] = [{ name: "A", shape: ["d", "d"] }, { name: "B", shape: ["d", "d"] }];
    expect(check(String.raw`\operatorname{tr}(BA)`, String.raw`\operatorname{tr}(AB)`, sq)).toEqual({ ok: true });
    expect(check(String.raw`(AB)^{-1}`, String.raw`B^{-1}A^{-1}`, sq)).toEqual({ ok: true });
    // \det A \det B парсер читает как det(A · det B): у функции без скобок аргумент — всё до конца произведения
    expect(check(String.raw`\det(AB)`, String.raw`\det(A)\det(B)`, sq)).toEqual({ ok: true });
  });

  it("x^{(i)} — объект с номером, а не степень", () => {
    const s: SymbolShape[] = [{ name: "theta", shape: ["d", 1] }, { name: "x^(i)", shape: ["d", 1] }];
    expect(check(String.raw`x^{(i)\top}\theta`, String.raw`\theta^\top x^{(i)}`, s)).toEqual({ ok: true });
  });
});

describe("значение выражения", () => {
  it("константы и скобки", () => {
    expect(evaluate(parseTex(String.raw`2\pi`)!, new Map()).v[0]).toBeCloseTo(2 * Math.PI, 12);
    expect(evaluate(parseTex(String.raw`\frac{1}{2}(a+1)`)!, new Map([["a", scalar(3)]])).v[0]).toBe(2);
  });
});

describe("типичные ошибки (S3.05)", () => {
  const mutations = [String.raw`X^\top X\theta + X^\top y`, String.raw`2X^\top X\theta - 2X^\top y`, String.raw`X^\top \theta^\top`];
  it("ответ, равный мутации по значению, узнаётся в любой равной записи", () => {
    expect(matchMutation(String.raw`X^\top(X\theta + y)`, mutations, linreg)).toBe(0);
    expect(matchMutation(String.raw`2X^\top(X\theta - y)`, mutations, linreg)).toBe(1);
  });
  it("мутация с ошибкой формы узнаётся по записи", () => {
    expect(matchMutation(String.raw`X^{T}\theta^{T}`, mutations, linreg)).toBe(2);
  });
  it("другая ошибка — не мутация", () => {
    expect(matchMutation(String.raw`X\theta - y`, mutations, linreg)).toBe(-1);
  });
});

