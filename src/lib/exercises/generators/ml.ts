// Генераторы задач курса «Основы ML». Ответ — десятичная дробь, ввод с точкой или запятой.
import { rng } from "../../math/rng";
import type { Generator } from "../types";

const round = (v: number, k = 4) => Math.round(v * 10 ** k) / 10 ** k;
const median = (x: readonly number[]) => {
  const s = [...x].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2;
};

/** Урок 1.1: RMSE или MAE по ошибкам на тесте. */
export const rmseMae: Generator = {
  id: "ml.rmse-mae",
  version: 1,
  title: "RMSE и MAE",
  make(seed) {
    const r = rng(seed);
    const n = r.pick([4, 5]);
    const e = Array.from({ length: n }, () => r.int(-6, 6) / 2).map((v) => (v === 0 ? 0.5 : v));
    const isRmse = seed % 2 === 1;
    const answer = round(isRmse ? Math.sqrt(e.reduce((a, v) => a + v * v, 0) / n) : e.reduce((a, v) => a + Math.abs(v), 0) / n, 4);
    const list = e.map((v) => String(v).replace("-", "−")).join(";\\ ");
    return {
      kind: "numeric",
      prompt: String.raw`Ошибки модели $y^{(i)} - \hat y^{(i)}$ на ${n} тестовых квартирах, млн ₽: $${list}$. Найдите ${isRmse ? "RMSE" : "MAE"}.`,
      label: isRmse ? "RMSE =" : "MAE =",
      answer,
      tol: 0.002,
      hints: [isRmse ? String.raw`$\operatorname{RMSE} = \sqrt{\frac1n \sum_i e_i^2}$: квадраты, среднее, корень.` : String.raw`$\operatorname{MAE} = \frac1n \sum_i \lvert e_i \rvert$: модули и среднее.`],
      right: String.raw`${isRmse ? "RMSE" : "MAE"} $= ${answer}$. Всегда $\operatorname{RMSE} \ge \operatorname{MAE}$: квадрат сильнее наказывает большие ошибки.`,
      wrong: isRmse ? String.raw`Возведите ошибки в квадрат, усредните и извлеките корень; без корня получится MSE — в квадратах миллионов.` : String.raw`Берите модули: знак ошибки не важен, иначе ошибки разных знаков сократятся.`,
    };
  },
};

/** Урок 1.1: лучшая константа — среднее для квадратов, медиана для модулей. */
export const bestConstant: Generator = {
  id: "ml.best-constant",
  version: 1,
  title: "Лучшая константа",
  make(seed) {
    const r = rng(seed);
    const n = r.pick([5, 7]);
    const y = Array.from({ length: n - 1 }, () => r.int(4, 12));
    y.push(r.int(25, 40)); // дорогая квартира-выброс: среднее и медиана заметно расходятся
    const mae = seed % 2 === 0;
    const answer = round(mae ? median(y) : y.reduce((a, b) => a + b, 0) / n, 4);
    return {
      kind: "numeric",
      prompt: String.raw`Цены ${n} квартир обучающей выборки, млн ₽: $${y.join(",\\ ")}$. Модель отвечает одной константой $c$ для всех. Какая $c$ минимизирует ${mae ? "MAE — среднюю абсолютную ошибку" : "MSE — средний квадрат ошибки"} на этих квартирах?`,
      label: "c =",
      answer,
      tol: 0.002,
      hints: [mae ? "Для суммы модулей сдвиг константы приближает её к одной половине точек и удаляет от другой — где это уравновешено?" : String.raw`Продифференцируйте $\sum_i (y^{(i)} - c)^2$ по $c$ и приравняйте к нулю.`],
      right: mae ? String.raw`Медиана $= ${answer}$: выброс почти не влияет на неё.` : String.raw`Среднее $= ${answer}$: для квадратов лучшая константа — $\bar y$.`,
      wrong: mae ? String.raw`Для MAE лучшая константа — медиана (здесь $${answer}$), а не среднее: дорогой выброс тянет среднее вверх.` : String.raw`Для MSE лучшая константа — среднее $\bar y = ${answer}$, а не медиана.`,
    };
  },
};
