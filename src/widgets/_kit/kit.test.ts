// Набор для рисунков: шкалы и клетка, обрезка по области графика, числа и подписи, клавиатура «живого числа».
import { describe, expect, it } from "vitest";
import { clipLine, clipSegment, labelAnchor } from "./clip";
import { fmt, labelParts, plainLabel } from "./format";
import { cellSize, gridLines, niceStep, planeLayout, ticks } from "./layout";
import { dragValue, keyValue, snap } from "./scrub";

describe("шкалы и клетка", () => {
  const opts = { x: [0, 10], y: [0, 7], xStep: 2, yStep: 2 } as const;

  it("область графика и шкалы как в прототипе (660 px)", () => {
    const l = planeLayout(660, opts);
    expect(l.inner).toEqual({ x: 40, y: 20, w: 600, h: 280 });
    expect(l.sx(0)).toBe(40);
    expect(l.sx(10)).toBe(640);
    expect(l.sy(0)).toBe(300);
    expect(l.sy(7)).toBe(20);
    expect(l.xTicks).toEqual([0, 2, 4, 6, 8, 10]);
    expect(l.yTicks).toEqual([0, 2, 4, 6]);
  });

  it("на узком экране ширина не меньше 300 px, высота не меньше 200", () => {
    const l = planeLayout(120, opts);
    expect(l.width).toBe(300);
    expect(l.inner.h).toBe(200);
  });

  it("клетка около 20 px и укладывается в шаг делений целое число раз", () => {
    for (const width of [300, 390, 660, 972, 1200]) {
      const l = planeLayout(width, opts);
      const stepPx = 2 * l.kx;
      const cells = stepPx / l.cellX;
      expect(Math.abs(cells - Math.round(cells))).toBeLessThan(1e-9);
      expect(l.cellX).toBeGreaterThan(12);
      expect(l.cellX).toBeLessThan(32);
    }
  });

  it("линии клетки проходят через деления осей", () => {
    const l = planeLayout(660, opts);
    const lines = gridLines(l.inner.x, l.inner.w, l.cellX, l.sx(0));
    for (const t of l.xTicks) expect(lines.some((p) => Math.abs(p - l.sx(t)) < 0.01)).toBe(true);
  });

  it("equal: одинаковый масштаб по осям, при упоре в max область сужается и встаёт посередине", () => {
    const free = planeLayout(660, { x: [-3, 3], y: [-1, 2], equal: true, height: { ratio: 1, min: 100, max: 1000 } });
    expect(free.kx).toBeCloseTo(-free.ky, 9);
    expect(free.inner.w).toBe(600);
    const capped = planeLayout(660, { x: [-2, 2], y: [-2, 2], equal: true, height: { ratio: 1, min: 100, max: 400 } });
    expect(capped.kx).toBeCloseTo(-capped.ky, 9);
    expect(capped.inner.h).toBe(400);
    expect(capped.inner.x - 40).toBeCloseTo(660 - 20 - (capped.inner.x + capped.inner.w), 9);
  });

  it("оси идут через ноль, если он в области, иначе по краю", () => {
    const l = planeLayout(660, { x: [-3, 3], y: [-2, 2] });
    expect(l.axisY).toBeCloseTo(l.sx(0));
    expect(l.axisX).toBeCloseTo(l.sy(0));
    const edge = planeLayout(660, { x: [1, 5], y: [2, 6] });
    expect(edge.axisY).toBe(edge.sx(1));
    expect(edge.axisX).toBe(edge.sy(2));
  });

  it("круглый шаг и деления без ошибок округления", () => {
    expect(niceStep(10)).toBe(2);
    expect(niceStep(1)).toBe(0.2);
    expect(niceStep(700)).toBe(100);
    expect(ticks(-0.3, 0.3, 0.1)).toEqual([-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3]);
    expect(cellSize(40)).toBe(20);
    expect(cellSize(10)).toBe(10);
  });
});

describe("обрезка по области графика", () => {
  const box = { x0: 0, x1: 10, y0: 0, y1: 7 };

  it("отрезок внутри не меняется, снаружи — null", () => {
    expect(clipSegment([1, 1], [2, 3], box)).toEqual([
      [1, 1],
      [2, 3],
    ]);
    expect(clipSegment([11, 1], [12, 3], box)).toBeNull();
  });

  it("прямая с крутым наклоном обрезается верхним краем", () => {
    const seg = clipLine(0, 2, box)!;
    expect(seg[0]).toEqual([0, 0]);
    expect(seg[1][0]).toBeCloseTo(3.5);
    expect(seg[1][1]).toBeCloseTo(7);
  });

  it("прямая целиком выше графика не видна — подписи нет", () => {
    expect(clipLine(9, 0.1, box)).toBeNull();
    expect(clipLine(-5, -1, box)).toBeNull();
  });

  it("подпись — у правого видимого конца, внутри области", () => {
    const [x, y] = labelAnchor(clipLine(0, 2, box)!);
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(3.5);
    expect(y).toBeLessThan(7);
  });
});

describe("числа и подписи", () => {
  it("десятичная точка и настоящий минус", () => {
    expect(fmt(0.5)).toBe("0.50");
    expect(fmt(-1.234, 1)).toBe("−1.2");
    expect(fmt(-0.0001)).toBe("0.00");
    expect(fmt(Infinity)).toBe("∞");
    expect(fmt(-Infinity, 1)).toBe("−∞");
  });

  it("индексы в подписях", () => {
    expect(labelParts("θ_0 + θ_1 x")).toEqual([
      { text: "θ" },
      { text: "0", sub: true },
      { text: " + θ" },
      { text: "1", sub: true },
      { text: " x" },
    ]);
    expect(labelParts("x_{12}")).toEqual([{ text: "x" }, { text: "12", sub: true }]);
    expect(plainLabel("ŷ = θ_0")).toBe("ŷ = θ0");
    expect(labelParts("cos φ")).toEqual([{ text: "cos", fn: true }, { text: " φ" }]);
    expect(labelParts("x_cos")).toEqual([{ text: "x" }, { text: "c", sub: true }, { text: "os" }]);
  });
});

describe("клавиатура и перетаскивание", () => {
  const o = { min: -1, max: 1, step: 0.05 };

  it("стрелки — шаг, PageUp — десять шагов, Home/End — края", () => {
    expect(keyValue("ArrowRight", 0.25, o)).toBe(0.3);
    expect(keyValue("ArrowDown", 0.25, o)).toBe(0.2);
    expect(keyValue("PageUp", 0.25, o)).toBe(0.75);
    expect(keyValue("PageUp", 0.75, o)).toBe(1);
    expect(keyValue("Home", 0.25, o)).toBe(-1);
    expect(keyValue("End", 0.25, o)).toBe(1);
    expect(keyValue("Enter", 0.25, o)).toBeNull();
  });

  it("значение на сетке шага и в пределах", () => {
    expect(snap(0.123, o)).toBe(0.1);
    expect(snap(5, o)).toBe(1);
    expect(dragValue(0, 30, o)).toBe(0.25);
    expect(dragValue(0, -1000, o)).toBe(-1);
  });
});
