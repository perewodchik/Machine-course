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

const abs = (x: number) => Math.abs(x);
/** Тройки с целой нормой ℓ₂: 3² + 4² = 5², 1² + 2² + 2² = 3² … */
const PYTH: readonly { v: number[]; n: number }[] = [
  { v: [3, 4], n: 5 },
  { v: [6, 8], n: 10 },
  { v: [5, 12], n: 13 },
  { v: [1, 2, 2], n: 3 },
  { v: [2, 3, 6], n: 7 },
  { v: [1, 4, 8], n: 9 },
  { v: [4, 4, 7], n: 9 },
];
/** Матрицы 2 × 2 с целой нормой Фробениуса: элементы и корень из суммы квадратов. */
const FROB: readonly { v: number[]; n: number }[] = [
  { v: [1, 1, 1, 1], n: 2 },
  { v: [1, 2, 2, 4], n: 5 },
  { v: [1, 1, 3, 5], n: 6 },
  { v: [2, 2, 4, 5], n: 7 },
  { v: [2, 4, 5, 6], n: 9 },
];

/** Урок I.2: нормы ℓ₁, ℓ₂, ℓ∞ вектора и норма Фробениуса матрицы — по кругу от номера варианта. */
export const norms: Generator = {
  id: "la.norms",
  version: 1,
  title: "Нормы вектора и матрицы",
  make(seed) {
    const r = rng(seed);
    const kind = (["l1", "l2", "linf", "fro"] as const)[(seed - 1) % 4]!;
    const signed = (v: readonly number[]) => r.shuffle(v.map((x) => (r.int(0, 1) ? -x : x)));
    if (kind === "fro") {
      const { v, n } = r.pick(FROB);
      const e = signed(v);
      const A = [[e[0]!, e[1]!], [e[2]!, e[3]!]];
      return {
        kind: "numeric",
        prompt: String.raw`Найдите норму Фробениуса матрицы $$A = ${pm(A)}.$$`,
        label: String.raw`$\lVert A \rVert_F =$`,
        answer: n,
        tol: 0,
        hints: [
          String.raw`Норма Фробениуса — евклидова норма матрицы, вытянутой в вектор: $\lVert A \rVert_F = \sqrt{\sum_{i,j} A_{ij}^2}$.`,
          String.raw`Сумма квадратов элементов равна $${n * n}$.`,
        ],
        right: String.raw`$\lVert A \rVert_F = \sqrt{${e.map((x) => `${par(x)}^2`).join(" + ")}} = \sqrt{${n * n}} = ${n}$.`,
        wrong: String.raw`Квадраты всех четырёх элементов складываются, затем извлекается корень.`,
      };
    }
    let x: number[];
    let n2 = 0;
    if (kind === "l2") {
      const t = r.pick(PYTH);
      [x, n2] = [signed(t.v), t.n];
    }
    else {
      // три разных модуля, хотя бы один отрицательный; у ℓ∞ наибольший по модулю — отрицательный (ловит max со знаком)
      const mags = r.shuffle([1, 2, 3, 4, 5]).slice(0, 3);
      x = mags.map((m) => (r.int(0, 1) ? -m : m));
      const top = x.findIndex((v) => abs(v) === Math.max(...mags));
      if (kind === "linf") x[top] = -abs(x[top]!);
      else if (x.every((v) => v > 0)) x[r.int(0, 2)]! *= -1;
    }
    const sub = kind === "l1" ? "1" : kind === "l2" ? "2" : String.raw`\infty`;
    const answer = kind === "l1" ? x.reduce((s, v) => s + abs(v), 0) : kind === "l2" ? n2 : Math.max(...x.map(abs));
    const sq = x.reduce((s, v) => s + v * v, 0);
    const hint =
      kind === "l1"
        ? String.raw`$\lVert x \rVert_1 = \sum_j \lvert x_j \rvert$ — сумма модулей координат.`
        : kind === "l2"
          ? String.raw`$\lVert x \rVert_2 = \sqrt{x^\top x} = \sqrt{\sum_j x_j^2}$.`
          : String.raw`$\lVert x \rVert_\infty = \max_j \lvert x_j \rvert$ — наибольший модуль координаты.`;
    const right =
      kind === "l1"
        ? String.raw`$\lVert x \rVert_1 = ${x.map((v) => `${abs(v)}`).join(" + ")} = ${answer}$.`
        : kind === "l2"
          ? String.raw`$\lVert x \rVert_2 = \sqrt{${x.map((v) => `${par(v)}^2`).join(" + ")}} = \sqrt{${sq}} = ${answer}$.`
          : String.raw`$\lVert x \rVert_\infty = \max(${x.map(abs).join(", ")}) = ${answer}$.`;
    const wrong =
      kind === "l1"
        ? "Складываются модули: отрицательная координата добавляет к норме, а не вычитает."
        : kind === "l2"
          ? String.raw`Не забыт ли корень? $x^\top x = \lVert x \rVert_2^2 = ${sq}$, а норма — корень из этого числа.`
          : "Нужен наибольший модуль координаты, а не наибольшая координата со знаком.";
    return {
      kind: "numeric",
      prompt: String.raw`$x = (${x.join(", ")})$. Найдите $\lVert x \rVert_{${sub}}$.`,
      label: String.raw`$\lVert x \rVert_{${sub}} =$`,
      answer,
      tol: 0,
      hints: [hint],
      right,
      wrong,
    };
  },
};

/** Урок I.2: проекция b на a; b = t a + s a⊥ с целыми t, s — ответ целый. */
export const projection: Generator = {
  id: "la.projection",
  version: 1,
  title: "Проекция вектора на вектор",
  make(seed) {
    const r = rng(seed);
    const a = r.pick([[1, 1], [1, 2], [2, 1], [1, -1], [3, 1], [1, -2]]);
    const [t, s] = [r.nonzero(-2, 3), r.nonzero(-2, 2)];
    const b = [t * a[0]! - s * a[1]!, t * a[1]! + s * a[0]!];
    const ab = a[0]! * b[0]! + a[1]! * b[1]!;
    const aa = a[0]! * a[0]! + a[1]! * a[1]!;
    const p = [t * a[0]!, t * a[1]!];
    const col = (v: number[]) => sm([[v[0]!], [v[1]!]]);
    return {
      kind: "matrix",
      prompt: String.raw`$a = ${col(a)}$, $b = ${col(b)}$. Найдите проекцию $b$ на $a$.`,
      label: String.raw`$\operatorname{proj}_a b =$`,
      answer: [[p[0]!], [p[1]!]],
      tol: 0,
      hints: [
        String.raw`Проекция — $\frac{a^\top b}{a^\top a}\, a$: сначала два скалярных произведения, потом их частное умножить на $a$.`,
        String.raw`$a^\top b = ${ab}$, $a^\top a = ${aa}$.`,
      ],
      right: String.raw`$a^\top b = ${ab}$, $a^\top a = ${aa}$, коэффициент $\frac{${ab}}{${aa}} = ${t}$; проекция — $${t} \cdot ${col(a)} = ${col(p)}$.`,
      wrong: String.raw`Делить нужно на $a^\top a = \lVert a \rVert^2$, а не на $\lVert a \rVert$; проекция — вектор вдоль $a$, а не вдоль $b$.`,
    };
  },
};

/** Урок I.2: острый, прямой или тупой угол — по знаку скалярного произведения; вид — по кругу от номера варианта. */
export const angle: Generator = {
  id: "la.angle",
  version: 1,
  title: "Угол по скалярному произведению",
  make(seed) {
    const r = rng(seed);
    const want = (["acute", "right", "obtuse"] as const)[(seed - 1) % 3]!;
    let u: number[];
    let v: number[];
    let d: number;
    do {
      u = [r.int(-3, 3), r.int(-3, 3), r.nonzero(-3, 3)];
      v = [r.nonzero(-3, 3), r.int(-3, 3), r.int(-3, 3)];
      d = u.reduce((s, x, i) => s + x * v[i]!, 0);
    } while ((want === "acute" && d <= 0) || (want === "right" && d !== 0) || (want === "obtuse" && d >= 0));
    const sum = u.map((x, i) => `${par(x)} \\cdot ${par(v[i]!)}`).join(" + ");
    const calc = String.raw`u^\top v = ${sum} = ${d}`;
    const options: ChoiceOption[] = [
      { text: "Острый", correct: want === "acute", why: want === "acute" ? String.raw`$${calc} > 0$, значит, $\cos\varphi > 0$.` : String.raw`$${calc}$: косинус острого угла положителен, а здесь — нет.` },
      { text: "Прямой", correct: want === "right", why: want === "right" ? String.raw`$${calc}$: векторы ортогональны.` : String.raw`$${calc} \ne 0$, а у перпендикулярных векторов скалярное произведение равно нулю.` },
      { text: "Тупой", correct: want === "obtuse", why: want === "obtuse" ? String.raw`$${calc} < 0$, значит, $\cos\varphi < 0$.` : String.raw`$${calc}$: у тупого угла косинус отрицателен, а здесь — нет.` },
    ];
    return {
      kind: "choice",
      prompt: String.raw`$u = (${u.join(", ")})$, $v = (${v.join(", ")})$. Какой угол между $u$ и $v$?`,
      options,
      hints: [String.raw`Длины положительны, поэтому знак $\cos\varphi = \frac{u^\top v}{\lVert u \rVert \lVert v \rVert}$ — это знак $u^\top v$.`],
    };
  },
};

/** Урок I.3: один столбец AB (нечётные варианты) или одна строка (чётные) без вычисления всей матрицы. */
export const matmulColumn: Generator = {
  id: "la.matmul-column",
  version: 2,
  title: "Столбец или строка произведения",
  make(seed) {
    const r = rng(seed);
    const A = [[r.int(-2, 3), r.int(-2, 3), r.int(-2, 3)], [r.int(-2, 3), r.int(-2, 3), r.int(-2, 3)]];
    const B = [[r.int(-2, 3), r.int(-2, 3)], [r.int(-2, 3), r.int(-2, 3)], [r.int(-2, 3), r.int(-2, 3)]];
    const j = r.int(0, 1);
    const given = String.raw`$$A = ${pm(A)}, \qquad B = ${pm(B)}.$$`;
    if (seed % 2 === 0) {
      // строка j произведения — комбинация строк B с коэффициентами из строки j матрицы A
      const a = A[j]!;
      const row = [0, 1].map((c) => a.reduce((s, x, k) => s + x * B[k]![c]!, 0));
      const terms = a.map((x, k) => `${par(x)} ${sm([B[k]!])}`).join(" + ");
      return {
        kind: "matrix",
        prompt: String.raw`${given} Найдите ${j + 1}-ю строку $AB$, не вычисляя остальное.`,
        label: String.raw`$(AB)_{${j + 1},:} =$`,
        answer: [row],
        tol: 0,
        hints: [
          String.raw`Строка $i$ произведения — строка $i$ матрицы $A$, умноженная на $B$: $(AB)_{i,:} = A_{i,:} B$.`,
          String.raw`А $A_{i,:} B$ — комбинация строк $B$ с коэффициентами из $A_{${j + 1},:} = (${a.join(", ")})$.`,
        ],
        right: String.raw`$(AB)_{${j + 1},:} = ${terms} = ${sm([row])}$.`,
        wrong: String.raw`Коэффициенты берутся из ${j + 1}-й строки $A$, а складываются строки $B$.`,
      };
    }
    const b = B.map((row) => row[j]!);
    const col = A.map((row) => row.reduce((s, a, k) => s + a * b[k]!, 0));
    const terms = b.map((c, k) => `${par(c)} ${sm(A.map((row) => [row[k]!]))}`).join(" + ");
    return {
      kind: "matrix",
      prompt: String.raw`${given} Найдите ${j + 1}-й столбец $AB$, не вычисляя остальное.`,
      label: String.raw`$(AB)_{:,${j + 1}} =$`,
      answer: col.map((v) => [v]),
      tol: 0,
      hints: [
        String.raw`Столбец $j$ произведения — $A$, умноженная на столбец $j$ матрицы $B$: $(AB)_{:,j} = A\, B_{:,j}$.`,
        String.raw`А $A B_{:,j}$ — комбинация столбцов $A$ с коэффициентами из $B_{:,${j + 1}} = (${b.join(", ")})$.`,
      ],
      right: String.raw`$(AB)_{:,${j + 1}} = ${terms} = ${sm(col.map((v) => [v]))}$.`,
      wrong: String.raw`Коэффициенты берутся из ${j + 1}-го столбца $B$, а складываются столбцы $A$.`,
    };
  },
};

/** Урок I.3: внешнее произведение u vᵀ — таблица попарных произведений координат. */
export const outer: Generator = {
  id: "la.outer",
  version: 1,
  title: "Внешнее произведение",
  make(seed) {
    const r = rng(seed);
    const u = [r.nonzero(-3, 3), r.int(-2, 3)];
    const v = [r.nonzero(-2, 3), r.int(-2, 2), r.nonzero(-2, 3)];
    const M = u.map((a) => v.map((b) => a * b + 0));
    return {
      kind: "matrix",
      prompt: String.raw`$u = ${sm(u.map((x) => [x]))}$, $v = ${sm(v.map((x) => [x]))}$. Вычислите $u v^\top$.`,
      label: String.raw`$u v^\top =$`,
      answer: M,
      tol: 0,
      hints: [
        String.raw`$u v^\top$ — столбец на строку: форма $2 \times 1$ на $1 \times 3$ даёт $2 \times 3$.`,
        String.raw`Элемент $(u v^\top)_{ij} = u_i v_j$: строка $i$ — это $v^\top$, умноженная на $u_i$.`,
      ],
      right: String.raw`$u v^\top = ${sm(M)}$: каждая строка — $v^\top$, умноженная на свою координату $u$, поэтому ранг равен $1$.`,
      wrong: String.raw`Не путайте с $u^\top v$: здесь не число, а таблица $2 \times 3$ всех произведений $u_i v_j$.`,
    };
  },
};

/** Урок I.3: какое из произведений определено и какой оно формы. */
export const shapeProduct: Generator = {
  id: "la.shape-product",
  version: 1,
  title: "Когда произведение определено",
  make(seed) {
    const r = rng(seed);
    // A: m × k, B: k × p, все размеры разные — неверные варианты не совпадают с верным случайно
    const [m, k, p] = r.shuffle([2, 3, 4, 5]).slice(0, 3) as [number, number, number];
    const options: ChoiceOption[] = r.shuffle([
      { text: String.raw`$AB$, форма $${m} \times ${p}$`, correct: true, why: String.raw`Столбцов у $A$ — $${k}$, строк у $B$ — $${k}$: стыкуется. Строки берутся от $A$, столбцы — от $B$.` },
      { text: String.raw`$BA$, форма $${k} \times ${k}$`, why: String.raw`У $B$ $${p}$ столбцов, а у $A$ $${m}$ строк: $${p} \ne ${m}$, произведение $BA$ не определено.` },
      { text: String.raw`$AB$, форма $${k} \times ${k}$`, why: String.raw`Совпадающий размер $${k}$ — внутренний, он «сокращается». Форма $AB$ — строки $A$ на столбцы $B$.` },
      { text: String.raw`$A B^\top$, форма $${m} \times ${k}$`, why: String.raw`$B^\top$ — $${p} \times ${k}$: у $A$ $${k}$ столбцов, а у $B^\top$ $${p}$ строк, не стыкуется.` },
    ]);
    return {
      kind: "choice",
      prompt: String.raw`$A$ — матрица $${m} \times ${k}$, $B$ — $${k} \times ${p}$. Какое произведение определено и какой оно формы?`,
      options,
      hints: [String.raw`$(m \times k)$ на $(k \times p)$ — внутренние размеры совпадают, ответ $m \times p$.`],
    };
  },
};

/** Урок I.5: транспонирование цепочки из трёх множителей — порядок разворачивается; формы подсказывают ответ. */
export const transposeChain: Generator = {
  id: "la.transpose-chain",
  version: 1,
  title: "Транспонирование произведения",
  make(seed) {
    const r = rng(seed);
    const [A, B, C] = r.pick([
      ["X", String.raw`\theta`, "w"],
      ["A", "B", "x"],
      ["W", "V", "h"],
    ] as const);
    // формы: A — m × k, B — k × p, C — p × 1; все размеры разные, чтобы неверные варианты не сходились
    const [m, k, p] = r.shuffle([2, 3, 4, 5]).slice(0, 3) as [number, number, number];
    const T = (s: string) => `${s}^\\top`;
    const options: ChoiceOption[] = r.shuffle([
      { text: `$${T(C)} ${T(B)} ${T(A)}$`, correct: true, why: String.raw`Порядок разворачивается: $(${A} ${B} ${C})^\top = ${T(C)} ${T(B)} ${T(A)}$. Формы: $1 \times ${p}$, $${p} \times ${k}$, $${k} \times ${m}$ — стыкуются.` },
      { text: `$${T(A)} ${T(B)} ${T(C)}$`, why: String.raw`Порядок не развёрнут. Формы $${k} \times ${m}$ и $${p} \times ${k}$ не стыкуются: $${m} \ne ${p}$.` },
      { text: `$${C} ${B} ${A}$`, why: String.raw`Множители переставлены, но не транспонированы: $${C}$ — столбец $${p} \times 1$, на $${B}$ формы $${k} \times ${p}$ его не умножить.` },
      { text: `$${T(C)} ${B}^{-1} ${A}^{-1}$`, why: String.raw`Транспонирование — не обращение. И обратная есть только у квадратной матрицы.` },
    ]);
    return {
      kind: "choice",
      prompt: String.raw`$${A}$ — матрица $${m} \times ${k}$, $${B}$ — $${k} \times ${p}$, $${C}$ — столбец $${p} \times 1$. Чему равно $(${A} ${B} ${C})^\top$?`,
      options,
      hints: [String.raw`$(AB)^\top = B^\top A^\top$; примените правило дважды, сначала к $(${A} ${B})\, ${C}$.`],
    };
  },
};

/** Урок I.5: симметричная часть матрицы 2 × 2 — полусумма A и Aᵀ. */
export const symPart: Generator = {
  id: "la.sym-part",
  version: 1,
  title: "Симметричная часть матрицы",
  make(seed) {
    const r = rng(seed);
    const [a, d] = [r.int(-3, 4), r.int(-3, 4)];
    const b = r.int(-3, 4);
    let c = r.int(-3, 4);
    if (b === c) c = b + r.pick([-3, -1, 1, 2]); // иначе A уже симметрична
    const s = (b + c) / 2;
    const S = [[a, s], [s, d]];
    const half = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
    return {
      kind: "matrix",
      prompt: String.raw`$$A = ${pm([[a, b], [c, d]])}.$$ Найдите симметричную часть $S = \tfrac12 (A + A^\top)$.`,
      label: "$S =$",
      answer: S,
      tol: 1e-9,
      hints: [
        String.raw`$A^\top$ — те же элементы, отражённые относительно диагонали: $A^\top = ${pm([[a, c], [b, d]])}$.`,
        "Диагональ не меняется, а внедиагональные элементы заменяются их средним.",
      ],
      right: String.raw`$S = ${sm([[a, Number(half(s))], [Number(half(s)), d]])}$: на диагонали — диагональ $A$, вне её — $\tfrac{${b} + ${par(c)}}{2} = ${half(s)}$. Остаток $A - S$ — кососимметричная часть.`,
      wrong: "Проверьте внедиагональные элементы: у симметричной части они одинаковые и равны среднему двух элементов A.",
    };
  },
};

/** Урок I.5: tr(BA) для B 3 × 2 и A 2 × 3 — проще посчитать tr(AB), матрицу 2 × 2. */
export const traceSwap: Generator = {
  id: "la.trace-swap",
  version: 1,
  title: "След и перестановка множителей",
  make(seed) {
    const r = rng(seed);
    const A = [[r.int(-2, 3), r.int(-2, 3), r.int(-2, 3)], [r.int(-2, 3), r.int(-2, 3), r.int(-2, 3)]];
    const B = [[r.int(-2, 3), r.int(-2, 3)], [r.int(-2, 3), r.int(-2, 3)], [r.int(-2, 3), r.int(-2, 3)]];
    const ab = (i: number) => A[i]!.reduce((s, x, k) => s + x * B[k]![i]!, 0);
    const answer = ab(0) + ab(1);
    return {
      kind: "numeric",
      prompt: String.raw`$$A = ${pm(A)}, \qquad B = ${pm(B)}.$$ Найдите $\operatorname{tr}(BA)$. Матрица $BA$ — $3 \times 3$; можно ли обойтись без неё?`,
      label: String.raw`$\operatorname{tr}(BA) =$`,
      answer,
      tol: 0,
      hints: [
        String.raw`$\operatorname{tr}(BA) = \operatorname{tr}(AB)$, а $AB$ — всего $2 \times 2$. Нужна только её диагональ.`,
        String.raw`$(AB)_{11}$ — строка 1 $A$ на столбец 1 $B$, $(AB)_{22}$ — строка 2 $A$ на столбец 2 $B$.`,
      ],
      right: String.raw`$\operatorname{tr}(BA) = \operatorname{tr}(AB) = (AB)_{11} + (AB)_{22} = ${ab(0)} + ${par(ab(1))} = ${answer}$.`,
      wrong: String.raw`След — сумма диагональных элементов. Посчитайте только $(AB)_{11}$ и $(AB)_{22}$: $\operatorname{tr}(BA) = \operatorname{tr}(AB)$.`,
    };
  },
};

/** Система 2 × 2 в TeX: «x₁ + 2x₂ = 2» строками cases. */
function cases(rows: readonly (readonly number[])[]): string {
  const term = (c: number, name: string, first: boolean) => {
    if (c === 0) return "";
    const sign = c < 0 ? "-" : first ? "" : "+";
    const k = Math.abs(c) === 1 ? "" : String(Math.abs(c));
    return `${first ? sign : ` ${sign} `}${k}${name}`;
  };
  const line = ([a, b, c]: readonly number[]) => `${term(a!, "x_1", true) + term(b!, "x_2", a === 0) || "0"} = ${c}`;
  return String.raw`\begin{cases} ${rows.map(line).join(String.raw` \\ `)} \end{cases}`;
}

/** Урок I.6: сколько решений у системы 2 × 2 — вид по кругу от номера варианта: одно, нет, бесконечно много. */
export const solutionsCount: Generator = {
  id: "la.solutions-count",
  version: 1,
  title: "Сколько решений у системы",
  make(seed) {
    const r = rng(seed);
    const kind = (["one", "none", "many"] as const)[(seed - 1) % 3]!;
    const a = [r.nonzero(-3, 3), r.nonzero(-3, 3)];
    const b = r.int(-4, 4);
    let second: number[];
    if (kind === "one") {
      let c: number[];
      do c = [r.int(-3, 3), r.int(-3, 3)];
      while (a[0]! * c[1]! - a[1]! * c[0]! === 0);
      second = [c[0]!, c[1]!, r.int(-4, 4)];
    } else {
      const k = r.pick([2, -1, 3, -2]);
      second = [k * a[0]!, k * a[1]!, kind === "many" ? k * b : k * b + r.nonzero(-2, 2)];
    }
    const rows = r.next() < 0.5 ? [[a[0]!, a[1]!, b], second] : [second, [a[0]!, a[1]!, b]];
    const rankA = kind === "one" ? 2 : 1;
    const rankAb = kind === "none" ? 2 : rankA;
    const ranks = String.raw`$\operatorname{rank} A = ${rankA}$, $\operatorname{rank}\,[A \mid b] = ${rankAb}$`;
    const options: ChoiceOption[] = [
      { text: "Одно решение", correct: kind === "one", why: kind === "one" ? String.raw`${ranks}: строки $A$ не пропорциональны, прямые пересекаются в одной точке.` : String.raw`${ranks}: левые части пропорциональны, прямые параллельны или совпадают — одной точки пересечения нет.` },
      { text: "Нет решений", correct: kind === "none", why: kind === "none" ? String.raw`${ranks}: левые части пропорциональны, а правые — нет. Прямые параллельны.` : kind === "one" ? String.raw`${ranks}: непараллельные прямые на плоскости всегда пересекаются.` : String.raw`${ranks}: второе уравнение — первое, умноженное на число, вместе с правой частью. Прямые совпадают.` },
      { text: "Бесконечно много решений", correct: kind === "many", why: kind === "many" ? String.raw`${ranks}: второе уравнение — первое, умноженное на число. Прямые совпадают, решение — вся прямая.` : kind === "one" ? String.raw`${ranks}: ранг полный, решение единственно.` : String.raw`${ranks}: ранги разные — система несовместна, решений нет совсем.` },
    ];
    return {
      kind: "choice",
      prompt: String.raw`Сколько решений у системы $$${cases(rows)}$$`,
      options,
      hints: [String.raw`Сравните строки: пропорциональны ли левые части? А вместе с правыми?`, String.raw`Решения есть, только если $\operatorname{rank} A = \operatorname{rank}\,[A \mid b]$; единственно — если этот ранг равен числу неизвестных.`],
    };
  },
};

/** Урок I.6: какой вектор лежит в ядре матрицы 2 × 3. Ядро — прямая, её направление — векторное произведение строк. */
export const kernelVector: Generator = {
  id: "la.kernel-vector",
  version: 2,
  title: "Вектор из ядра",
  make(seed) {
    const r = rng(seed);
    let r1: number[];
    let r2: number[];
    let k: number[];
    const gcd = (x: number, y: number): number => (y === 0 ? Math.abs(x) : gcd(y, x % y));
    for (;;) {
      r1 = [r.int(-2, 3), r.int(-2, 3), r.int(-2, 3)];
      r2 = [r.int(-2, 3), r.int(-2, 3), r.int(-2, 3)];
      k = [r1[1]! * r2[2]! - r1[2]! * r2[1]!, r1[2]! * r2[0]! - r1[0]! * r2[2]!, r1[0]! * r2[1]! - r1[1]! * r2[0]!];
      const g = gcd(gcd(k[0]!, k[1]!), k[2]!);
      if (g === 0) continue; // строки пропорциональны — ядро больше прямой
      k = k.map((x) => x / g + 0);
      if (k.every((x) => Math.abs(x) <= 6) && k.filter((x) => x !== 0).length >= 2) break;
    }
    const A = [r1, r2];
    const Av = (v: number[]) => A.map((row) => row.reduce((s, a, i) => s + a * v[i]!, 0));
    const vec = (v: number[]) => `(${v.join(", ")})`;
    const flip = k.map((x, i) => (i === k.findIndex((y) => y !== 0) ? -x : x) + 0);
    const cands = [flip, r1, k.map((x) => x + 1)].filter((v) => Av(v).some((x) => x !== 0));
    const options: ChoiceOption[] = r.shuffle([
      { text: `$${vec(k)}$`, correct: true, why: String.raw`$A v = ${vec(Av(k))}$: обе строки $A$ перпендикулярны $v$.` },
      ...cands.slice(0, 2).map((v) => ({ text: `$${vec(v)}$`, why: String.raw`$A v = ${vec(Av(v))} \ne 0$: этот вектор не в ядре.` })),
    ]);
    return {
      kind: "choice",
      prompt: String.raw`$$A = ${pm(A)}.$$ Какой вектор лежит в ядре $A$, то есть $Av = 0$?`,
      options,
      hints: [String.raw`Умножьте $A$ на каждый вариант: $Av = 0$ значит, что $v$ перпендикулярен обеим строкам $A$.`],
    };
  },
};

/** Урок I.6: теорема о ранге и дефекте — dim ker A = n − rank A для матрицы 3 × 4 с заметными зависимостями строк. */
export const rankNullity: Generator = {
  id: "la.rank-nullity",
  version: 1,
  title: "Ранг и размерность ядра",
  make(seed) {
    const r = rng(seed);
    const rank = r.pick([1, 2, 2, 3]);
    const base = [
      [1, r.int(-2, 2), r.int(-2, 2), r.int(-2, 2)],
      [0, 1, r.int(-2, 2), r.int(-2, 2)],
      [0, 0, 1, r.int(-2, 2)],
    ].slice(0, rank);
    // недостающие строки — комбинации первых: зависимость видна, если сложить или умножить строки
    const rows = [...base];
    while (rows.length < 3) {
      const [p, q] = [r.pick([1, 2, -1]), rank > 1 ? r.pick([1, -1, 0]) : 0];
      rows.push(base[0]!.map((x, j) => p * x + q * (base[1]?.[j] ?? 0) + 0));
    }
    const A = r.shuffle(rows);
    return {
      kind: "numeric",
      prompt: String.raw`$$A = ${pm(A)}.$$ Найдите $\dim \ker A$ — размерность ядра.`,
      label: String.raw`$\dim \ker A =$`,
      answer: 4 - rank,
      tol: 0,
      hints: [
        String.raw`По теореме о ранге $\dim \ker A = n - \operatorname{rank} A$, здесь $n = 4$ — число столбцов.`,
        "Ранг — число независимых строк. Проверьте, не выражается ли одна строка через другие.",
      ],
      right: String.raw`$\operatorname{rank} A = ${rank}$, поэтому $\dim \ker A = 4 - ${rank} = ${4 - rank}$.`,
      wrong: String.raw`Вычитать нужно из числа столбцов ($n = 4$), а не строк. И проверьте ранг: зависимые строки его не увеличивают.`,
    };
  },
};

/** Урок I.7: обратная к матрице 2 × 2 с определителем ±1 — ответ целый. */
export const inverse2: Generator = {
  id: "la.inverse2",
  version: 1,
  title: "Обратная матрица 2 × 2",
  make(seed) {
    const r = rng(seed);
    // произведение двух сдвигов: [[1, p], [0, 1]] · [[1, 0], [q, 1]] — определитель 1; знак строки даёт −1
    const [p, q] = [r.nonzero(-2, 2), r.nonzero(-2, 2)];
    const s = r.pick([1, -1]);
    const A = [[s * (1 + p * q), s * p], [q, 1]];
    const d = A[0]![0]! * A[1]![1]! - A[0]![1]! * A[1]![0]!;
    const inv = [[A[1]![1]! / d, -A[0]![1]! / d], [-A[1]![0]! / d, A[0]![0]! / d]].map((row) => row.map((v) => v + 0));
    return {
      kind: "matrix",
      prompt: String.raw`Найдите обратную матрицу: $$A = ${pm(A)}.$$`,
      label: String.raw`$A^{-1} =$`,
      answer: inv,
      tol: 0,
      hints: [
        String.raw`Для $\left(\begin{smallmatrix} a & b \\ c & d \end{smallmatrix}\right)$ обратная — $\frac{1}{ad - bc} \left(\begin{smallmatrix} d & -b \\ -c & a \end{smallmatrix}\right)$.`,
        String.raw`Здесь $\det A = ${d}$.`,
      ],
      right: String.raw`$\det A = ${d}$, $A^{-1} = ${sm(inv)}$. Проверка: $A A^{-1} = I$.`,
      wrong: "Диагональные элементы меняются местами, внедиагональные меняют знак, всё делится на определитель. Проверьте произведение с A.",
    };
  },
};

/** Урок I.7: площадь образа фигуры — площадь, умноженная на |det A|. */
export const detArea: Generator = {
  id: "la.det-area",
  version: 1,
  title: "Площадь образа",
  make(seed) {
    const r = rng(seed);
    const A = [[r.int(-3, 3), r.int(-3, 3)], [r.int(-3, 3), r.int(-3, 3)]];
    if (A[0]![0]! * A[1]![1]! === A[0]![1]! * A[1]![0]!) A[0]![0] = A[0]![0]! + 1;
    const d = A[0]![0]! * A[1]![1]! - A[0]![1]! * A[1]![0]!;
    const fig = r.pick([
      { name: "квадрат со стороной 2", area: 4 },
      { name: "треугольник площади 3", area: 3 },
      { name: "круг площади 5", area: 5 },
      { name: "прямоугольник 1 × 3", area: 3 },
    ]);
    return {
      kind: "numeric",
      prompt: String.raw`Отображение $x \mapsto Ax$, $A = ${sm(A)}$, переводит ${fig.name} в новую фигуру. Найдите её площадь.`,
      label: "площадь =",
      answer: fig.area * Math.abs(d),
      tol: 0,
      hints: [String.raw`Линейное отображение умножает любую площадь на $\lvert \det A \rvert$ — не только площадь квадрата.`, String.raw`$\det A = ${d}$.`],
      right: String.raw`$\lvert \det A \rvert = ${Math.abs(d)}$, площадь — $${fig.area} \cdot ${Math.abs(d)} = ${fig.area * Math.abs(d)}$.${d < 0 ? " Знак минус у определителя значит, что фигура ещё и отразилась, но площадь положительна." : ""}`,
      wrong: String.raw`Площадь образа — исходная площадь, умноженная на модуль определителя, $\lvert ad - bc \rvert$.`,
    };
  },
};

/** Урок I.7: свойства определителя — det(AB), det(A⁻¹), det(cA) для 2 × 2; вид по кругу от номера варианта. */
export const detRules: Generator = {
  id: "la.det-rules",
  version: 1,
  title: "Свойства определителя",
  make(seed) {
    const r = rng(seed);
    const kind = (["product", "inverse", "scale"] as const)[(seed - 1) % 3]!;
    if (kind === "product") {
      const [a, b] = [r.nonzero(-4, 4), r.nonzero(-3, 3)];
      return {
        kind: "numeric",
        prompt: String.raw`$A$ и $B$ — матрицы $3 \times 3$, $\det A = ${a}$, $\det B = ${b}$. Найдите $\det(AB)$.`,
        label: String.raw`$\det(AB) =$`,
        answer: a * b,
        tol: 0,
        hints: [String.raw`Площади (объёмы) растягиваются последовательно: $\det(AB) = \det A \det B$.`],
        right: String.raw`$\det(AB) = ${a} \cdot ${par(b)} = ${a * b}$.`,
        wrong: String.raw`Определители перемножаются, а не складываются: $\det(AB) = \det A \det B$.`,
      };
    }
    if (kind === "inverse") {
      const a = r.pick([2, 4, 5, -2, -4, -5]);
      return {
        kind: "numeric",
        prompt: String.raw`$\det A = ${a}$. Найдите $\det(A^{-1})$.`,
        label: String.raw`$\det(A^{-1}) =$`,
        answer: 1 / a,
        tol: 1e-9,
        hints: [String.raw`$A A^{-1} = I$ и $\det I = 1$, поэтому $\det A \cdot \det(A^{-1}) = 1$.`],
        right: String.raw`$\det(A^{-1}) = \frac{1}{\det A} = \frac{1}{${a}} = ${String(1 / a)}$.`,
        wrong: String.raw`Обратная отменяет растяжение: если $A$ растягивает площади в $${a}$ раз, то $A^{-1}$ — в $\frac{1}{${a}}$ раз.`,
      };
    }
    const [c, a] = [r.pick([2, 3, -2]), r.nonzero(-3, 3)];
    return {
      kind: "numeric",
      prompt: String.raw`$A$ — матрица $2 \times 2$, $\det A = ${a}$. Найдите $\det(${c}A)$.`,
      label: String.raw`$\det(${c}A) =$`,
      answer: c * c * a,
      tol: 0,
      hints: [String.raw`$${c}A$ умножает на $${c}$ каждый из двух столбцов, а определитель линеен по каждому столбцу.`],
      right: String.raw`$\det(${c}A) = ${par(c)}^2 \det A = ${c * c} \cdot ${par(a)} = ${c * c * a}$: в $\mathbb{R}^2$ растягиваются обе стороны квадрата.`,
      wrong: String.raw`Не $${c} \det A$: множитель $${c}$ стоит в каждом из двух столбцов, поэтому $\det(${c}A) = ${par(c)}^2 \det A$.`,
    };
  },
};
