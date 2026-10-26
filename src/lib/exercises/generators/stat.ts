// Генераторы задач по статистике (модуль IV). Ответ — десятичная дробь, ввод с точкой или запятой.
import { rng } from "../../math/rng";
import type { Generator } from "../types";

const round = (v: number, k = 4) => Math.round(v * 10 ** k) / 10 ** k;
const sorted = (x: readonly number[]) => [...x].sort((a, b) => a - b);

/** Урок IV.1: среднее или медиана небольшой выборки, в которой может быть выброс. */
export const meanMedian: Generator = {
  id: "stat.mean-median",
  version: 1,
  title: "Среднее и медиана",
  make(seed) {
    const r = rng(seed);
    const n = r.pick([5, 6, 7]);
    const x = Array.from({ length: n }, () => r.int(2, 12));
    if (seed % 3 === 0) x[r.int(0, n - 1)] = r.pick([40, 60, 90]);
    const s = sorted(x);
    const wantMedian = seed % 2 === 0;
    const med = n % 2 === 1 ? s[(n - 1) / 2]! : (s[n / 2 - 1]! + s[n / 2]!) / 2;
    const mean = x.reduce((a, b) => a + b, 0) / n;
    const answer = round(wantMedian ? med : mean, 4);
    return {
      kind: "numeric",
      prompt: String.raw`Выборка: $${x.join(", ")}$. Найдите ${wantMedian ? "медиану" : String.raw`выборочное среднее $\bar x$`}.`,
      label: wantMedian ? String.raw`медиана $=$` : String.raw`$\bar x =$`,
      answer,
      tol: 0.005,
      hints: [wantMedian ? String.raw`Упорядочьте: $${s.join(", ")}$. ${n % 2 === 1 ? "Медиана — средний элемент." : "При чётном $n$ медиана — полусумма двух средних элементов."}` : String.raw`$\bar x = \frac1n \sum_i x^{(i)}$, здесь $n = ${n}$.`],
      right: wantMedian ? String.raw`По порядку $${s.join(", ")}$; медиана — $${answer}$.` : String.raw`$\bar x = ${x.reduce((a, b) => a + b, 0)}/${n} \approx ${answer}$.`,
      wrong: wantMedian ? String.raw`Медиану ищут в упорядоченной выборке: $${s.join(", ")}$${n % 2 === 0 ? String.raw`, при $n = ${n}$ — полусумма двух средних` : ""}.` : String.raw`Сложите все $${n}$ значений и разделите на $${n}$; среднее — не середина по порядку.`,
    };
  },
};

/** Урок IV.1: межквартильный размах выборки из 9 чисел — квартили попадают точно на элементы. */
export const iqrGen: Generator = {
  id: "stat.iqr",
  version: 1,
  title: "Квартили и межквартильный размах",
  make(seed) {
    const r = rng(seed);
    const x = r.shuffle(Array.from({ length: 9 }, () => r.int(1, 30)));
    const s = sorted(x);
    // q(n − 1) = 2 и 6 при n = 9: квартили — третий и седьмой элементы по порядку
    const [q1, q3] = [s[2]!, s[6]!];
    return {
      kind: "numeric",
      prompt: String.raw`Выборка из девяти чисел: $${x.join(", ")}$. Квартили считают как в NumPy: квантиль уровня $q$ стоит на позиции $q(n - 1)$ упорядоченной выборки, считая с нуля. Найдите межквартильный размах $Q_3 - Q_1$.`,
      label: String.raw`$Q_3 - Q_1 =$`,
      answer: q3 - q1,
      tol: 0.001,
      hints: [String.raw`Упорядочьте выборку: $${s.join(", ")}$. Позиции $0.25 \cdot 8 = 2$ и $0.75 \cdot 8 = 6$.`],
      right: String.raw`$Q_1 = ${q1}$, $Q_3 = ${q3}$, размах $${q3 - q1}$.`,
      wrong: String.raw`Квартили берутся из упорядоченной выборки $${s.join(", ")}$: элементы с номерами $2$ и $6$, считая с нуля, — $${q1}$ и $${q3}$.`,
    };
  },
};

/** Урок IV.1: как одно изменённое значение сдвигает среднее (Δ/n) и что происходит с медианой. */
export const outlierShift: Generator = {
  id: "stat.outlier-shift",
  version: 1,
  title: "Выброс и среднее",
  make(seed) {
    const r = rng(seed);
    const n = r.pick([10, 20, 25, 50]);
    const m = r.pick([8, 10, 12]);
    const d = r.pick([100, 200, 250, 500]);
    const answer = round(m + d / n, 4);
    return {
      kind: "numeric",
      prompt: String.raw`Среднее $${n}$ цен — $${m}$ млн ₽. В одной цене опечатка: вместо $10$ записали $${10 + d}$. Каким станет среднее? (Медиана при этом не изменится, если опечатка не в середине выборки.)`,
      label: String.raw`$\bar x =$`,
      answer,
      tol: 0.005,
      hints: [String.raw`Сумма выросла на $${d}$, а делим по-прежнему на $n = ${n}$.`],
      right: String.raw`$${m} + ${d}/${n} = ${answer}$: одна точка сдвинула среднее на $${round(d / n, 4)}$.`,
      wrong: String.raw`Сдвиг среднего — изменение суммы, делённое на $n$: $${d}/${n}$.`,
    };
  },
};
