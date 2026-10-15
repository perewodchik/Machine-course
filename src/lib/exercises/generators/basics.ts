// Параметрические задачи модуля 0 «Старт»: они же — задачи входной диагностики (урок 0.2, content/diagnostic.yaml)
// и итоговые проверки уроков 0.3–0.9. Числа «ручные»: небольшие целые, ответ считается без калькулятора.
import { rng } from "../../math/rng";
import type { ChoiceOption, Generator } from "../types";

/** «x − 2», «x + 1», «x» — сдвиг без двойных знаков. */
const shifted = (v: string, a: number) => (a === 0 ? v : a > 0 ? `${v} - ${a}` : `${v} + ${-a}`);
/** Слагаемое со знаком: « + 3», « - 2», пусто для нуля. */
const term = (c: number) => (c === 0 ? "" : c > 0 ? ` + ${c}` : ` - ${-c}`);
/** Слагаемое qx со знаком: « + 3x», « - x», пусто для нуля. */
const linear = (q: number) => (q === 0 ? "" : ` ${q > 0 ? "+" : "-"} ${Math.abs(q) === 1 ? "" : Math.abs(q)}x`);
/** Коэффициент перед x: «2x», «x», «-x», «-3x». */
const coef = (a: number, v = "x") => (a === 1 ? v : a === -1 ? `-${v}` : `${a}${v}`);

export const sse: Generator = {
  id: "basics.sse",
  version: 1,
  title: "Функция потерь прямой",
  make(seed) {
    const r = rng(seed);
    const t0 = r.int(0, 3);
    const t1 = r.pick([1, 2]);
    const xs = r.shuffle([0, 1, 2, 3, 4]).slice(0, 3).sort((a, b) => a - b);
    // ответы — около прямой, ошибки от −2 до 2, не все нули
    let errs: number[];
    do errs = xs.map(() => r.int(-2, 2));
    while (errs.every((e) => e === 0));
    const ys = xs.map((x, i) => t0 + t1 * x + errs[i]!);
    const answer = errs.reduce((acc, e) => acc + e * e, 0) / 2;
    const pts = xs.map((x, i) => `(${x}, ${ys[i]})`).join(", ");
    return {
      kind: "numeric",
      prompt: String.raw`Точки ${pts.replace(/\((\d+), (-?\d+)\)/g, "$$($1, $2)$$")}. Модель $\hat y = ${t0} + ${t1 === 1 ? "" : t1}x$. Вычислите $J = \tfrac12 \sum_i \bigl(y^{(i)} - \hat y^{(i)}\bigr)^2$.`,
      label: String.raw`$J =$`,
      answer,
      tol: 0,
      hints: [String.raw`Для каждой точки найдите ошибку $y^{(i)} - \hat y^{(i)}$: подставьте $x$ в модель.`, String.raw`Ошибки: ${errs.join(", ")}. Возведите в квадрат, сложите, разделите на 2.`],
      right: String.raw`Ошибки ${errs.join(", ")}; сумма квадратов ${2 * answer}, половина — $${answer}$.`,
      wrong: String.raw`Ошибки возводятся в квадрат до сложения, и сумма делится на 2. Если получилось $${2 * answer}$, забыта половина.`,
    };
  },
};

export const argmin: Generator = {
  id: "basics.argmin",
  version: 1,
  title: "Минимум и точка минимума",
  make(seed) {
    const r = rng(seed);
    const a = r.int(-2, 3);
    let b = r.int(1, 6);
    if (b === a) b += 1; // иначе ответы «argmin» и «min» совпадут и ошибку не отличить
    return {
      kind: "numeric",
      prompt: String.raw`Функция $f(x) = (${shifted("x", a)})^2 + ${b}$ задана на множестве $\{-2, -1, 0, 1, 2, 3, 4\}$. Чему равно $\arg\min_x f(x)$?`,
      label: String.raw`$\arg\min_x f(x) =$`,
      answer: a,
      tol: 0,
      hints: [String.raw`$\arg\min$ — не наименьшее значение функции, а точка, где оно достигается.`, String.raw`Квадрат не меньше нуля и равен нулю, когда выражение в скобках равно нулю.`],
      right: String.raw`Наименьшее значение $\min_x f(x) = ${b}$ достигается при $x = ${a}$, поэтому $\arg\min_x f(x) = ${a}$.`,
      wrong: String.raw`Если получилось $${b}$ — это $\min_x f(x)$, само наименьшее значение. $\arg\min$ спрашивает, где оно достигается.`,
    };
  },
};

export const indicatorSum: Generator = {
  id: "basics.indicator-sum",
  version: 1,
  title: "Сумма с индикатором",
  make(seed) {
    const r = rng(seed);
    const t = r.int(0, 3);
    // одно из чисел равно порогу: проверяет строгость неравенства
    const x = r.shuffle([t, r.int(-3, 6), r.int(-3, 6), r.int(-3, 6), r.int(-3, 6), r.int(-3, 6)]);
    const answer = x.reduce((s, v) => s + (v > t ? v : 0), 0);
    return {
      kind: "numeric",
      prompt: String.raw`Дан вектор $x = (${x.join(", ")})$. Вычислите $\sum_{i=1}^{6} \mathbb{1}\{x_i > ${t}\}\, x_i$.`,
      label: String.raw`$\textstyle\sum =$`,
      answer,
      tol: 0,
      hints: [String.raw`Индикатор $\mathbb{1}\{x_i > ${t}\}$ равен $1$, если условие верно, и $0$ иначе: в сумму попадают только $x_i > ${t}$.`],
      right: String.raw`Складываются только числа больше $${t}$: сумма равна $${answer}$.`,
      wrong: String.raw`Проверьте строгость: число, равное $${t}$, условию $x_i > ${t}$ не удовлетворяет. Отрицательные числа тоже отбрасываются.`,
    };
  },
};

export const sigmoidSymmetry: Generator = {
  id: "basics.sigmoid",
  version: 1,
  title: "Симметрия сигмоиды",
  make(seed) {
    const r = rng(seed);
    const p = r.pick([0.6, 0.65, 0.7, 0.73, 0.8, 0.85, 0.88, 0.9, 0.95]);
    const answer = Math.round((1 - p) * 100) / 100;
    return {
      kind: "numeric",
      prompt: String.raw`Сигмоида $\sigma(z) = \dfrac{1}{1 + e^{-z}}$. Известно, что $\sigma(z) = ${p}$. Чему равно $\sigma(-z)$?`,
      label: String.raw`$\sigma(-z) =$`,
      answer,
      tol: 0.005,
      hints: [String.raw`Умножьте числитель и знаменатель $\sigma(-z) = \dfrac{1}{1 + e^{z}}$ на $e^{-z}$.`, String.raw`Получится $\sigma(-z) = 1 - \sigma(z)$.`],
      right: String.raw`$\sigma(-z) = 1 - \sigma(z) = 1 - ${p} = ${answer}$.`,
      wrong: String.raw`Сигмоида всегда между $0$ и $1$, поэтому $\sigma(-z) \ne -\sigma(z)$. Используйте $\sigma(-z) = 1 - \sigma(z)$.`,
    };
  },
};

export const chainRule: Generator = {
  id: "basics.chain-rule",
  version: 1,
  title: "Производная сложной функции",
  make(seed) {
    const r = rng(seed);
    const a = r.pick([2, 3, -1, -2]);
    const b = r.pick([-1, 1, 2]);
    const k = r.pick([2, 3]);
    const x0 = r.pick([0, 1, -1, 2]);
    const inner = a * x0 + b;
    const answer = k * a * inner ** (k - 1);
    return {
      kind: "numeric",
      prompt: String.raw`$f(x) = (${coef(a)}${term(b)})^${k}$. Найдите $f'(${x0})$.`,
      label: String.raw`$f'(${x0}) =$`,
      answer,
      tol: 0,
      hints: [
        String.raw`Правило цепочки: $\bigl(g(h(x))\bigr)' = g'(h(x))\, h'(x)$, здесь $g(u) = u^${k}$, $h(x) = ${coef(a)}${term(b)}$.`,
        String.raw`$f'(x) = ${k}\,(${coef(a)}${term(b)})^{${k - 1}} \cdot ${a < 0 ? `(${a})` : a}$.`,
      ],
      right: String.raw`$f'(x) = ${k}\,(${coef(a)}${term(b)})^{${k - 1}} \cdot ${a < 0 ? `(${a})` : a}$, при $x = ${x0}$ скобка равна $${inner}$: $f'(${x0}) = ${answer}$.`,
      wrong: String.raw`Не забудьте внутреннюю производную: множитель $${a}$ — производная $${coef(a)}${term(b)}$.`,
    };
  },
};

export const integralLinear: Generator = {
  id: "basics.integral",
  version: 1,
  title: "Интеграл от линейной функции",
  make(seed) {
    const r = rng(seed);
    const c = r.int(1, 4);
    const m = r.int(1, 4);
    const q = r.int(-1, 3);
    const answer = (m * c * c) / 2 + q * c;
    return {
      kind: "numeric",
      prompt: String.raw`Вычислите $\displaystyle\int_0^{${c}} (${coef(m)}${term(q)})\, dx$.`,
      label: String.raw`$\displaystyle\int =$`,
      answer,
      tol: 0.005,
      hints: [String.raw`Первообразная: $F(x) = \tfrac{${m}}{2}\,x^2${linear(q)}$.`, String.raw`Интеграл равен $F(${c}) - F(0)$.`],
      right: String.raw`$F(${c}) - F(0) = \tfrac{${m}}{2} \cdot ${c * c}${q === 0 ? "" : ` ${q > 0 ? "+" : "-"} ${Math.abs(q)} \\cdot ${c}`} = ${answer}$.`,
      wrong: "Площадь под прямой на отрезке — трапеция: проверьте первообразную и подставьте оба предела.",
    };
  },
};

interface ShapeQuestion {
  code: string;
  right: string;
  why: string;
  wrong: [string, string][];
}

export const numpyShapes: Generator = {
  id: "basics.numpy-shapes",
  version: 1,
  title: "Формы массивов NumPy",
  make(seed) {
    const r = rng(seed);
    const n = r.int(5, 9);
    const d = r.int(2, 4);
    const tt = (s: string) => String.raw`$\texttt{${s}}$`;
    const questions: ShapeQuestion[] = [
      {
        code: "X @ theta",
        right: `(${n},)`,
        why: "По одному предсказанию на объект: одномерный массив длины n.",
        wrong: [
          [`(${n}, 1)`, "Одномерный theta даёт одномерный результат: NumPy не превращает его в столбец."],
          [`(${d},)`, "Так выглядит сам theta; X @ theta даёт по числу на строку X."],
          [`(${n}, ${d})`, "Это поэлементное X * theta (транслирование), а не матричное умножение."],
        ],
      },
      {
        code: "X.mean(axis=0)",
        right: `(${d},)`,
        why: "axis=0 сворачивает строки: среднее каждого признака по всем объектам.",
        wrong: [
          [`(${n},)`, "Это axis=1: среднее по каждой строке, то есть по каждому объекту."],
          [`(1, ${d})`, "Без keepdims=True свёрнутая ось удаляется, а не остаётся длиной 1."],
          ["()", "Скаляр даёт X.mean() без указания оси."],
        ],
      },
      {
        code: "X.T @ X",
        right: `(${d}, ${d})`,
        why: "Внутренние размеры n сокращаются: остаётся d на d.",
        wrong: [
          [`(${n}, ${n})`, "Это X @ X.T: скалярные произведения объектов попарно."],
          [`(${d},)`, "Матрица на матрицу даёт матрицу, а не вектор."],
          [`(${n}, ${d})`, "Такой формы сам X; транспонирование меняет форму на (d, n)."],
        ],
      },
    ];
    const q = r.pick(questions);
    const options: ChoiceOption[] = [{ text: tt(q.right), correct: true, why: q.why }, ...q.wrong.map(([s, why]) => ({ text: tt(s), why }))];
    return {
      kind: "choice",
      prompt: String.raw`$\texttt{X = np.ones((${n}, ${d}))}$, $\texttt{theta = np.ones(${d})}$. Какая форма у $\texttt{${q.code}}$?`,
      options: r.shuffle(options),
      hints: ["Матричное умножение сокращает внутренние размеры; axis указывает ось, которая исчезает."],
    };
  },
};

export const notation: Generator = {
  id: "basics.notation",
  version: 1,
  title: "Обозначения CS229",
  make(seed) {
    const r = rng(seed);
    const i = r.int(2, 6);
    let j = r.int(1, 4);
    if (j === i) j = 1;
    const options: ChoiceOption[] = [
      { text: `${j}-й признак ${i}-го объекта`, correct: true, why: String.raw`Верхний индекс в скобках — номер объекта, нижний — номер признака: $x^{(${i})}_${j} = X_{${i}${j}}$.` },
      { text: `${i}-й признак ${j}-го объекта`, why: "Наоборот: номер объекта стоит наверху в скобках, номер признака — внизу." },
      { text: String.raw`$${i}$-я степень признака $x_${j}$`, why: "Скобки в верхнем индексе отличают номер объекта от степени: степень пишется без скобок." },
      { text: String.raw`элемент матрицы $X$ в строке $${j}$, столбце $${i}$`, why: String.raw`Строка $X$ — объект, столбец — признак: $x^{(${i})}_${j}$ стоит в строке $${i}$, столбце $${j}$.` },
    ];
    return {
      kind: "choice",
      prompt: String.raw`В обозначениях CS229 что означает $x^{(${i})}_${j}$?`,
      options: r.shuffle(options),
      hints: [String.raw`$x^{(i)}$ — признаки $i$-го объекта, вектор-столбец.`],
    };
  },
};
