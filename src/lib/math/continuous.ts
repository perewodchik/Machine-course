// Непрерывные распределения курса (урок III.7, виджет «Обозреватель непрерывных распределений»): плотность, функция
// распределения, матожидание и дисперсия. Без зависимостей от проекта.
export type ContId = "uniform" | "exponential" | "normal" | "laplace" | "logistic" | "beta";

/** Параметры: a, b — равномерное; lambda — показательное; mu, sigma — нормальное; mu, b — Лапласа; mu, s — логистическое; alpha, beta — бета. */
export interface ContParams {
  a?: number;
  b?: number;
  lambda?: number;
  mu?: number;
  sigma?: number;
  s?: number;
  alpha?: number;
  beta?: number;
}

/** erf по Абрамовицу — Стегану 7.1.26: погрешность меньше 1.5 · 10⁻⁷. */
export function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}

function simpson(f: (x: number) => number, a: number, b: number, n = 2000): number {
  if (b <= a) return 0;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}

const betaKernel = (al: number, be: number) => (x: number) => (x > 0 && x < 1 ? x ** (al - 1) * (1 - x) ** (be - 1) : 0);

/** log Γ(x) по Ланцошу (g = 7, 9 коэффициентов): относительная погрешность около 10⁻¹⁵ при x > 0. */
export function lgamma(x: number): number {
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
  const z = x - 1;
  let a = c[0]!;
  const t = z + 7.5;
  for (let i = 1; i < 9; i++) a += c[i]! / (z + i);
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a);
}

/** B(α, β) = Γ(α)Γ(β)/Γ(α + β). */
export const betaFn = (al: number, be: number) => Math.exp(lgamma(al) + lgamma(be) - lgamma(al + be));

export function pdf(id: ContId, p: ContParams, x: number): number {
  switch (id) {
    case "uniform": {
      const [a, b] = [p.a ?? 0, p.b ?? 1];
      return x >= a && x <= b ? 1 / (b - a) : 0;
    }
    case "exponential": {
      const lam = p.lambda ?? 1;
      return x >= 0 ? lam * Math.exp(-lam * x) : 0;
    }
    case "normal": {
      const [mu, s] = [p.mu ?? 0, p.sigma ?? 1];
      return Math.exp(-((x - mu) ** 2) / (2 * s * s)) / (Math.sqrt(2 * Math.PI) * s);
    }
    case "laplace": {
      const [mu, b] = [p.mu ?? 0, p.b ?? 1];
      return Math.exp(-Math.abs(x - mu) / b) / (2 * b);
    }
    case "logistic": {
      const [mu, s] = [p.mu ?? 0, p.s ?? 1];
      const e = Math.exp(-(x - mu) / s);
      return e / (s * (1 + e) ** 2);
    }
    case "beta": {
      const [al, be] = [p.alpha ?? 2, p.beta ?? 2];
      return betaKernel(al, be)(x) / betaFn(al, be);
    }
  }
}

export function cdf(id: ContId, p: ContParams, x: number): number {
  switch (id) {
    case "uniform": {
      const [a, b] = [p.a ?? 0, p.b ?? 1];
      return Math.min(1, Math.max(0, (x - a) / (b - a)));
    }
    case "exponential":
      return x >= 0 ? 1 - Math.exp(-(p.lambda ?? 1) * x) : 0;
    case "normal":
      return 0.5 * (1 + erf((x - (p.mu ?? 0)) / ((p.sigma ?? 1) * Math.SQRT2)));
    case "laplace": {
      const [mu, b] = [p.mu ?? 0, p.b ?? 1];
      return x < mu ? 0.5 * Math.exp((x - mu) / b) : 1 - 0.5 * Math.exp(-(x - mu) / b);
    }
    case "logistic":
      // функция распределения логистического — сигмоида
      return 1 / (1 + Math.exp(-(x - (p.mu ?? 0)) / (p.s ?? 1)));
    case "beta": {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      const [al, be] = [p.alpha ?? 2, p.beta ?? 2];
      return simpson(betaKernel(al, be), 0, x, 800) / betaFn(al, be);
    }
  }
}

export function contMoments(id: ContId, p: ContParams): { mean: number; variance: number } {
  switch (id) {
    case "uniform": {
      const [a, b] = [p.a ?? 0, p.b ?? 1];
      return { mean: (a + b) / 2, variance: (b - a) ** 2 / 12 };
    }
    case "exponential": {
      const lam = p.lambda ?? 1;
      return { mean: 1 / lam, variance: 1 / (lam * lam) };
    }
    case "normal":
      return { mean: p.mu ?? 0, variance: (p.sigma ?? 1) ** 2 };
    case "laplace":
      return { mean: p.mu ?? 0, variance: 2 * (p.b ?? 1) ** 2 };
    case "logistic":
      return { mean: p.mu ?? 0, variance: ((Math.PI * (p.s ?? 1)) ** 2) / 3 };
    case "beta": {
      const [al, be] = [p.alpha ?? 2, p.beta ?? 2];
      return { mean: al / (al + be), variance: (al * be) / ((al + be) ** 2 * (al + be + 1)) };
    }
  }
}
