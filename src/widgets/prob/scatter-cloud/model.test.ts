// «Облако точек»: парабола и кольцо на 40 точках некоррелированы, линейное облако близко к заданному ρ.
import { describe, expect, it } from "vitest";
import { corr } from "../../../lib/math/correlation";
import { cloud } from "./model";

describe("облако точек", () => {
  it("парабола и кольцо: |r| < 0.1; линейное: r в пределах 0.2 от ρ", () => {
    expect(Math.abs(corr(cloud("parabola", 0)))).toBeLessThan(0.1);
    expect(Math.abs(corr(cloud("ring", 0)))).toBeLessThan(0.1);
    for (const rho of [-0.8, 0, 0.6]) expect(Math.abs(corr(cloud("linear", rho)) - rho)).toBeLessThan(0.2);
  });
});
