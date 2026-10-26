// Модель виджета «Конструктор GLM» (урок 1.6 «Основ ML»): четыре распределения ответа из экспоненциального семейства,
// для каждого — строка таблицы (T(y), η, a(η), b(y), отклик) и данные с одним признаком (data.json): цена,
// «дороже медианы» и сегмент от площади, просмотры от числа фото. Прогноз h(x) = E[y | x] при η = θ₀ + θ₁x; у
// Пуассона отклик можно подменить тождественным (неканоническим) — тогда λ бывает отрицательной.
import { newtonPath, sigmoid } from "../../../lib/math/logistic";
import { fitSoftmax, softmax } from "../../../lib/math/softmax";
import raw from "./data.json";

export type Dist = "normal" | "bernoulli" | "poisson" | "categorical";

export interface Row {
  name: string;
  T: string;
  eta: string;
  a: string;
  b: string;
  response: string;
}

export const TABLE: Record<Dist, Row> = {
  normal: { name: "нормальное, σ² = 1", T: "y", eta: "η = μ", a: "a(η) = η²/2", b: "b(y) = exp(−y²/2)/√(2π)", response: "h = η (тождественный)" },
  bernoulli: { name: "Бернулли", T: "y", eta: "η = log(φ/(1 − φ))", a: "a(η) = log(1 + exp η)", b: "b(y) = 1", response: "h = 1/(1 + exp(−η)) (сигмоида)" },
  poisson: { name: "Пуассон", T: "y", eta: "η = log λ", a: "a(η) = exp η", b: "b(y) = 1/y!", response: "h = exp η (экспонента)" },
  categorical: { name: "категориальное, k = 3", T: "T(y)_j = 1{y = j}, j = 1, 2", eta: "η_j = log(φ_j/φ_3)", a: "a(η) = log(1 + exp η₁ + exp η₂)", b: "b(y) = 1", response: "h = softmax(η₁, η₂, 0)" },
};

export const LABELS: Record<Dist, { x: string; y: string; story: string }> = {
  normal: { x: "площадь, м²", y: "цена, млн ₽", story: "цена квартиры от площади" },
  bernoulli: { x: "площадь, м²", y: "P(дороже)", story: "дороже ли квартира медианы, от площади" },
  poisson: { x: "фото в объявлении", y: "просмотры", story: "просмотры объявления за неделю от числа фото" },
  categorical: { x: "площадь, м²", y: "P(сегмент)", story: "сегмент квартиры (эконом, комфорт, бизнес) от площади" },
};

export const DATA: Record<Dist, { x: number[]; y: number[] }> = raw;

const lnFact = (k: number) => {
  let s = 0;
  for (let i = 2; i <= k; i++) s += Math.log(i);
  return s;
};

/** Прогноз E[y | x] и вероятность ответа для одномерных моделей; для категориального — по классам. */
export function predict(d: Dist, theta: readonly number[], x: number, canonical = true): number {
  const eta = theta[0]! + theta[1]! * x;
  if (d === "normal") return eta;
  if (d === "bernoulli") return sigmoid(eta);
  return canonical ? Math.exp(eta) : eta;
}

/** Средний логарифм правдоподобия; null, если модель допускает невозможный прогноз (λ ≤ 0). */
export function meanLogLik(d: Dist, theta: readonly number[], canonical = true): number | null {
  const { x, y } = DATA[d];
  if (d === "categorical") return null;
  let s = 0;
  for (let i = 0; i < x.length; i++) {
    const h = predict(d, theta, x[i]!, canonical);
    if (d === "normal") s += -0.5 * (y[i]! - h) ** 2 - 0.5 * Math.log(2 * Math.PI);
    else if (d === "bernoulli") s += y[i] ? Math.log(Math.max(h, 1e-300)) : Math.log(Math.max(1 - h, 1e-300));
    else {
      if (h <= 0) return null;
      s += y[i]! * Math.log(h) - h - lnFact(y[i]!);
    }
  }
  return s / x.length;
}

function poissonNewton(x: readonly number[], y: readonly number[]): number[] {
  const mean = y.reduce((a, b) => a + b, 0) / y.length;
  let t = [Math.log(mean), 0];
  for (let k = 0; k < 50; k++) {
    let g0 = 0, g1 = 0, h00 = 0, h01 = 0, h11 = 0;
    x.forEach((v, i) => {
      const lam = Math.exp(t[0]! + t[1]! * v);
      g0 += y[i]! - lam;
      g1 += (y[i]! - lam) * v;
      h00 += lam;
      h01 += lam * v;
      h11 += lam * v * v;
    });
    const det = h00 * h11 - h01 * h01;
    const step = [(h11 * g0 - h01 * g1) / det, (h00 * g1 - h01 * g0) / det];
    t = [t[0]! + step[0]!, t[1]! + step[1]!];
    if (Math.abs(step[0]!) + Math.abs(step[1]!) < 1e-10) break;
  }
  return t;
}

const AREA = DATA.categorical.x;
const AREA_MU = AREA.reduce((a, b) => a + b, 0) / AREA.length;
const AREA_SD = Math.sqrt(AREA.reduce((a, b) => a + (b - AREA_MU) ** 2, 0) / AREA.length);
let catTheta: number[][] | null = null;

/** Веса максимума правдоподобия для каждой модели (категориальная — спуском по стандартизованной площади). */
export function fitted(d: Dist): number[] {
  const { x, y } = DATA[d];
  if (d === "normal") {
    const n = x.length;
    const mx = x.reduce((a, b) => a + b, 0) / n;
    const my = y.reduce((a, b) => a + b, 0) / n;
    const b1 = x.reduce((a, v, i) => a + (v - mx) * (y[i]! - my), 0) / x.reduce((a, v) => a + (v - mx) ** 2, 0);
    return [my - b1 * mx, b1];
  }
  if (d === "bernoulli") return newtonPath(x.map((v) => [1, v]), y, [0, 0]).points.at(-1)!;
  if (d === "poisson") return poissonNewton(x, y);
  return [0, 0];
}

/** Вероятности трёх сегментов при площади x — модель с оптимальными весами (θ₃ = 0 после вычитания). */
export function categoricalProbs(x: number): number[] {
  catTheta ??= fitSoftmax(DATA.categorical.x.map((v) => [1, (v - AREA_MU) / AREA_SD]), DATA.categorical.y, 3, 2, 3000);
  const z = (x - AREA_MU) / AREA_SD;
  return softmax(catTheta.map((t) => t[0]! + t[1]! * z));
}

/** Распределение p(y | x): столбики для дискретных, плотность в точках для нормального. */
export function distribution(d: Dist, theta: readonly number[], x: number, canonical = true): { y: number; p: number }[] {
  if (d === "categorical") return categoricalProbs(x).map((p, j) => ({ y: j, p }));
  const h = predict(d, theta, x, canonical);
  if (d === "bernoulli") return [{ y: 0, p: 1 - h }, { y: 1, p: h }];
  if (d === "normal") return Array.from({ length: 41 }, (_, k) => h - 4 + k / 5).map((v) => ({ y: v, p: Math.exp(-0.5 * (v - h) ** 2) / Math.sqrt(2 * Math.PI) }));
  if (h <= 0) return [];
  return Array.from({ length: 16 }, (_, k) => ({ y: k, p: Math.exp(k * Math.log(h) - h - lnFact(k)) }));
}

