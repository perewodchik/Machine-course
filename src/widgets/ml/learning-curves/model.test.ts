// «Кривые обучения»: прямая — смещение (обе кривые на плато выше цели), степень 10 на малых n — разброс, степень 3 на
// большом n — цель достигнута; ошибка обучения растёт с n, валидации — падает; удвоение n не лечит смещение.
import { describe, expect, it } from "vitest";
import { curves, diagnose, SIGMA, TARGET } from "./model";

describe("кривые обучения", () => {
  it("диагнозы: прямая — смещение, степень 10 при n ≤ 40 — разброс, степень 3 при n = 640 — в порядке", () => {
    expect(diagnose(curves(1, 0, 640))).toBe("bias");
    expect(diagnose(curves(10, 0, 40))).toBe("variance");
    expect(diagnose(curves(3, 0, 640))).toBe("ok");
  });

  it("обучение растёт, валидация падает и сходятся к σ² с двух сторон", () => {
    const c = curves(3, 0, 640);
    expect(c[0]!.train).toBeLessThan(c.at(-1)!.train);
    expect(c[0]!.val).toBeGreaterThan(c.at(-1)!.val);
    expect(c.at(-1)!.train).toBeLessThan(SIGMA * SIGMA);
    expect(c.at(-1)!.val).toBeGreaterThan(SIGMA * SIGMA);
  });

  it("смещение данными не лечится: у прямой при n ×2 валидация почти та же и выше цели", () => {
    const a = curves(1, 0, 640).at(-1)!;
    const b = curves(1, 0, 1280).at(-1)!;
    expect(Math.abs(a.val - b.val)).toBeLessThan(0.02);
    expect(b.val).toBeGreaterThan(TARGET);
  });
});
