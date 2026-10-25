// Модель виджета «Сжать картинку SVD» (урок I.11): картинка — матрица яркостей, её сингулярные числа и
// приближения ранга k. SVD считается через собственное разложение AᵀA методом Якоби: A_k = A V_k V_kᵀ,
// поэтому U не нужна. Чистые функции — их проверяет model.test.ts.

export type Matrix = number[][];

export const SIZE = 48;

/**
 * Картинка: домик с крышей, дверью и окном, солнце и полоса земли. 1 — тушь, 0 — бумага. Прямоугольники
 * дают маленький ранг, круг и треугольник крыши — длинный хвост сингулярных чисел.
 */
export function picture(n = SIZE): Matrix {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      const [y, x] = [(i * SIZE) / n, (j * SIZE) / n];
      if (y >= 41) return 0.3; // земля
      if (y >= 31 && y < 41 && x >= 15 && x < 20) return 0.15; // дверь
      if (y >= 27 && y < 31 && x >= 22 && x < 26) return 0.15; // окно
      if (y >= 24 && y < 41 && x >= 8 && x < 28) return 0.85; // стены
      if (y >= 11 && y < 24 && Math.abs(x - 17.5) <= (y - 11) * 0.95 + 0.5) return 0.6; // крыша
      if ((y - 10) ** 2 + (x - 38) ** 2 <= 25) return 0.5; // солнце
      return 0;
    }),
  );
}

const transposeTimes = (A: Matrix): Matrix => {
  const n = A[0]!.length;
  return Array.from({ length: n }, (_, p) => Array.from({ length: n }, (_, q) => A.reduce((acc, row) => acc + row[p]! * row[q]!, 0)));
};

/** Собственное разложение симметричной матрицы циклическим методом Якоби: значения по убыванию, векторы — столбцы. */
export function symEig(S0: Matrix): { values: number[]; vectors: Matrix } {
  const n = S0.length;
  const S = S0.map((row) => [...row]);
  const V: Matrix = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  const scale = S.reduce((acc, row) => acc + row.reduce((a, x) => a + x * x, 0), 0);
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += S[p]![q]! ** 2;
    if (off <= 1e-26 * scale) break;
    for (let p = 0; p < n; p++)
      for (let q = p + 1; q < n; q++) {
        const apq = S[p]![q]!;
        if (Math.abs(apq) < 1e-300) continue;
        const tau = (S[q]![q]! - S[p]![p]!) / (2 * apq);
        const t = Math.sign(tau || 1) / (Math.abs(tau) + Math.sqrt(1 + tau * tau));
        const c = 1 / Math.sqrt(1 + t * t);
        const s = t * c;
        for (let k = 0; k < n; k++) {
          const [skp, skq] = [S[k]![p]!, S[k]![q]!];
          S[k]![p] = c * skp - s * skq;
          S[k]![q] = s * skp + c * skq;
        }
        for (let k = 0; k < n; k++) {
          const [spk, sqk] = [S[p]![k]!, S[q]![k]!];
          S[p]![k] = c * spk - s * sqk;
          S[q]![k] = s * spk + c * sqk;
        }
        for (let k = 0; k < n; k++) {
          const [vkp, vkq] = [V[k]![p]!, V[k]![q]!];
          V[k]![p] = c * vkp - s * vkq;
          V[k]![q] = s * vkp + c * vkq;
        }
      }
  }
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => S[b]![b]! - S[a]![a]!);
  return { values: order.map((i) => S[i]![i]!), vectors: V.map((row) => order.map((i) => row[i]!)) };
}

export interface ImageSvd {
  /** σ₁ ≥ σ₂ ≥ … ≥ 0. */
  s: number[];
  /** Правые сингулярные векторы — столбцы. */
  V: Matrix;
}

/** Сингулярные числа и правые векторы: AᵀA = V S² Vᵀ. */
export function svdOf(A: Matrix): ImageSvd {
  const { values, vectors } = symEig(transposeTimes(A));
  return { s: values.map((l) => Math.sqrt(Math.max(l, 0))), V: vectors };
}

/** Приближение ранга k: A_k = A V_k V_kᵀ = σ₁u₁v₁ᵀ + … + σ_k u_k v_kᵀ. */
export function lowRank(A: Matrix, V: Matrix, k: number): Matrix {
  const n = V.length;
  const P = A.map((row) => Array.from({ length: k }, (_, c) => row.reduce((acc, a, j) => acc + a * V[j]![c]!, 0)));
  return P.map((p) => Array.from({ length: n }, (_, j) => p.reduce((acc, x, c) => acc + x * V[j]![c]!, 0)));
}

/** Относительная ошибка ‖A − A_k‖_F / ‖A‖_F = √(Σ_{i>k} σᵢ² / Σ σᵢ²) — теорема Эккарта — Янга. */
export function relError(s: readonly number[], k: number): number {
  const total = s.reduce((acc, x) => acc + x * x, 0);
  const tail = s.slice(k).reduce((acc, x) => acc + x * x, 0);
  return Math.sqrt(tail / total);
}

/** Сколько чисел хранить: k столбцов U, k строк Vᵀ и k сингулярных чисел. */
export const storage = (m: number, n: number, k: number) => k * (m + n + 1);

/** Численный ранг: сингулярные числа больше относительного порога. */
export const numericRank = (s: readonly number[], tol = 1e-9) => s.filter((x) => x > tol * s[0]!).length;
