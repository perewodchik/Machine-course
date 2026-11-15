// Модель виджета «Путь регуляризации» (урок 2.3 «Основ ML»): первые 300 «Квартир» (data.json), 200 — обучение,
// 100 — валидация. Признаки центрируются и стандартизуются по обучающей части (или, для сравнения, площадь в см² без
// стандартизации). Гребневая: (XᵀX + nλI)θ = Xᵀy; лассо: ‖Xθ − y‖²/(2n) + λ‖θ‖₁ покоординатным спуском, как Lasso.
// Для двух признаков (площадь, комнаты) — решение с ограничением ‖θ‖ ≤ t бисекцией по λ.
import raw from "./data.json";

export const NAMES = ["площадь", "комнат", "этаж", "до метро", "возраст"] as const;
export type Penalty = "l2" | "l1";

export interface Design {
  Xtr: number[][];
  ytr: number[];
  Xva: number[][];
  yva: number[];
}

/** Центрированные (и стандартизованные) признаки; ответы центрированы средним обучения. */
export function design(standardize: boolean, cols: readonly number[] = [0, 1, 2, 3, 4]): Design {
  const X = raw.X.map((r) => cols.map((c) => (!standardize && c === 0 ? r[c]! * 1e4 : r[c]!)));
  const tr = X.slice(0, 200);
  const d = cols.length;
  const mu = Array.from({ length: d }, (_, j) => tr.reduce((a, r) => a + r[j]!, 0) / tr.length);
  const sd = Array.from({ length: d }, (_, j) => Math.sqrt(tr.reduce((a, r) => a + (r[j]! - mu[j]!) ** 2, 0) / tr.length));
  const z = X.map((r) => r.map((v, j) => (v - mu[j]!) / (standardize ? sd[j]! : 1)));
  const my = raw.y.slice(0, 200).reduce((a, b) => a + b, 0) / 200;
  const y = raw.y.map((v) => v - my);
  return { Xtr: z.slice(0, 200), ytr: y.slice(0, 200), Xva: z.slice(200), yva: y.slice(200) };
}

function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]!]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let i = c + 1; i < n; i++) if (Math.abs(M[i]![c]!) > Math.abs(M[p]![c]!)) p = i;
    [M[c], M[p]] = [M[p]!, M[c]!];
    for (let i = c + 1; i < n; i++) {
      const k = M[i]![c]! / M[c]![c]!;
      for (let j = c; j <= n; j++) M[i]![j]! -= k * M[c]![j]!;
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i]![n]!;
    for (let j = i + 1; j < n; j++) s -= M[i]![j]! * x[j]!;
    x[i] = s / M[i]![i]!;
  }
  return x;
}

/** Гребневая для J = ‖Xθ − y‖²/(2n) + λ‖θ‖²/2: (XᵀX/n + λI)θ = Xᵀy/n. */
export function ridge(X: readonly number[][], y: readonly number[], lam: number): number[] {
  const d = X[0]!.length;
  const n = X.length;
  const A = Array.from({ length: d }, (_, a) => Array.from({ length: d }, (_, b) => X.reduce((s, r) => s + r[a]! * r[b]!, 0) / n + (a === b ? lam : 0)));
  const b = Array.from({ length: d }, (_, a) => X.reduce((s, r, i) => s + r[a]! * y[i]!, 0) / n);
  return solve(A, b);
}

const soft = (z: number, l: number) => Math.sign(z) * Math.max(Math.abs(z) - l, 0);

/** Лассо покоординатным спуском с тёплым стартом. */
export function lasso(X: readonly number[][], y: readonly number[], lam: number, start?: readonly number[], sweeps = 500): number[] {
  const n = X.length;
  const d = X[0]!.length;
  const theta = start ? [...start] : new Array<number>(d).fill(0);
  const norms = Array.from({ length: d }, (_, j) => X.reduce((s, r) => s + r[j]! ** 2, 0) / n);
  const r = y.map((v, i) => v - X[i]!.reduce((s, x, j) => s + x * theta[j]!, 0));
  for (let it = 0; it < sweeps; it++) {
    let change = 0;
    for (let j = 0; j < d; j++) {
      const old = theta[j]!;
      let rho = 0;
      for (let i = 0; i < n; i++) rho += X[i]![j]! * r[i]!;
      rho = rho / n + norms[j]! * old;
      theta[j] = soft(rho, lam) / norms[j]!;
      const delta = theta[j]! - old;
      if (delta !== 0) for (let i = 0; i < n; i++) r[i]! -= X[i]![j]! * delta;
      change = Math.max(change, Math.abs(delta) * Math.sqrt(norms[j]!));
    }
    if (change < 1e-9) break;
  }
  return theta;
}

export const LOG_LAMBDA = Array.from({ length: 81 }, (_, k) => -3 + k / 20); // lg λ от −3 до 1 с шагом 0.05

const rmse = (X: readonly number[][], y: readonly number[], t: readonly number[]) => Math.sqrt(X.reduce((s, r, i) => s + (r.reduce((a, v, j) => a + v * t[j]!, 0) - y[i]!) ** 2, 0) / X.length);

/** Путь θ_j(lg λ) и ошибки на обучении и валидации. */
export function path(d: Design, pen: Penalty) {
  let warm: number[] | undefined;
  return [...LOG_LAMBDA].reverse().map((lg) => {
    const lam = 10 ** lg;
    const theta = pen === "l2" ? ridge(d.Xtr, d.ytr, lam) : (warm = lasso(d.Xtr, d.ytr, lam, warm));
    return { lg, theta, train: rmse(d.Xtr, d.ytr, theta), val: rmse(d.Xva, d.yva, theta) };
  }).reverse();
}

/** Два признака: решение задачи со штрафом, у которого ‖θ‖ (L2) или ‖θ‖₁ (L1) равна t, — бисекцией по λ. */
export function constrained(d2: Design, pen: Penalty, t: number): number[] {
  const norm = (v: number[]) => (pen === "l2" ? Math.hypot(...v) : Math.abs(v[0]!) + Math.abs(v[1]!));
  const fit = (lam: number) => (pen === "l2" ? ridge(d2.Xtr, d2.ytr, lam) : lasso(d2.Xtr, d2.ytr, lam));
  const free = fit(0);
  if (norm(free) <= t) return free;
  let lo = -6;
  let hi = 2;
  for (let it = 0; it < 50; it++) {
    const mid = (lo + hi) / 2;
    if (norm(fit(10 ** mid)) > t) lo = mid;
    else hi = mid;
  }
  return fit(10 ** hi);
}

/** Матрица ½XᵀX/n и МНК-решение для линий уровня J в плоскости двух весов. */
export function quadratic(d2: Design) {
  const n = d2.Xtr.length;
  const g = (a: number, b: number) => d2.Xtr.reduce((s, r) => s + r[a]! * r[b]!, 0) / n;
  return { H: [[g(0, 0), g(0, 1)], [g(0, 1), g(1, 1)]] as [[number, number], [number, number]], ols: ridge(d2.Xtr, d2.ytr, 0) };
}
