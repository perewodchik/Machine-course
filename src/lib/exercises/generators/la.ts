// Параметрические задачи по линейной алгебре и уроку V.1. Числа «ручные»: небольшие целые, ответ без длинной арифметики.
import { rng } from "../../math/rng";
import type { ChoiceOption, Generator } from "../types";

const pm = (rows: number[][]) => String.raw`\begin{pmatrix}${rows.map((r) => r.join(" & ")).join(String.raw` \\ `)}\end{pmatrix}`;
/** Отрицательное число в произведении — в скобках: «2 · (−3)». */
const par = (x: number) => (x < 0 ? `(${x})` : String(x));
/** Матрица в строке текста — только smallmatrix (docs/conventions/authoring.md, «Типографика»). */
const sm = (rows: number[][]) => String.raw`\left(\begin{smallmatrix}${rows.map((r) => r.join(" & ")).join(String.raw` \\ `)}\end{smallmatrix}\right)`;

export const det2: Generator = {
  id: "la.det2",
  version: 2,
  title: "Определитель матрицы 2 × 2",
  make(seed) {
    const r = rng(seed);
    const [a, b, c, d] = [r.int(-4, 5), r.nonzero(-4, 4), r.nonzero(-4, 4), r.int(-3, 6)];
    return {
      kind: "numeric",
      prompt: String.raw`Найдите $\det A$ для матрицы $$A = ${pm([[a, b], [c, d]])}.$$`,
      label: String.raw`$\det A =$`,
      answer: a * d - b * c,
      tol: 0,
      hints: [
        String.raw`Определитель $2 \times 2$: произведение диагонали минус произведение побочной диагонали.`,
        String.raw`$\det A = a_{11} a_{22} - a_{12} a_{21}$.`,
        String.raw`$a_{11} a_{22} = ${a * d}$, $a_{12} a_{21} = ${b * c}$.`,
      ],
      right: String.raw`$\det A = ${a}\cdot${d < 0 ? `(${d})` : d} - ${b < 0 ? `(${b})` : b}\cdot${c < 0 ? `(${c})` : c} = ${a * d - b * c}$.`,
      wrong: "Проверьте знак: вычитается произведение побочной диагонали.",
    };
  },
};

export const matmul2: Generator = {
  id: "la.matmul2",
  version: 3,
  title: "Произведение матриц 2 × 2",
  make(seed) {
    const r = rng(seed);
    const A = [[r.int(-2, 3), r.int(-2, 3)], [r.int(-2, 3), r.int(-2, 3)]];
    const B = [[r.int(-2, 3), r.int(-2, 3)], [r.int(-2, 3), r.int(-2, 3)]];
    const AB = A.map((row) => [0, 1].map((j) => row[0]! * B[0]![j]! + row[1]! * B[1]![j]!));
    return {
      kind: "matrix",
      prompt: String.raw`Вычислите $AB$ для матриц $$A = ${pm(A)}, \qquad B = ${pm(B)}.$$`,
      label: "$AB =$",
      answer: AB,
      tol: 0,
      hints: [
        "Элемент $(AB)_{ij}$ — скалярное произведение $i$-й строки $A$ на $j$-й столбец $B$.",
        String.raw`$(AB)_{11} = a_{11} b_{11} + a_{12} b_{21}$.`,
        String.raw`$(AB)_{11} = ${AB[0]![0]}$, $(AB)_{12} = ${AB[0]![1]}$.`,
      ],
      right: String.raw`$AB = ${sm(AB)}$.`,
      wrong: "Неверные клетки отмечены: пересчитайте строку на столбец.",
    };
  },
};

export const slope3: Generator = {
  id: "la.slope3",
  version: 2,
  title: "Наклон прямой по трём точкам",
  make(seed) {
    const r = rng(seed);
    const y = [r.int(0, 3), r.int(1, 4), r.int(1, 5)];
    // для x = 1, 2, 3: θ₁ = Σ(xᵢ − x̄)(yᵢ − ȳ) / Σ(xᵢ − x̄)² = (y₃ − y₁) / 2
    const slope = (y[2]! - y[0]!) / 2;
    return {
      kind: "numeric",
      prompt: String.raw`Три объекта с одним признаком. Найдите наклон $\theta_1$ прямой наименьших квадратов: $$X = ${pm([[1, 1], [1, 2], [1, 3]])}, \qquad y = ${pm(y.map((v) => [v]))}.$$`,
      label: String.raw`$\theta_1 =$`,
      answer: slope,
      hints: [
        String.raw`Наклон не зависит от сдвига: $\theta_1 = \dfrac{\sum (x_i - \bar x)(y_i - \bar y)}{\sum (x_i - \bar x)^2}$.`,
        String.raw`Здесь $x - \bar x = (-1, 0, 1)$, а $\sum (x_i - \bar x)^2 = 2$.`,
        String.raw`$\theta_1 = \dfrac{y_3 - y_1}{2}$.`,
      ],
      right: String.raw`$\theta_1 = \dfrac{${y[2]} - ${y[0]}}{2} = ${slope}$: в среднем каждый следующий объект на $${slope}$ выше предыдущего.`,
      wrong: String.raw`Составьте $X^\top X$ и $X^\top y$, затем решите систему $2 \times 2$.`,
    };
  },
};

export const shapes: Generator = {
  id: "la.shapes",
  version: 1,
  title: "Форма произведения",
  make(seed) {
    const r = rng(seed);
    const [n, d] = [r.int(5, 9), r.int(2, 4)];
    return {
      kind: "choice",
      prompt: String.raw`Матрица $X$ имеет форму $${n} \times ${d}$, вектор $\theta$ — $${d} \times 1$. Какая форма у $X^\top X \theta$?`,
      options: r.shuffle([
        { text: String.raw`$${d} \times 1$`, correct: true, why: String.raw`$X^\top X$ — $${d} \times ${d}$, умножение на $\theta$ даёт столбец длины $${d}$.` },
        { text: String.raw`$${n} \times 1$`, why: String.raw`Так выглядит $X\theta$ — предсказания для $${n}$ объектов; $X^\top$ снова сворачивает объекты.` },
        { text: String.raw`$${d} \times ${d}$`, why: String.raw`Это $X^\top X$ без умножения на $\theta$.` },
        { text: String.raw`$1 \times ${d}$`, why: String.raw`Строка получилась бы у $\theta^\top X^\top X$: транспонирование переставляет множители.` },
      ]),
      hints: ["Перемножайте формы слева направо: внутренние размеры совпадают и сокращаются."],
    };
  },
};

export const fromImages: Generator = {
  id: "la.from-images",
  version: 1,
  title: "Матрица по образам базисных векторов",
  make(seed) {
    const r = rng(seed);
    // столбцы разные и не совпадают с базисом, иначе задача угадывается
    let a: [number, number];
    let b: [number, number];
    do {
      a = [r.int(-2, 2), r.int(-2, 2)];
      b = [r.int(-2, 2), r.int(-2, 2)];
    } while (a[0] * b[1] - a[1] * b[0] === 0 || (a[0] === 1 && a[1] === 0 && b[0] === 0 && b[1] === 1) || a[0] === a[1] || b[0] === b[1]);
    const A = [[a[0], b[0]], [a[1], b[1]]];
    return {
      kind: "matrix",
      prompt: String.raw`Линейное отображение переводит $e_1$ в точку $(${a[0]}, ${a[1]})$, а $e_2$ — в $(${b[0]}, ${b[1]})$. Запишите его матрицу $A$.`,
      label: "$A =$",
      answer: A,
      tol: 0,
      hints: [
        String.raw`Столбец $j$ матрицы — это $Ae_j$, образ $j$-го базисного вектора.`,
        String.raw`Первый столбец — $(${a[0]}, ${a[1]})$, записанный сверху вниз.`,
      ],
      right: String.raw`$A = ${sm(A)}$: столбцы — образы $e_1$ и $e_2$.`,
      wrong: "Отмеченные клетки неверны. Образы базисных векторов записываются в столбцы, а не в строки.",
    };
  },
};

const NAMED: readonly { name: string; tex: string; M: number[][] }[] = [
  { name: "поворот на 90°", tex: "R", M: [[0, -1], [1, 0]] },
  { name: "растяжение вдвое по оси x", tex: "S", M: [[2, 0], [0, 1]] },
  { name: "сдвиг", tex: "H", M: [[1, 1], [0, 1]] },
  { name: "отражение относительно оси x", tex: "F", M: [[1, 0], [0, -1]] },
];
const mul = (A: number[][], B: number[][]) => A.map((row) => [0, 1].map((j) => row[0]! * B[0]![j]! + row[1]! * B[1]![j]!));
const same = (A: number[][], B: number[][]) => A.every((row, i) => row.every((v, j) => v === B[i]![j]));

export const composeOrder: Generator = {
  id: "la.compose-order",
  version: 1,
  title: "Порядок в композиции отображений",
  make(seed) {
    const r = rng(seed);
    let P: (typeof NAMED)[number];
    let Q: (typeof NAMED)[number];
    // только некоммутирующие пары: иначе порядок не виден
    do {
      [P, Q] = r.shuffle(NAMED).slice(0, 2) as [(typeof NAMED)[number], (typeof NAMED)[number]];
    } while (same(mul(Q.M, P.M), mul(P.M, Q.M)));
    const QP = mul(Q.M, P.M);
    const PQ = mul(P.M, Q.M);
    return {
      kind: "choice",
      prompt: String.raw`Сначала применили ${P.name} $${P.tex}$, потом ${Q.name} $${Q.tex}$: $$${P.tex} = ${pm(P.M)}, \qquad ${Q.tex} = ${pm(Q.M)}.$$ Какая матрица у результата?`,
      options: r.shuffle([
        { text: String.raw`$$${Q.tex}${P.tex} = ${pm(QP)}$$`, correct: true, why: String.raw`$(${Q.tex}${P.tex})x = ${Q.tex}(${P.tex}x)$: правая матрица действует первой.` },
        { text: String.raw`$$${P.tex}${Q.tex} = ${pm(PQ)}$$`, why: String.raw`Это «сначала ${Q.name}, потом ${P.name}»: произведение отображений читается справа налево.` },
        { text: String.raw`$${P.tex} + ${Q.tex}$`, why: "Сумма матриц — не композиция: она складывает образы, а не применяет отображения по очереди." },
      ]),
      hints: [String.raw`$(AB)x = A(Bx)$: первым действует правый множитель.`],
    };
  },
};

export const lincomb: Generator = {
  id: "la.lincomb",
  version: 1,
  title: "Линейная комбинация векторов",
  make(seed) {
    const r = rng(seed);
    const u = [r.nonzero(-3, 3), r.int(-3, 3)];
    const v = [r.int(-3, 3), r.nonzero(-3, 3)];
    const a = r.pick([2, 3, -1, -2]);
    const b = r.pick([2, -1, -2, -3]);
    const w = [a * u[0]! + b * v[0]!, a * u[1]! + b * v[1]!];
    const comb = String.raw`${a === -1 ? "-" : a}u ${b < 0 ? "-" : "+"} ${Math.abs(b) === 1 ? "" : Math.abs(b)}v`;
    return {
      kind: "matrix",
      prompt: String.raw`$u = ${pm([[u[0]!], [u[1]!]])}$, $v = ${pm([[v[0]!], [v[1]!]])}$. Вычислите $${comb}$.`,
      label: String.raw`$${comb} =$`,
      answer: [[w[0]!], [w[1]!]],
      tol: 0,
      hints: [String.raw`Линейная комбинация считается покоординатно: первая координата — $${par(a)} \cdot ${par(u[0]!)} + ${par(b)} \cdot ${par(v[0]!)}$.`],
      right: String.raw`$${comb} = (${w[0]}, ${w[1]})$.`,
      wrong: "Отмеченные координаты неверны. Умножьте каждый вектор на свой коэффициент и сложите координаты с одинаковыми номерами.",
    };
  },
};

export const dot: Generator = {
  id: "la.dot",
  version: 1,
  title: "Скалярное произведение",
  make(seed) {
    const r = rng(seed);
    const u = [r.int(-3, 4), r.int(-3, 4), r.nonzero(-3, 4)];
    const v = [r.nonzero(-3, 4), r.int(-3, 4), r.int(-3, 4)];
    const answer = u.reduce((s, x, i) => s + x * v[i]!, 0);
    return {
      kind: "numeric",
      prompt: String.raw`$u = (${u.join(", ")})$, $v = (${v.join(", ")})$. Вычислите $u^\top v$.`,
      label: String.raw`$u^\top v =$`,
      answer,
      tol: 0,
      hints: [String.raw`$u^\top v = \sum_{j} u_j v_j$ — сумма произведений координат с одинаковыми номерами.`],
      right: String.raw`$u^\top v = ${u.map((x, i) => `${x < 0 ? `(${x})` : x} \\cdot ${v[i]! < 0 ? `(${v[i]})` : v[i]}`).join(" + ")} = ${answer}$.`,
      wrong: "Скалярное произведение — число: произведения координат складываются. Проверьте знаки у отрицательных координат.",
    };
  },
};

/** Урок I.1: лежит ли t в оболочке a, b — единственным способом, бесконечным числом способов или нет. */
export const inSpan: Generator = {
  id: "la.in-span",
  version: 1,
  title: "Вектор в оболочке",
  make(seed) {
    const r = rng(seed);
    const kind = (["unique", "many", "none"] as const)[(seed - 1) % 3]!;
    let a: number[];
    let b: number[];
    let t: number[];
    if (kind === "unique") {
      do {
        a = [r.int(-2, 2), r.int(-2, 2)];
        b = [r.int(-2, 2), r.int(-2, 2)];
      } while (a[0]! * b[1]! - a[1]! * b[0]! === 0);
      const c = [r.nonzero(-2, 2), r.nonzero(-2, 2)];
      t = [c[0]! * a[0]! + c[1]! * b[0]!, c[0]! * a[1]! + c[1]! * b[1]!];
    } else {
      a = r.pick([[1, 2], [2, 1], [1, -1], [3, 1]]);
      const k = r.pick([2, -1, -2, 3]);
      b = [k * a[0]!, k * a[1]!];
      const s = r.pick([2, -2, 3]);
      t = kind === "many" ? [s * a[0]!, s * a[1]!] : [s * a[0]! + 1, s * a[1]!];
    }
    const vec = (v: number[]) => sm([[v[0]!], [v[1]!]]);
    const options: ChoiceOption[] = [
      {
        text: "Да, и коэффициенты $c_1$, $c_2$ определены однозначно",
        correct: kind === "unique",
        why: kind === "unique" ? String.raw`$a$ и $b$ не параллельны: их оболочка — вся плоскость, а система $c_1 a + c_2 b = t$ имеет одно решение.` : String.raw`$a$ и $b$ параллельны: ${kind === "many" ? "если комбинация попадает в $t$, то пар коэффициентов бесконечно много" : "их комбинации не выходят за одну прямую"}.`,
      },
      {
        text: "Да, и подходящих пар $c_1$, $c_2$ бесконечно много",
        correct: kind === "many",
        why: kind === "many" ? String.raw`$b$ кратен $a$, а $t$ лежит на их прямой: можно взять $c_2 = 0$, а можно добавить к $b$ компенсирующую часть $a$ — пар бесконечно много.` : kind === "unique" ? String.raw`Несколько решений бывает только у параллельных векторов, а здесь $a$ и $b$ не параллельны.` : String.raw`Все комбинации параллельных $a$ и $b$ лежат на одной прямой, а $t$ — вне её.`,
      },
      {
        text: String.raw`Нет: $t$ вне оболочки $a$ и $b$`,
        correct: kind === "none",
        why: kind === "none" ? String.raw`$b$ кратен $a$: все комбинации лежат на прямой через $a$, а $t$ на ней не лежит.` : String.raw`Попробуйте подобрать коэффициенты: ${kind === "unique" ? "непараллельные векторы порождают всю плоскость" : "$t$ кратен $a$"}.`,
      },
    ];
    return {
      kind: "choice",
      prompt: String.raw`$a = ${vec(a)}$, $b = ${vec(b)}$, $t = ${vec(t)}$. Лежит ли $t$ в оболочке $a$ и $b$?`,
      options,
      hints: [String.raw`Сначала проверьте, параллельны ли $a$ и $b$: пропорциональны ли их координаты.`],
    };
  },
};

/** Урок I.1: независимы ли три вектора ℝ³. Зависимость — третий есть комбинация первых двух. */
export const independence: Generator = {
  id: "la.independence",
  version: 1,
  title: "Линейная независимость",
  make(seed) {
    const r = rng(seed);
    const dependent = seed % 2 === 0;
    const v1 = [1, r.int(-2, 2), r.int(-2, 2)];
    const v2 = [0, 1, r.int(-2, 2)];
    const [p, q] = [r.nonzero(-2, 2), r.nonzero(-2, 2)];
    // независимый третий — «треугольный»: третья координата не даёт выразить его через первые два
    const v3 = dependent ? v1.map((x, i) => p * x + q * v2[i]!) : [0, 0, r.nonzero(-2, 2)];
    const order = r.shuffle([v1, v2, v3]);
    const names = ["v_1", "v_2", "v_3"];
    const vec = (v: number[]) => sm(v.map((x) => [x]));
    const k = (c: number) => (c === 1 ? "" : c === -1 ? "-" : String(c));
    const how = dependent ? String.raw`${names[order.indexOf(v3)]} = ${k(p)}${names[order.indexOf(v1)]} ${q < 0 ? "-" : "+"} ${k(Math.abs(q))}${names[order.indexOf(v2)]}` : "";
    const options: ChoiceOption[] = [
      { text: "Независимы: это базис $\\mathbb{R}^3$", correct: !dependent, why: dependent ? String.raw`Один вектор выражается через два других: $${how}$.` : String.raw`Нулевая комбинация возможна только с нулевыми коэффициентами — три независимых вектора в $\mathbb{R}^3$ образуют базис.` },
      { text: "Зависимы: один из них — комбинация двух других", correct: dependent, why: dependent ? String.raw`Верно: $${how}$.` : String.raw`Попробуйте выразить: из третьих координат и вторых следует, что все коэффициенты нулевые.` },
      { text: "Векторов три в $\\mathbb{R}^3$ — значит, они обязательно базис", why: String.raw`Трёх векторов мало: нужна ещё независимость. Три вектора одной плоскости базисом $\mathbb{R}^3$ не будут.` },
    ];
    return {
      kind: "choice",
      prompt: String.raw`Векторы $${names[0]} = ${vec(order[0]!)}$, $${names[1]} = ${vec(order[1]!)}$, $${names[2]} = ${vec(order[2]!)}$. Линейно независимы ли они?`,
      options,
      hints: [String.raw`Попробуйте выразить один вектор через два других: $v = \alpha u + \beta w$ — система из трёх уравнений на два неизвестных.`, String.raw`Или посчитайте определитель матрицы со столбцами $v_1, v_2, v_3$: ноль — значит, зависимы.`],
    };
  },
};
