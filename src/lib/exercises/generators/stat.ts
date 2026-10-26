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

const pmx = (m: number[][]) => String.raw`\begin{pmatrix} ${m.map((row) => row.join(" & ")).join(String.raw` \\ `)} \end{pmatrix}`;

/** Урок IV.4: MLE ковариации по трём-четырём точкам на плоскости (матрица, деление на n). */
export const covMle: Generator = {
  id: "stat.cov-mle",
  version: 1,
  title: "Выборочная ковариационная матрица",
  make(seed) {
    const r = rng(seed);
    // n = 4 точки с целым средним: последнюю подбираем так, чтобы сумма делилась на 4
    const pts = Array.from({ length: 3 }, () => [r.int(-3, 4), r.int(-3, 4)]);
    const want = [r.int(-1, 1) * 4, r.int(-1, 1) * 4];
    pts.push([want[0]! - pts.reduce((a, p) => a + p[0]!, 0) + 4 * r.int(-1, 1), want[1]! - pts.reduce((a, p) => a + p[1]!, 0) + 4 * r.int(-1, 1)]);
    const n = pts.length;
    const mu = [0, 1].map((j) => pts.reduce((a, p) => a + p[j]!, 0) / n);
    const S = [0, 1].map((a) => [0, 1].map((b) => round(pts.reduce((acc, p) => acc + (p[a]! - mu[a]!) * (p[b]! - mu[b]!), 0) / n, 4)));
    return {
      kind: "matrix",
      prompt: String.raw`Четыре наблюдения $x^{(i)} \in \mathbb{R}^2$: $${pts.map((p) => String.raw`(${p[0]}, ${p[1]})`).join(", ")}$. Найдите оценку максимального правдоподобия ковариационной матрицы $\hat\Sigma$.`,
      label: String.raw`$\hat\Sigma =$`,
      answer: S,
      tol: 0.005,
      hints: [String.raw`$\hat\mu = (${mu[0]}, ${mu[1]})^\top$. $\hat\Sigma = \frac1n \sum_i (x^{(i)} - \hat\mu)(x^{(i)} - \hat\mu)^\top$ — делим на $n = 4$.`],
      right: String.raw`$\hat\mu = (${mu[0]}, ${mu[1]})^\top$, $\hat\Sigma = ${pmx(S)}$ — симметрична, на диагонали дисперсии.`,
      wrong: String.raw`Проверьте: $\hat\Sigma$ симметрична; деление — на $n = 4$, не на $3$; отклонения — от среднего $\hat\mu = (${mu[0]}, ${mu[1]})^\top$.`,
    };
  },
};

/** Урок IV.4: MLE параметров GDA в одном измерении — доля класса, среднее класса или общая дисперсия. */
export const gdaMle: Generator = {
  id: "stat.gda-mle",
  version: 1,
  title: "Параметры GDA",
  make(seed) {
    const r = rng(seed);
    const x0 = Array.from({ length: r.pick([3, 4]) }, () => r.int(1, 5));
    const x1 = Array.from({ length: r.pick([2, 3]) }, () => r.int(5, 10));
    const n = x0.length + x1.length;
    const m0 = x0.reduce((a, b) => a + b, 0) / x0.length;
    const m1 = x1.reduce((a, b) => a + b, 0) / x1.length;
    const pooled = (x0.reduce((a, v) => a + (v - m0) ** 2, 0) + x1.reduce((a, v) => a + (v - m1) ** 2, 0)) / n;
    const kind = (seed - 1) % 3;
    const [what, label, answer] = kind === 0 ? [String.raw`$\hat\phi = \hat P(y = 1)$`, String.raw`$\hat\phi =$`, x1.length / n] : kind === 1 ? [String.raw`$\hat\mu_1$`, String.raw`$\hat\mu_1 =$`, m1] : [String.raw`общую дисперсию $\hat\sigma^2$ (одна на оба класса, как $\Sigma$ в GDA)`, String.raw`$\hat\sigma^2 =$`, pooled];
    return {
      kind: "numeric",
      prompt: String.raw`Обучающая выборка для GDA с одним признаком: класс $y = 0$ — $x = ${x0.join(", ")}$; класс $y = 1$ — $x = ${x1.join(", ")}$. Найдите оценку максимального правдоподобия: ${what}.`,
      label,
      answer: round(answer, 4),
      tol: 0.005,
      hints: [String.raw`MLE GDA: $\hat\phi$ — доля класса $1$, $\hat\mu_k$ — среднее $x$ в классе $k$, $\hat\sigma^2 = \frac1n \sum_i (x^{(i)} - \hat\mu_{y^{(i)}})^2$ — отклонения каждого объекта от среднего своего класса, деление на всё $n = ${n}$.`],
      right: String.raw`$\hat\phi = ${x1.length}/${n}$, $\hat\mu_0 = ${round(m0, 4)}$, $\hat\mu_1 = ${round(m1, 4)}$, $\hat\sigma^2 = ${round(pooled, 4)}$.`,
      wrong: kind === 2 ? String.raw`Отклонения берут от среднего **своего** класса, а делят на общее $n = ${n}$: $\hat\sigma^2 = ${round(pooled, 4)}$.` : String.raw`Оценки GDA — доли и средние по классам: $\hat\phi = ${x1.length}/${n}$, $\hat\mu_1$ — среднее только объектов класса $1$.`,
    };
  },
};

/** Урок IV.5: натуральный параметр и обратно — Бернулли (η = log φ/(1 − φ), φ = σ(η)) и Пуассон (η = log λ). */
export const naturalParam: Generator = {
  id: "stat.natural-param",
  version: 1,
  title: "Натуральный параметр",
  make(seed) {
    const r = rng(seed);
    const kind = (seed - 1) % 3;
    if (kind === 0) {
      const phi = r.pick([0.2, 0.25, 0.6, 0.75, 0.9]);
      const answer = round(Math.log(phi / (1 - phi)), 4);
      return {
        kind: "numeric",
        prompt: String.raw`Распределение Бернулли с $\phi = ${phi}$ записали в форме экспоненциального семейства $p(y; \eta) = \exp(\eta y - a(\eta))$. Найдите натуральный параметр $\eta$.`,
        label: String.raw`$\eta =$`,
        answer,
        tol: 0.002,
        hints: [String.raw`$\phi^y (1 - \phi)^{1 - y} = \exp\bigl(y \log\frac{\phi}{1 - \phi} + \log(1 - \phi)\bigr)$.`],
        right: String.raw`$\eta = \ln\frac{${phi}}{${round(1 - phi)}} \approx ${answer}$ — логарифм шансов.`,
        wrong: String.raw`Натуральный параметр Бернулли — не $\phi$, а логарифм шансов $\log\frac{\phi}{1 - \phi}$.`,
      };
    }
    if (kind === 1) {
      const eta = r.pick([-2, -1, 0.5, 1, 2]);
      const answer = round(1 / (1 + Math.exp(-eta)), 4);
      return {
        kind: "numeric",
        prompt: String.raw`У распределения Бернулли натуральный параметр $\eta = ${eta}$. Найдите $\phi = P(y = 1)$.`,
        label: String.raw`$\phi =$`,
        answer,
        tol: 0.002,
        hints: [String.raw`Обратите $\eta = \log\frac{\phi}{1 - \phi}$: получится сигмоида.`],
        right: String.raw`$\phi = \sigma(\eta) = 1/(1 + e^{${-eta}}) \approx ${answer}$. Поэтому в логистической регрессии $h_\theta(x) = \sigma(\theta^\top x)$.`,
        wrong: String.raw`$\phi = \frac{1}{1 + e^{-\eta}}$, а не $e^\eta$ и не $\eta$.`,
      };
    }
    const lam = r.pick([0.5, 2, 3, 5]);
    const answer = round(Math.log(lam), 4);
    return {
      kind: "numeric",
      prompt: String.raw`Распределение Пуассона с $\lambda = ${lam}$ записали как $p(y; \eta) = \frac{1}{y!} \exp(\eta y - a(\eta))$. Найдите $\eta$.`,
      label: String.raw`$\eta =$`,
      answer,
      tol: 0.002,
      hints: [String.raw`$e^{-\lambda} \lambda^y / y! = \frac{1}{y!} \exp(y \log\lambda - \lambda)$.`],
      right: String.raw`$\eta = \ln ${lam} \approx ${answer}$, $a(\eta) = e^\eta = \lambda$.`,
      wrong: String.raw`Множитель при $y$ в показателе — $\log\lambda$; это и есть натуральный параметр.`,
    };
  },
};

/** Урок IV.5: среднее или дисперсия через производные a(η) — Бернулли a = log(1 + e^η), Пуассон a = e^η. */
export const logPartition: Generator = {
  id: "stat.log-partition",
  version: 1,
  title: "Моменты через логарифм нормировки",
  make(seed) {
    const r = rng(seed);
    const eta = r.pick([-1, 0, 0.5, 1, 2]);
    const bern = seed % 2 === 1;
    const wantVar = Math.floor((seed - 1) / 2) % 2 === 1;
    const s = 1 / (1 + Math.exp(-eta));
    const answer = round(bern ? (wantVar ? s * (1 - s) : s) : Math.exp(eta), 4);
    return {
      kind: "numeric",
      prompt: String.raw`Логарифм нормировки ${bern ? "Бернулли" : "Пуассона"} — $a(\eta) = ${bern ? String.raw`\log(1 + e^\eta)` : String.raw`e^\eta`}$. При $\eta = ${eta}$ найдите ${wantVar ? String.raw`$\operatorname{Var} y = a''(\eta)$` : String.raw`$\mathbb{E}\, y = a'(\eta)$`}.`,
      label: wantVar ? String.raw`$\operatorname{Var} y =$` : String.raw`$\mathbb{E}\, y =$`,
      answer,
      tol: 0.002,
      hints: [bern ? String.raw`$a'(\eta) = \frac{e^\eta}{1 + e^\eta} = \sigma(\eta)$, $a''(\eta) = \sigma(\eta)(1 - \sigma(\eta))$.` : String.raw`Производные $e^\eta$ — снова $e^\eta$: у Пуассона среднее равно дисперсии.`],
      right: bern ? String.raw`$\sigma(${eta}) \approx ${round(s, 4)}$${wantVar ? String.raw`, $\sigma(1 - \sigma) \approx ${answer}$` : ""}.` : String.raw`$e^{${eta}} \approx ${answer} = \lambda$.`,
      wrong: String.raw`$\mathbb{E}\, T(y) = a'(\eta)$, $\operatorname{Var} T(y) = a''(\eta)$; для ${bern ? String.raw`$a = \log(1 + e^\eta)$ это $\sigma(\eta)$ и $\sigma(\eta)(1 - \sigma(\eta))$` : String.raw`$a = e^\eta$ обе — $e^\eta$`}.`,
    };
  },
};

/** Урок IV.6: обновление Beta по броскам — апостериорное среднее, MAP или MLE для сравнения. */
export const betaUpdate: Generator = {
  id: "stat.beta-update",
  version: 1,
  title: "Апостериорное Beta",
  make(seed) {
    const r = rng(seed);
    const [a, b] = r.pick([[1, 1], [2, 2], [5, 5], [3, 1], [2, 6]] as const);
    const n = r.pick([3, 4, 5, 10]);
    const k = r.int(0, n);
    const kind = (seed - 1) % 2;
    const mean = (k + a) / (n + a + b);
    const map = (k + a - 1) / (n + a + b - 2);
    const answer = round(kind === 0 ? mean : map, 4);
    return {
      kind: "numeric",
      prompt: String.raw`Априорное распределение вероятности орла — $\operatorname{Beta}(${a}, ${b})$. Монету бросили $${n}$ раз, орлов — $${k}$. Найдите ${kind === 0 ? "апостериорное среднее — прогноз вероятности орла в следующем броске" : String.raw`оценку апостериорного максимума $\hat\phi_{\text{MAP}}$`}.`,
      label: kind === 0 ? String.raw`$\mathbb{E}[\phi \mid \text{данные}] =$` : String.raw`$\hat\phi_{\text{MAP}} =$`,
      answer,
      tol: 0.002,
      hints: [String.raw`Апостериорное — $\operatorname{Beta}(k + \alpha, n - k + \beta) = \operatorname{Beta}(${k + a}, ${n - k + b})$. Среднее $\operatorname{Beta}(p, q)$ — $\frac{p}{p + q}$, мода — $\frac{p - 1}{p + q - 2}$.`],
      right: String.raw`$\operatorname{Beta}(${k + a}, ${n - k + b})$: ${kind === 0 ? String.raw`среднее $${k + a}/${n + a + b} \approx ${answer}$` : String.raw`мода $${k + a - 1}/${n + a + b - 2} \approx ${answer}$`}. MLE было бы $${k}/${n} = ${round(k / n, 4)}$.`,
      wrong: String.raw`Параметры априорного — воображаемые броски: прибавьте $\alpha = ${a}$ к орлам и $\beta = ${b}$ к решкам. ${kind === 0 ? "Среднее" : "MAP"} — не доля $k/n$.`,
    };
  },
};

/** Урок IV.6: гребневая регрессия как MAP — λ = σ²/τ² или одномерная оценка θ = Σxy/(Σx² + λ). */
export const ridgeMap: Generator = {
  id: "stat.ridge-map",
  version: 1,
  title: "Ridge как MAP",
  make(seed) {
    const r = rng(seed);
    const s2 = r.pick([1, 2, 4]);
    const t2 = r.pick([0.5, 1, 2, 4]);
    const lam = s2 / t2;
    if (seed % 2 === 1) {
      return {
        kind: "numeric",
        prompt: String.raw`Шум линейной модели $\epsilon \sim \mathcal{N}(0, ${s2})$, априорное весов $\theta \sim \mathcal{N}(0, ${t2} I)$. MAP совпадает с гребневой регрессией $\min_\theta \tfrac12 \lVert X\theta - y \rVert^2 + \tfrac{\lambda}{2} \lVert\theta\rVert^2$. Найдите $\lambda$.`,
        label: String.raw`$\lambda =$`,
        answer: round(lam, 4),
        tol: 0.002,
        hints: [String.raw`$-\log p(\theta \mid \text{данные}) = \frac{1}{2\sigma^2}\lVert X\theta - y\rVert^2 + \frac{1}{2\tau^2}\lVert\theta\rVert^2$; умножьте на $\sigma^2$.`],
        right: String.raw`$\lambda = \sigma^2/\tau^2 = ${s2}/${t2} = ${round(lam, 4)}$.`,
        wrong: String.raw`$\lambda = \sigma^2/\tau^2$, а не $\tau^2/\sigma^2$: чем уже априорное (меньше $\tau^2$), тем сильнее штраф.`,
      };
    }
    const sxy = r.pick([6, 8, 12, 20]);
    const sxx = r.pick([4, 6, 10]);
    const answer = round(sxy / (sxx + lam), 4);
    return {
      kind: "numeric",
      prompt: String.raw`Модель с одним весом $y = \theta x + \epsilon$, $\epsilon \sim \mathcal{N}(0, ${s2})$, априорное $\theta \sim \mathcal{N}(0, ${t2})$. По данным $\sum_i x^{(i)} y^{(i)} = ${sxy}$, $\sum_i (x^{(i)})^2 = ${sxx}$. Найдите $\hat\theta_{\text{MAP}}$.`,
      label: String.raw`$\hat\theta_{\text{MAP}} =$`,
      answer,
      tol: 0.002,
      hints: [String.raw`$\hat\theta = \frac{\sum_i x^{(i)} y^{(i)}}{\sum_i (x^{(i)})^2 + \lambda}$, $\lambda = \sigma^2/\tau^2 = ${round(lam, 4)}$.`],
      right: String.raw`$${sxy}/(${sxx} + ${round(lam, 4)}) \approx ${answer}$; МНК дал бы $${round(sxy / sxx, 4)}$ — MAP сжимает вес к нулю.`,
      wrong: String.raw`К знаменателю МНК $\sum (x^{(i)})^2$ добавляется $\lambda = \sigma^2/\tau^2 = ${round(lam, 4)}$.`,
    };
  },
};
