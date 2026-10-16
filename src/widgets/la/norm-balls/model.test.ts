// «Единичные шары норм»: значения норм и вложенность шаров.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { norm, ordered } from "./model";

describe("нормы", () => {
  it("(3, −4): ℓ₁ = 7, ℓ₂ = 5, ℓ∞ = 4", () => {
    expect([norm("l1", [3, -4]), norm("l2", [3, -4]), norm("linf", [3, -4])]).toEqual([7, 5, 4]);
  });

  it("‖x‖∞ ≤ ‖x‖₂ ≤ ‖x‖₁ для любых x", () => {
    fc.assert(fc.property(fc.double({ min: -10, max: 10, noNaN: true }), fc.double({ min: -10, max: 10, noNaN: true }), (x, y) => ordered([x, y])));
  });
});
