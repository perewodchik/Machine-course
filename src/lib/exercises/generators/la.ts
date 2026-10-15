// Параметрические задачи по линейной алгебре и уроку V.1. Числа «ручные»: небольшие целые, ответ без длинной арифметики.
import { rng } from "../../math/rng";
import type { Generator } from "../types";

const pm = (rows: number[][]) => String.raw`\begin{pmatrix}${rows.map((r) => r.join(" & ")).join(String.raw` \\ `)}\end{pmatrix}`;
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
