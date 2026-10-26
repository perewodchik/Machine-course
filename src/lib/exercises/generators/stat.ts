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

/** Урок IV.2: смещение², дисперсия или MSE оценки c·x̄ среднего θ по n наблюдениям с разбросом σ. */
export const shrinkMse: Generator = {
  id: "stat.shrink-mse",
  version: 1,
  title: "Смещение и дисперсия оценки",
  make(seed) {
    const r = rng(seed);
    const theta = r.pick([1, 2, 3]);
    const sigma = r.pick([2, 3, 4]);
    const n = r.pick([4, 9, 16]);
    const c = r.pick([0.5, 0.8, 0.9]);
    const bias2 = (c - 1) ** 2 * theta ** 2;
    const variance = (c * c * sigma * sigma) / n;
    const kind = (seed - 1) % 3;
    const [what, label, answer] = kind === 0 ? ["квадрат смещения", String.raw`$(\mathbb{E}\hat\theta - \theta)^2 =$`, bias2] : kind === 1 ? ["дисперсию", String.raw`$\operatorname{Var}\hat\theta =$`, variance] : ["среднеквадратичную ошибку", String.raw`$\mathrm{MSE} =$`, bias2 + variance];
    return {
      kind: "numeric",
      prompt: String.raw`Наблюдения независимы, $\mathbb{E}X = \theta = ${theta}$, $\sigma = ${sigma}$, $n = ${n}$. Оценка $\hat\theta = ${c}\, \bar x$. Найдите ${what} оценки.`,
      label,
      answer: round(answer, 4),
      tol: 0.005,
      hints: [String.raw`$\mathbb{E}\hat\theta = c\theta$, $\operatorname{Var}\hat\theta = c^2 \sigma^2/n$; MSE — смещение² плюс дисперсия.`],
      right: String.raw`Смещение² $(${c} - 1)^2 \cdot ${theta}^2 = ${round(bias2, 4)}$, дисперсия $${c}^2 \cdot ${sigma * sigma}/${n} = ${round(variance, 4)}$, MSE $= ${round(bias2 + variance, 4)}$. У $\bar x$ было бы $${round((sigma * sigma) / n, 4)}$.`,
      wrong: String.raw`Множитель $c$ входит в дисперсию в квадрате: $c^2\sigma^2/n$; смещение — $(c - 1)\theta$.`,
    };
  },
};

/** Урок IV.2: по сумме квадратов отклонений — несмещённая s² или MLE дисперсии с делением на n. */
export const besselGen: Generator = {
  id: "stat.bessel",
  version: 1,
  title: "Поправка Бесселя",
  make(seed) {
    const r = rng(seed);
    const n = r.pick([4, 5, 6, 9, 11]);
    const ss = r.pick([12, 20, 30, 40, 60]);
    const unbiased = seed % 2 === 1;
    const answer = round(unbiased ? ss / (n - 1) : ss / n, 4);
    return {
      kind: "numeric",
      prompt: String.raw`По выборке из $n = ${n}$ наблюдений посчитали $\sum_i (x^{(i)} - \bar x)^2 = ${ss}$. Найдите ${unbiased ? String.raw`несмещённую оценку дисперсии $s^2$` : String.raw`оценку максимального правдоподобия дисперсии $\hat\sigma^2_{\text{MLE}}$ нормального распределения`}.`,
      label: unbiased ? String.raw`$s^2 =$` : String.raw`$\hat\sigma^2_{\text{MLE}} =$`,
      answer,
      tol: 0.005,
      hints: [unbiased ? String.raw`Несмещённая оценка делит на $n - 1$ (поправка Бесселя).` : String.raw`MLE делит на $n$: так получается из условия максимума правдоподобия (урок IV.3).`],
      right: String.raw`$${ss}/${unbiased ? n - 1 : n} = ${answer}$.`,
      wrong: unbiased ? String.raw`Деление на $n = ${n}$ даёт смещённую вниз оценку; несмещённая — $${ss}/${n - 1}$.` : String.raw`MLE не исправляет смещение: делите на $n = ${n}$, а не на $n - 1$.`,
    };
  },
};

/** Урок IV.3: оценка максимального правдоподобия по выборке — Бернулли, Пуассон, показательное, дисперсия нормального. */
export const mleFamily: Generator = {
  id: "stat.mle-family",
  version: 1,
  title: "Оценка максимального правдоподобия",
  make(seed) {
    const r = rng(seed);
    const kind = (seed - 1) % 4;
    if (kind === 0) {
      const n = r.pick([10, 20, 25, 40]);
      const k = r.int(1, n - 1);
      const answer = round(k / n, 4);
      return {
        kind: "numeric",
        prompt: String.raw`Монету бросили $${n}$ раз, орёл выпал $${k}$ раз. Найдите оценку максимального правдоподобия вероятности орла $\phi$.`,
        label: String.raw`$\hat\phi =$`,
        answer,
        tol: 0.001,
        hints: [String.raw`$\ell(\phi) = k \log \phi + (n - k) \log (1 - \phi)$; приравняйте производную к нулю.`],
        right: String.raw`$\hat\phi = k/n = ${k}/${n} = ${answer}$ — доля орлов.`,
        wrong: String.raw`Из $\frac{k}{\phi} - \frac{n - k}{1 - \phi} = 0$ получается $\hat\phi = k/n$.`,
      };
    }
    const x = Array.from({ length: 5 }, () => (kind === 3 ? r.pick([-3, -2, -1, 1, 2, 3]) : r.int(1, 6)));
    const n = x.length;
    const sum = x.reduce((a, b) => a + b, 0);
    if (kind === 1) {
      const answer = round(sum / n, 4);
      return {
        kind: "numeric",
        prompt: String.raw`Число звонков за минуту в пять разных минут: $${x.join(", ")}$. Модель — распределение Пуассона. Найдите оценку максимального правдоподобия $\lambda$.`,
        label: String.raw`$\hat\lambda =$`,
        answer,
        tol: 0.001,
        hints: [String.raw`$\ell(\lambda) = \bigl(\sum_i x^{(i)}\bigr) \log \lambda - n\lambda + \text{const}$.`],
        right: String.raw`$\hat\lambda = \bar x = ${sum}/${n} = ${answer}$.`,
        wrong: String.raw`Производная $\sum_i x^{(i)}/\lambda - n$ равна нулю при $\lambda = \bar x$.`,
      };
    }
    if (kind === 2) {
      const answer = round(n / sum, 4);
      return {
        kind: "numeric",
        prompt: String.raw`Время ожидания автобуса в пять дней, мин: $${x.join(", ")}$. Модель — показательное распределение с плотностью $\lambda e^{-\lambda x}$. Найдите оценку максимального правдоподобия $\lambda$.`,
        label: String.raw`$\hat\lambda =$`,
        answer,
        tol: 0.001,
        hints: [String.raw`$\ell(\lambda) = n \log \lambda - \lambda \sum_i x^{(i)}$.`],
        right: String.raw`$\hat\lambda = n / \sum_i x^{(i)} = ${n}/${sum} \approx ${answer}$ — обратное к среднему времени.`,
        wrong: String.raw`Производная $n/\lambda - \sum_i x^{(i)}$ равна нулю при $\lambda = 1/\bar x$, а не $\bar x$: $\mathbb{E}X = 1/\lambda$.`,
      };
    }
    const mean = sum / n;
    const ss = x.reduce((a, v) => a + (v - mean) ** 2, 0);
    const answer = round(ss / n, 4);
    return {
      kind: "numeric",
      prompt: String.raw`Выборка из нормального распределения: $${x.join(", ")}$. Найдите оценку максимального правдоподобия дисперсии $\hat\sigma^2$ (среднее тоже неизвестно).`,
      label: String.raw`$\hat\sigma^2 =$`,
      answer,
      tol: 0.005,
      hints: [String.raw`$\hat\mu = \bar x = ${round(mean, 4)}$, $\hat\sigma^2 = \frac1n \sum_i (x^{(i)} - \bar x)^2$ — делим на $n$.`],
      right: String.raw`$\sum_i (x^{(i)} - \bar x)^2 = ${round(ss, 4)}$, $\hat\sigma^2 = ${round(ss, 4)}/${n} = ${answer}$.`,
      wrong: String.raw`MLE делит на $n = ${n}$, а не на $n - 1$: $${round(ss, 4)}/${n}$.`,
    };
  },
};

/** Урок IV.3: логарифм правдоподобия выборки монеты при заданном φ — и почему сравнивают логарифмы. */
export const logLik: Generator = {
  id: "stat.log-likelihood",
  version: 1,
  title: "Логарифм правдоподобия",
  make(seed) {
    const r = rng(seed);
    const n = r.pick([5, 8, 10]);
    const k = r.int(1, n - 1);
    const phi = r.pick([0.2, 0.5, 0.6, 0.8]);
    const answer = round(k * Math.log(phi) + (n - k) * Math.log(1 - phi), 4);
    return {
      kind: "numeric",
      prompt: String.raw`$${n}$ бросков монеты, орлов — $${k}$. Найдите логарифм правдоподобия $\ell(\phi) = \sum_i \log p(x^{(i)}; \phi)$ при $\phi = ${phi}$ (натуральный логарифм).`,
      label: String.raw`$\ell(${phi}) =$`,
      answer,
      tol: 0.005,
      hints: [String.raw`Орёл даёт слагаемое $\log \phi$, решка — $\log(1 - \phi)$: $\ell = k \log \phi + (n - k) \log (1 - \phi)$.`],
      right: String.raw`$${k} \ln ${phi} + ${n - k} \ln ${round(1 - phi)} \approx ${answer}$.`,
      wrong: String.raw`Не забудьте решки: $${n - k}$ слагаемых $\ln ${round(1 - phi)}$. Логарифм правдоподобия отрицателен — это логарифм вероятности.`,
    };
  },
};
