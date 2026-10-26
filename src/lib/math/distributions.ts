// Дискретные распределения курса (уроки III.6, игра «Зоопарк распределений», виджет «Обозреватель распределений»):
// функции вероятности, матожидание и дисперсия по формулам. Без зависимостей от проекта.
export type FamilyId = "bernoulli" | "binomial" | "geometric" | "poisson" | "categorical";

export interface Params {
  /** Вероятность успеха (Бернулли, биномиальное, геометрическое). */
  phi?: number;
  /** Число испытаний (биномиальное). */
  n?: number;
  /** Интенсивность (Пуассон). */
  lambda?: number;
  /** Вероятности классов (категориальное). */
  probs?: readonly number[];
}

const factorial = (k: number) => {
  let f = 1;
  for (let i = 2; i <= k; i++) f *= i;
  return f;
};

export const binom = (n: number, k: number) => {
  if (k < 0 || k > n) return 0;
  let c = 1;
  for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i;
  return c;
};

/** P(X = k). Геометрическое — номер первого успеха, k = 1, 2, …; категориальное — класс k = 1, …, K. */
export function pmf(family: FamilyId, p: Params, k: number): number {
  if (!Number.isInteger(k)) return 0;
  const phi = p.phi ?? 0.5;
  switch (family) {
    case "bernoulli":
      return k === 1 ? phi : k === 0 ? 1 - phi : 0;
    case "binomial": {
      const n = p.n ?? 10;
      return k < 0 || k > n ? 0 : binom(n, k) * phi ** k * (1 - phi) ** (n - k);
    }
    case "geometric":
      return k < 1 ? 0 : (1 - phi) ** (k - 1) * phi;
    case "poisson": {
      const lam = p.lambda ?? 3;
      return k < 0 ? 0 : (Math.exp(-lam) * lam ** k) / factorial(k);
    }
    case "categorical": {
      const ps = p.probs ?? [1 / 3, 1 / 3, 1 / 3];
      return k >= 1 && k <= ps.length ? ps[k - 1]! : 0;
    }
  }
}

/** Матожидание и дисперсия по формулам семейства. */
export function moments(family: FamilyId, p: Params): { mean: number; variance: number } {
  const phi = p.phi ?? 0.5;
  switch (family) {
    case "bernoulli":
      return { mean: phi, variance: phi * (1 - phi) };
    case "binomial": {
      const n = p.n ?? 10;
      return { mean: n * phi, variance: n * phi * (1 - phi) };
    }
    case "geometric":
      return { mean: 1 / phi, variance: (1 - phi) / (phi * phi) };
    case "poisson": {
      const lam = p.lambda ?? 3;
      return { mean: lam, variance: lam };
    }
    case "categorical": {
      const ps = p.probs ?? [1 / 3, 1 / 3, 1 / 3];
      const mean = ps.reduce((s, q, i) => s + (i + 1) * q, 0);
      return { mean, variance: ps.reduce((s, q, i) => s + (i + 1 - mean) ** 2 * q, 0) };
    }
  }
}

/** Значения, которые стоит рисовать: всё носитель или до хвоста меньше 10⁻³. */
export function support(family: FamilyId, p: Params, cap = 25): number[] {
  switch (family) {
    case "bernoulli":
      return [0, 1];
    case "binomial":
      return Array.from({ length: (p.n ?? 10) + 1 }, (_, k) => k);
    case "categorical":
      return Array.from({ length: (p.probs ?? [0, 0, 0]).length }, (_, k) => k + 1);
    case "geometric":
    case "poisson": {
      const start = family === "geometric" ? 1 : 0;
      const out: number[] = [];
      let tail = 1;
      for (let k = start; k <= cap && (tail > 1e-3 || k <= start + 2); k++) {
        out.push(k);
        tail -= pmf(family, p, k);
      }
      return out;
    }
  }
}
