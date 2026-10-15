// Форма по ходу ввода (S3.06): форма, «число», ошибка формы, уравнения.
import { describe, expect, it } from "vitest";
import type { SymbolShape } from "./equivalent";
import { lineShape, shapeOf } from "./shape";

const s: SymbolShape[] = [
  { name: "X", shape: ["n", "d"] },
  { name: "theta", shape: ["d", 1] },
  { name: "y", shape: ["n", 1] },
];

describe("форма по ходу ввода", () => {
  it("форма, число и пустое поле", () => {
    expect(shapeOf(String.raw`X^\top X\theta`, s)).toEqual({ ok: true, text: "форма 3 × 1" });
    expect(shapeOf(String.raw`\theta^\top X^\top y`, s)).toEqual({ ok: true, text: "число" });
    expect(shapeOf("  ", s)).toBeNull();
  });

  it("формы не сходятся — где именно; незаконченная запись", () => {
    expect(shapeOf(String.raw`X\theta^\top`, s)).toMatchObject({ ok: false, text: expect.stringContaining("произведение 7 × 3 на 1 × 3") });
    expect(shapeOf(String.raw`X^\top(`, s)).toEqual({ ok: false, text: "запись пока не разобрана" });
  });

  it("строки вывода: продолжение, градиент, уравнение", () => {
    expect(lineShape(String.raw`= \tfrac12 \lVert X\theta - y\rVert^2`, s)).toEqual({ ok: true, text: "число" });
    expect(lineShape(String.raw`\nabla_\theta J = X^\top X\theta - X^\top y`, s)).toEqual({ ok: true, text: "форма 3 × 1" });
    expect(lineShape(String.raw`X^\top X\theta = X^\top y`, s)).toEqual({ ok: true, text: "уравнение, форма 3 × 1" });
    expect(lineShape(String.raw`X^\top X\theta - X^\top y = 0`, s)).toMatchObject({ ok: true });
    expect(lineShape(String.raw`X\theta = X^\top y`, s)).toEqual({ ok: false, text: "части уравнения разной формы: 7 × 1 и 3 × 1" });
  });
});
