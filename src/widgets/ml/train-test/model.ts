// Модель виджета «Обучение и тест» (урок 1.1 «Основ ML»): по выборке из n обучающих и 200 тестовых квартир — полиномы
// степени 0–12, ошибка RMSE на обучении и на тесте для каждой степени. Данные — из rng(seed).
import { apartmentPoints, polyFit, rmse, type Pt } from "../../../lib/math/poly";
import { rng } from "../../../lib/math/rng";

export const DEGREES = 12;
export const TEST = 200;

export interface Sample {
  train: Pt[];
  test: Pt[];
}

export function sample(seed: number, n: number): Sample {
  const r = rng(seed);
  return { train: apartmentPoints(r, n), test: apartmentPoints(r, TEST) };
}

/** Кривые ошибки: для степени d — RMSE на обучении и на тесте. */
export function curves(s: Sample) {
  return Array.from({ length: DEGREES + 1 }, (_, d) => {
    const theta = polyFit(s.train, d);
    return { d, theta, train: rmse(theta, s.train), test: rmse(theta, s.test) };
  });
}
