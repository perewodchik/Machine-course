// «Оболочка двух векторов»: вид оболочки по определителю и решётка целых комбинаций.
import { describe, expect, it } from "vitest";
import { combo, lattice, PRESETS, spanKind } from "./model";

describe("оболочка", () => {
  it("вид оболочки у заготовок: плоскость, прямая, прямая через ноль", () => {
    expect(PRESETS.map((p) => spanKind(p.a, p.b))).toEqual(["plane", "line", "line"]);
    expect(spanKind([0, 0], [0, 0])).toBe("point");
  });

  it("комбинация: 1·a + 2·b", () => {
    expect(combo([2, 1], [-1, 1], 1, 2)).toEqual([0, 3]);
  });

  it("решётка независимых векторов заполняет поле, у параллельных лежит на одной прямой", () => {
    const [ind, par] = PRESETS;
    expect(lattice(ind!.a, ind!.b, 6).length).toBeGreaterThan(40);
    const line = lattice(par!.a, par!.b, 6);
    expect(line.every(([x, y]) => x === 2 * y)).toBe(true);
  });
});
