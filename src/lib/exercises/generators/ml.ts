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

const sigm = (z: number) => 1 / (1 + Math.exp(-z));

/** Урок 1.4: вероятность класса g(θᵀx) для квартиры. */
export const logisticProb: Generator = {
  id: "ml.logistic-prob",
  version: 1,
  title: "Вероятность класса",
  make(seed) {
    const r = rng(seed);
    const t0 = r.int(-6, 2) / 2;
    const t1 = r.int(2, 8) / 2;
    const t2 = -r.int(1, 4) / 2;
    const z1 = r.int(-4, 4) / 2;
    const z2 = r.int(-4, 4) / 2;
    const z = t0 + t1 * z1 + t2 * z2;
    const answer = round(sigm(z), 4);
    return {
      kind: "numeric",
      prompt: String.raw`Модель «квартира дороже медианы»: $h_\theta(x) = g(\theta^\top x)$, $\theta = (${num(t0)},\ ${num(t1)},\ ${num(t2)})^\top$, признаки $x = (1,\ x_1,\ x_2)$ — единица, стандартизованная площадь и стандартизованный путь до метро. У квартиры $x_1 = ${num(z1)}$, $x_2 = ${num(z2)}$. Какова вероятность, что она дороже медианы?`,
      label: "p =",
      answer,
      tol: 0.002,
      hints: [String.raw`Сначала $\theta^\top x = ${num(t0)} + ${num(t1)} \cdot (${num(z1)}) + (${num(t2)}) \cdot (${num(z2)})$, потом $g(z) = 1/(1 + e^{-z})$.`],
      right: String.raw`$\theta^\top x = ${num(round(z, 4))}$, $g(${num(round(z, 4))}) = ${num(answer)}$.`,
      wrong: String.raw`$\theta^\top x = ${num(round(z, 4))}$; вероятность — $g(z) = 1/(1 + e^{-z}) = ${num(answer)}$, а не само $\theta^\top x$.`,
    };
  },
};

/** Урок 1.4: во сколько раз меняются шансы при росте признака на единицу. */
export const oddsFactor: Generator = {
  id: "ml.odds-factor",
  version: 1,
  title: "Шансы и веса",
  make(seed) {
    const r = rng(seed);
    const w = r.pick([0.4, 0.7, -0.5, 1.1, -0.9, 0.25]);
    const k = r.pick([1, 2, 3]);
    const answer = round(Math.exp(k * w), 4);
    return {
      kind: "numeric",
      prompt: String.raw`В логистической регрессии вес при числе комнат $\theta_j = ${num(w)}$, остальные признаки не меняются. Комнат стало на ${k} больше. Во сколько раз изменились шансы $\dfrac{p}{1 - p}$ класса «дороже медианы»?`,
      label: "в раз:",
      answer,
      tol: 0.002,
      hints: [String.raw`$\log \frac{p}{1 - p} = \theta^\top x$: логарифм шансов линеен по признакам.`],
      right: String.raw`Логарифм шансов вырос на $${k} \cdot ${num(w)}$, шансы умножились на $e^{${num(round(k * w, 4))}} = ${num(answer)}$.`,
      wrong: String.raw`Линеен по признакам логарифм шансов, а не вероятность: $\log\frac{p}{1 - p}$ меняется на $${k}\theta_j$, шансы — в $e^{${num(round(k * w, 4))}} = ${num(answer)}$ раза.`,
    };
  },
};

/** Урок 1.5: вероятность класса по логитам softmax. */
export const softmaxProb: Generator = {
  id: "ml.softmax-prob",
  version: 1,
  title: "Softmax по логитам",
  make(seed) {
    const r = rng(seed);
    const t = [r.int(-4, 6) / 2, r.int(-4, 6) / 2, r.int(-4, 6) / 2];
    const j = r.int(0, 2);
    const names = ["эконом", "комфорт", "бизнес"];
    const m = Math.max(...t);
    const e = t.map((v) => Math.exp(v - m));
    const answer = round(e[j]! / e.reduce((a, b) => a + b, 0), 4);
    return {
      kind: "numeric",
      prompt: String.raw`Softmax-регрессия выдала для квартиры логиты $t = (${t.map(num).join(",\\ ")})$ для сегментов «эконом», «комфорт», «бизнес». Какова вероятность сегмента «${names[j]}»?`,
      label: "p =",
      answer,
      tol: 0.002,
      hints: [String.raw`$p_j = e^{t_j} / \sum_s e^{t_s}$. Удобно сначала вычесть из всех логитов наибольший: вероятности от этого не меняются.`],
      right: String.raw`$p = e^{${num(t[j]!)}} / (e^{${num(t[0]!)}} + e^{${num(t[1]!)}} + e^{${num(t[2]!)}}) = ${num(answer)}$.`,
      wrong: String.raw`Возведите $e$ в каждый логит и поделите нужное слагаемое на сумму: $p = ${num(answer)}$. Делить сами логиты на их сумму нельзя — они бывают отрицательными.`,
    };
  },
};

/** Урок 1.5: одна поправка перцептрона. */
export const perceptronUpdateGen: Generator = {
  id: "ml.perceptron-update",
  version: 1,
  title: "Поправка перцептрона",
  make(seed) {
    const r = rng(seed);
    for (;;) {
      const th = [r.int(-4, 4) / 2, r.int(-4, 4) / 2, r.int(-4, 4) / 2];
      const x = [1, r.int(-4, 4) / 2, r.int(-4, 4) / 2];
      const z = th[0]! * x[0]! + th[1]! * x[1]! + th[2]! * x[2]!;
      if (z === 0) continue;
      const h = z > 0 ? 1 : 0;
      const y = seed % 3 === 0 ? h : 1 - h; // иногда объект уже классифицирован верно
      const j = 1 + (seed % 2);
      const answer = round(th[j]! + (y - h) * x[j]!, 4);
      return {
        kind: "numeric",
        prompt: String.raw`Перцептрон $h_\theta(x) = 1\{\theta^\top x \ge 0\}$, $\theta = (${th.map(num).join(",\\ ")})^\top$, шаг $\alpha = 1$. Пришёл объект $x = (${x.map(num).join(",\\ ")})^\top$ с меткой $y = ${y}$. Каким станет $\theta_${j}$ после обработки объекта?`,
        label: String.raw`θ${j === 1 ? "₁" : "₂"} =`,
        answer,
        tol: 0.0005,
        hints: [String.raw`Сначала посчитайте $\theta^\top x = ${num(z)}$ и предсказание $h$. Поправка $\alpha(y - h)x$ — только если $h \ne y$.`],
        right: y === h ? String.raw`$\theta^\top x = ${num(z)}$, $h = ${h} = y$: ответ верный, поправки нет, $\theta_${j} = ${num(answer)}$.` : String.raw`$\theta^\top x = ${num(z)}$, $h = ${h} \ne y$: $\theta_${j} := ${num(th[j]!)} + (${y} - ${h}) \cdot ${num(x[j]!)} = ${num(answer)}$.`,
        wrong: y === h ? String.raw`Предсказание $h = ${h}$ совпало с меткой: перцептрон на верных ответах веса не меняет.` : String.raw`Ошибка: $h = ${h}$, а $y = ${y}$. Поправка $(y - h)\,x_${j} = ${num((y - h) * x[j]!)}$, новое $\theta_${j} = ${num(answer)}$.`,
      };
    }
  },
};

/** Урок 1.6: прогноз пуассоновской регрессии или во сколько раз он меняется при росте признака. */
export const poissonPredict: Generator = {
  id: "ml.poisson-predict",
  version: 1,
  title: "Прогноз пуассоновской регрессии",
  make(seed) {
    const r = rng(seed);
    const t0 = r.int(-2, 4) / 4;
    const t1 = r.pick([0.08, 0.1, 0.12, 0.15]);
    const t2 = -r.pick([1.5, 2, 2.5]);
    if (seed % 2 === 0) {
      const k = r.int(2, 5);
      const answer = round(Math.exp(k * t1), 4);
      return {
        kind: "numeric",
        prompt: String.raw`Пуассоновская регрессия просмотров объявления: $\lambda = \exp(\theta_0 + \theta_1 x_1 + \theta_2 x_2)$, $x_1$ — число фото, $\theta_1 = ${num(t1)}$. В объявление добавили ${k} фото, остальное не менялось. Во сколько раз изменится ожидаемое число просмотров?`,
        label: "в раз:",
        answer,
        tol: 0.002,
        hints: [String.raw`$\log\lambda$ линеен по признакам: он вырос на $${k}\theta_1$.`],
        right: String.raw`$\lambda$ умножается на $e^{${k} \cdot ${num(t1)}} = ${num(answer)}$ — независимо от остальных признаков.`,
        wrong: String.raw`Признаки действуют на $\log\lambda$, а не на $\lambda$: прогноз умножается на $e^{${num(round(k * t1, 4))}} = ${num(answer)}$, а не растёт на $${num(round(k * t1, 4))}$.`,
      };
    }
    const x1 = r.int(0, 15);
    const x2 = r.pick([0.8, 0.9, 1, 1.1, 1.2]);
    const eta = t0 + t1 * x1 + t2 * (x2 - 1);
    const answer = round(Math.exp(eta), 4);
    return {
      kind: "numeric",
      prompt: String.raw`Пуассоновская регрессия просмотров: $\lambda = \exp\bigl(\theta_0 + \theta_1 x_1 + \theta_2 (x_2 - 1)\bigr)$, $\theta = (${num(t0)},\ ${num(t1)},\ ${num(t2)})$, где $x_1$ — число фото, $x_2$ — цена к медиане района. У объявления $x_1 = ${x1}$, $x_2 = ${num(x2)}$. Сколько просмотров за неделю ожидает модель?`,
      label: "λ =",
      answer,
      tol: 0.005,
      hints: [String.raw`Сначала $\eta = \theta^\top x$, потом отклик Пуассона — экспонента: $\lambda = e^{\eta}$.`],
      right: String.raw`$\eta = ${num(round(eta, 4))}$, $\lambda = e^{\eta} = ${num(answer)}$.`,
      wrong: String.raw`$\eta = ${num(round(eta, 4))}$ — это $\log\lambda$, а не прогноз. Ожидаемое число просмотров — $e^{\eta} = ${num(answer)}$.`,
    };
  },
};
