// Логистическая регрессия для виджетов урока 1.4 «Основ ML»: устойчивые сигмоида и ℓ(θ), градиент, метод Ньютона
// и градиентный подъём по ℓ/n. Матрица X — строки-объекты (первый столбец — единицы, если нужен свободный член).

export const sigmoid = (z: number) => 0.5 * (1 + Math.tanh(z / 2));
/** log(1 + e^t) без переполнения. */
export const softplus = (t: number) => (t > 0 ? t + Math.log1p(Math.exp(-t)) : Math.log1p(Math.exp(t)));

const dot = (a: readonly number[], b: readonly number[]) => a.reduce((s, v, i) => s + v * b[i]!, 0);

/** Средний логарифм правдоподобия ℓ(θ)/n. */
export function meanLoglik(theta: readonly number[], X: readonly (readonly number[])[], y: readonly number[]): number {
  return -X.reduce((s, x, i) => s + softplus(-(2 * y[i]! - 1) * dot(theta, x)), 0) / X.length;
}

/** Градиент ℓ(θ)/n = Xᵀ(y − g(Xθ))/n. */
export function meanGrad(theta: readonly number[], X: readonly (readonly number[])[], y: readonly number[]): number[] {
  const g = new Array<number>(theta.length).fill(0);
  X.forEach((x, i) => {
    const r = y[i]! - sigmoid(dot(theta, x));
    x.forEach((v, j) => (g[j]! += (r * v) / X.length));
  });
  return g;
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

const norm = (v: readonly number[]) => Math.hypot(...v);

/** Шаг Ньютона: θ + (XᵀDX/n)⁻¹ ∇(ℓ/n). */
export function newtonStep(theta: readonly number[], X: readonly (readonly number[])[], y: readonly number[]): number[] {
  const d = theta.length;
  const H = Array.from({ length: d }, () => new Array<number>(d).fill(0));
  for (const x of X) {
    const h = sigmoid(dot(theta, x));
    const w = (h * (1 - h)) / X.length;
    for (let a = 0; a < d; a++) for (let b = 0; b < d; b++) H[a]![b]! += w * x[a]! * x[b]!;
  }
  const step = solve(H, meanGrad(theta, X, y));
  return theta.map((t, j) => t + step[j]!);
}

export interface Path {
  points: number[][];
  /** Итераций до ‖∇ℓ‖ < tol (ℓ — сумма, как в ячейке урока) или null, если не дошли за max. */
  iters: number | null;
}

export function newtonPath(X: readonly (readonly number[])[], y: readonly number[], start: readonly number[], tol = 1e-6, max = 50): Path {
  const points = [[...start]];
  for (let k = 0; k < max; k++) {
    const t = points.at(-1)!;
    if (norm(meanGrad(t, X, y)) * X.length < tol) return { points, iters: k };
    points.push(newtonStep(t, X, y));
  }
  return { points, iters: null };
}

export function ascentPath(X: readonly (readonly number[])[], y: readonly number[], start: readonly number[], alpha: number, tol = 1e-6, max = 20_000): Path {
  const points = [[...start]];
  let t = [...start];
  for (let k = 0; k < max; k++) {
    const g = meanGrad(t, X, y);
    if (norm(g) * X.length < tol) return { points, iters: k };
    t = t.map((v, j) => v + alpha * g[j]!);
    points.push(t);
  }
  return { points, iters: null };
}
