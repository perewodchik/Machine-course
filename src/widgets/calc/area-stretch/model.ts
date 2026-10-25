// Виджет «Как растягивается площадь при замене переменных» (урок II.10): прямоугольник [r, r + Δr] × [φ, φ + Δφ]
// в координатах (r, φ) переходит в кусок кольца на плоскости (x, y). Его площадь ½((r + Δr)² − r²)Δφ при малых Δ
// близка к |det J| Δr Δφ = r Δr Δφ. Модель без DOM: площади, якобиан, контур образа клетки.
export type Pt = [number, number];

/** Отображение полярных координат: (r, φ) ↦ (r cos φ, r sin φ). */
export const polar = (r: number, phi: number): Pt => [r * Math.cos(phi), r * Math.sin(phi)];

/** Якобиан ∂(x, y)/∂(r, φ) и его определитель r. */
export function jacobian(r: number, phi: number): { J: [[number, number], [number, number]]; det: number } {
  const J: [[number, number], [number, number]] = [
    [Math.cos(phi), -r * Math.sin(phi)],
    [Math.sin(phi), r * Math.cos(phi)],
  ];
  return { J, det: J[0][0] * J[1][1] - J[0][1] * J[1][0] };
}

/** Точная площадь образа клетки: кусок кольца. */
export const exactArea = (r: number, dr: number, dphi: number) => 0.5 * ((r + dr) ** 2 - r * r) * dphi;

/** Линейное приближение площади: |det J| Δr Δφ. */
export const linearArea = (r: number, dr: number, dphi: number) => Math.abs(jacobian(r, 0).det) * dr * dphi;

/** Контур образа клетки: дуга по внутреннему радиусу, отрезок, дуга по внешнему, отрезок. */
export function cellImage(r: number, dr: number, phi: number, dphi: number, m = 24): Pt[] {
  const arc = (rr: number, from: number, to: number) => Array.from({ length: m + 1 }, (_, i) => polar(rr, from + ((to - from) * i) / m));
  return [...arc(r, phi, phi + dphi), ...arc(r + dr, phi + dphi, phi), polar(r, phi)];
}
