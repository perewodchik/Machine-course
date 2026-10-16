// «Проекция с подвижным углом»: проекция, остаток перпендикулярен a, косинус совпадает с углом.
import { describe, expect, it } from "vitest";
import { cosAngle, dot, polar, project } from "./model";

describe("проекция", () => {
  it("b = (2, 2) на a = (3, 0): (2, 0); остаток (0, 2) перпендикулярен a", () => {
    const p = project([3, 0], [2, 2]);
    expect(p).toEqual([2, 0]);
    expect(dot([3, 0], [2 - p[0], 2 - p[1]])).toBe(0);
  });

  it("косинус угла по скалярному произведению равен cos φ", () => {
    for (const deg of [0, 30, 60, 90, 120, 180]) expect(cosAngle([3, 0], polar(2, deg))).toBeCloseTo(Math.cos((deg * Math.PI) / 180), 12);
  });

  it("тупой угол — отрицательное скалярное произведение и проекция в обратную сторону", () => {
    const b = polar(2, 135);
    expect(dot([3, 0], b)).toBeLessThan(0);
    expect(project([3, 0], b)[0]).toBeLessThan(0);
  });
});
