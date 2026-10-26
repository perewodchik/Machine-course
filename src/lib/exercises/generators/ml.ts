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

const num = (v: number) => String(v).replace("-", "−");

/** Урок 1.2: одно обновление LMS на объекте. */
export const lmsUpdate: Generator = {
  id: "ml.lms-update",
  version: 1,
  title: "Шаг LMS",
  make(seed) {
    const r = rng(seed);
    const t0 = r.int(-4, 4) / 2;
    const t1 = r.int(1, 6) / 4;
    const x = r.int(2, 8) / 2;
    const y = r.int(2, 16) / 2;
    const alpha = r.pick([0.1, 0.05, 0.2]);
    const j = seed % 2; // какую координату спрашиваем
    const h = t0 + t1 * x;
    const err = y - h;
    const answer = round((j ? t1 : t0) + alpha * err * (j ? x : 1), 6);
    return {
      kind: "numeric",
      prompt: String.raw`Модель $h_\theta(x) = \theta_0 + \theta_1 x$, сейчас $\theta = (${num(t0)},\ ${num(t1)})^\top$. Стохастический спуск берёт объект $x^{(i)} = ${num(x)}$, $y^{(i)} = ${num(y)}$ с шагом $\alpha = ${alpha}$. Каким станет $\theta_${j}$ после одного шага LMS?`,
      label: String.raw`θ${j ? "₁" : "₀"} =`,
      answer,
      tol: 0.0005,
      hints: [String.raw`Правило LMS: $\theta_j := \theta_j + \alpha\,\big(y^{(i)} - h_\theta(x^{(i)})\big)\,x^{(i)}_j$, у свободного члена $x_0 = 1$. Сначала посчитайте $h_\theta(x^{(i)}) = ${num(round(h, 4))}$.`],
      right: String.raw`$\theta_${j} = ${num(j ? t1 : t0)} + ${alpha} \cdot (${num(round(err, 4))}) \cdot ${j ? num(x) : "1"} = ${num(answer)}$.`,
      wrong: String.raw`Ошибка на объекте $y^{(i)} - h_\theta(x^{(i)}) = ${num(round(err, 4))}$; поправка — $\alpha$ · ошибка · $x^{(i)}_${j}$${j ? "" : String.raw`, где $x_0 = 1$`}. Знак «плюс»: при $y > h$ предсказание надо поднять.`,
    };
  },
};

/** Урок 1.2: как меняется наибольший сходящийся шаг при масштабе признаков или записи потерь суммой. */
export const stepScale: Generator = {
  id: "ml.step-scale",
  version: 1,
  title: "Порог шага",
  make(seed) {
    const r = rng(seed);
    const limit = r.pick([0.4, 0.8, 1.2, 1.6]);
    if (seed % 2 === 0) {
      const k = r.pick([2, 4, 5, 10]);
      const answer = round(limit / (k * k), 6);
      return {
        kind: "numeric",
        prompt: String.raw`Модель без свободного члена, $J(\theta) = \frac{1}{2n}\lVert X\theta - y\rVert^2$. Пакетный спуск сходится при $\alpha < ${limit}$ и расходится выше. Все признаки умножили на ${k}. Каким стал наибольший сходящийся шаг?`,
        label: "α <",
        answer,
        tol: answer * 0.01,
        hints: [String.raw`Порог — $2/\lambda_{\max}(H)$, $H = \frac1n X^\top X$. Что происходит с $H$, когда $X$ умножают на ${k}?`],
        right: String.raw`$H$ умножается на $${k}^2 = ${k * k}$, порог делится на ${k * k}: $${limit}/${k * k} = ${num(answer)}$.`,
        wrong: String.raw`$X$ входит в $H = \frac1n X^\top X$ дважды, поэтому $H$ растёт в $${k}^2$ раз, а порог $2/\lambda_{\max}$ падает в ${k * k} раз, а не в ${k}.`,
      };
    }
    const n = r.pick([20, 50, 100, 200]);
    const answer = round(limit / n, 6);
    return {
      kind: "numeric",
      prompt: String.raw`Для $J(\theta) = \frac{1}{2n}\lVert X\theta - y\rVert^2$ на $n = ${n}$ объектах пакетный спуск сходится при $\alpha < ${limit}$. В CS229 потеря записана суммой: $J_\Sigma(\theta) = \frac12 \lVert X\theta - y\rVert^2$. Каков наибольший сходящийся шаг для $J_\Sigma$?`,
      label: "α <",
      answer,
      tol: answer * 0.01,
      hints: [String.raw`$J_\Sigma = n J$: градиент и гессиан тоже в $n$ раз больше.`],
      right: String.raw`Гессиан $X^\top X$ в $n$ раз больше $\frac1n X^\top X$, порог в $n$ раз меньше: $${limit}/${n} = ${num(answer)}$.`,
      wrong: String.raw`Сумма вместо среднего умножает градиент на $n = ${n}$; тот же шаг стал бы в ${n} раз длиннее, поэтому порог делится на ${n}.`,
    };
  },
};

/** Урок 1.2: веса на исходном признаке по весам на стандартизованном. */
export const standardizeBack: Generator = {
  id: "ml.standardize-back",
  version: 1,
  title: "Веса на исходных признаках",
  make(seed) {
    const r = rng(seed);
    const mu = r.pick([50, 60, 70, 80]);
    const s = r.pick([10, 20, 25]);
    const t0 = r.int(16, 40) / 2;
    const t1 = r.int(4, 16) / 2;
    const slope = seed % 2 === 1;
    const answer = round(slope ? t1 / s : t0 - (t1 * mu) / s, 4);
    return {
      kind: "numeric",
      prompt: String.raw`Цена квартиры от площади: спуск обучали на стандартизованном признаке $z = (x - \mu)/s$, $\mu = ${mu}$ м², $s = ${s}$ м², и получили $h(z) = ${num(t0)} + ${num(t1)}\,z$. Запишите ту же модель через площадь: $h(x) = \theta_0 + \theta_1 x$. Найдите $\theta_${slope ? 1 : 0}$.`,
      label: String.raw`θ${slope ? "₁" : "₀"} =`,
      answer,
      tol: 0.0005,
      hints: [String.raw`Подставьте $z = (x - \mu)/s$ и раскройте скобки: $\theta'_0 + \theta'_1 (x - \mu)/s$.`],
      right: slope ? String.raw`$\theta_1 = \theta'_1/s = ${num(t1)}/${s} = ${num(answer)}$ млн ₽ за м².` : String.raw`$\theta_0 = \theta'_0 - \theta'_1\mu/s = ${num(t0)} - ${num(t1)} \cdot ${mu}/${s} = ${num(answer)}$.`,
      wrong: slope ? String.raw`Наклон по площади — $\theta'_1/s$: один м² — это $1/s$ стандартного отклонения.` : String.raw`Свободный член сдвигается: $\theta_0 = \theta'_0 - \theta'_1\mu/s$, а не $\theta'_0$ — нуль $z$ соответствует средней площади, а не нулевой.`,
    };
  },
};

/** Урок 1.3: вес объекта в LWR. */
export const lwrWeight: Generator = {
  id: "ml.lwr-weight",
  version: 1,
  title: "Вес в LWR",
  make(seed) {
    const r = rng(seed);
    const tau = r.pick([1, 2, 3, 5]);
    const q = r.int(4, 30);
    const k = r.pick([0.5, 1, 1.5, 2]);
    const xi = q - k * tau >= 1 && r.next() < 0.5 ? q - k * tau : q + k * tau; // путь до метро не бывает отрицательным
    const answer = round(Math.exp(-((xi - q) ** 2) / (2 * tau * tau)), 4);
    return {
      kind: "numeric",
      prompt: String.raw`Локально взвешенная регрессия по пути до метро, ширина окна $\tau = ${tau}$ мин. Прогноз нужен для квартиры в $x = ${q}$ мин от метро. Какой вес $w^{(i)}$ получит обучающая квартира с $x^{(i)} = ${num(xi)}$ мин?`,
      label: "w =",
      answer,
      tol: 0.001,
      hints: [String.raw`$w^{(i)} = \exp\bigl(-(x^{(i)} - x)^2/(2\tau^2)\bigr)$. Расстояние здесь — ${num(k)} ширины окна.`],
      right: String.raw`$w = \exp(-${num(k)}^2/2) = ${num(answer)}$: вес зависит только от расстояния в единицах $\tau$.`,
      wrong: String.raw`Расстояние $\lvert x^{(i)} - x\rvert = ${num(k * tau)}$, это ${num(k)}$\tau$; $w = \exp(-${num(k * k)}/2) = ${num(answer)}$. Делить на $2\tau^2$, а не на $\tau$.`,
    };
  },
};

/** Урок 1.3: сколько столбцов у Φ для полинома второй степени с взаимодействиями или полинома одного признака. */
export const featureCount: Generator = {
  id: "ml.feature-count",
  version: 1,
  title: "Число признаков",
  make(seed) {
    const r = rng(seed);
    if (seed % 2 === 0) {
      const p = r.int(3, 12);
      return {
        kind: "numeric",
        prompt: String.raw`Признак один — путь до метро. Полином степени $p = ${p}$: $\phi(x) = (1, x, x^2, \dots, x^{${p}})$. Сколько весов $\theta$ у модели $\theta^\top\phi(x)$?`,
        label: "весов:",
        answer: p + 1,
        tol: 0,
        hints: ["Посчитайте все степени от нулевой до p включительно."],
        right: String.raw`$${p + 1}$: степени $0, 1, \dots, ${p}$; свободный член — вес при $x^0 = 1$.`,
        wrong: String.raw`Не забудьте столбец единиц $x^0$: весов $p + 1 = ${p + 1}$.`,
      };
    }
    const d = r.int(3, 8);
    const answer = 1 + d + (d * (d + 1)) / 2;
    return {
      kind: "numeric",
      prompt: String.raw`У квартиры $d = ${d}$ признаков. В $\phi(x)$ вошли единица, все признаки, их квадраты и все попарные произведения $x_j x_k$, $j < k$. Сколько столбцов у матрицы $\Phi$?`,
      label: "столбцов:",
      answer,
      tol: 0,
      hints: [String.raw`Единица — 1, признаки — $d$, квадраты — $d$, попарные произведения — $\binom{d}{2} = d(d - 1)/2$.`],
      right: String.raw`$1 + ${d} + ${d} + ${(d * (d - 1)) / 2} = ${answer}$. Число признаков второй степени растёт как $d^2/2$: при сотне исходных их больше пяти тысяч.`,
      wrong: String.raw`Сложите: единица, ${d} признаков, ${d} квадратов и $\binom{${d}}{2} = ${(d * (d - 1)) / 2}$ произведений — всего $${answer}$.`,
    };
  },
};
