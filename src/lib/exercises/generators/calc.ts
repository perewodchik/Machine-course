// Параметрические задачи модуля II «Анализ и оптимизация». Многочлены с целыми коэффициентами: ответ считается
// без калькулятора. Запись многочлена — «3x^2 y - 2xy + x»; тесты разбирают её и сверяют ответ с численной производной.
import { rng } from "../../math/rng";
import type { Generator } from "../types";

const pm = (rows: number[][]) => String.raw`\begin{pmatrix}${rows.map((r) => r.join(" & ")).join(String.raw` \\ `)}\end{pmatrix}`;
const par = (x: number) => (x < 0 ? `(${x})` : String(x));

/** Многочлен из слагаемых [коэффициент, моном]: «3x^2 y - xy^2 + 2x»; нулевые слагаемые пропускаются. */
export function poly(terms: readonly (readonly [number, string])[]): string {
  let out = "";
  for (const [c, m] of terms) {
    if (c === 0) continue;
    const abs = Math.abs(c);
    const coef = abs === 1 && m ? "" : String(abs);
    out += out ? (c < 0 ? " - " : " + ") : c < 0 ? "-" : "";
    out += coef + m;
  }
  return out || "0";
}

/** Подстановка в точку: «4 · 2 · (−1) + (−2) · (−1)^2», нулевые слагаемые пропускаются. */
const subst = (parts: readonly (readonly [number, string])[]) =>
  parts
    .filter(([c]) => c !== 0)
    .map(([c, tail]) => `${par(c)}${tail}`)
    .join(" + ") || "0";

/** Урок II.1: частная производная многочлена двух переменных в точке. */
export const partial: Generator = {
  id: "calc.partial",
  version: 1,
  title: "Частная производная",
  make(seed) {
    const r = rng(seed);
    const [a, b, c, d] = [r.pick([1, 2, 3]), r.nonzero(-2, 2), r.int(-3, 3), r.int(-3, 3)];
    const [x, y] = [r.nonzero(-2, 2), r.nonzero(-2, 2)];
    const byX = seed % 2 === 1;
    const fx = 2 * a * x * y + b * y * y + c;
    const fy = a * x * x + 2 * b * x * y + d;
    const tex = poly([[a, "x^2 y"], [b, "x y^2"], [c, "x"], [d, "y"]]);
    const v = byX ? "x" : "y";
    return {
      kind: "numeric",
      prompt: String.raw`$f(x, y) = ${tex}$. Найдите $\dfrac{\partial f}{\partial ${v}}$ в точке $(${x}, ${y})$.`,
      label: String.raw`$\dfrac{\partial f}{\partial ${v}}(${x}, ${y}) =$`,
      answer: byX ? fx : fy,
      tol: 0,
      hints: [String.raw`Считайте ${byX ? "$y$" : "$x$"} постоянной и дифференцируйте по $${v}$, как функцию одной переменной.`],
      right: byX
        ? String.raw`$\dfrac{\partial f}{\partial x} = ${poly([[2 * a, "xy"], [b, "y^2"], [c, ""]])}$; в точке: $${subst([[2 * a, String.raw` \cdot ${par(x)} \cdot ${par(y)}`], [b, String.raw` \cdot ${par(y)}^2`], [c, ""]])} = ${fx}$.`
        : String.raw`$\dfrac{\partial f}{\partial y} = ${poly([[a, "x^2"], [2 * b, "xy"], [d, ""]])}$; в точке: $${subst([[a, String.raw` \cdot ${par(x)}^2`], [2 * b, String.raw` \cdot ${par(x)} \cdot ${par(y)}`], [d, ""]])} = ${fy}$.`,
      wrong: byX
        ? String.raw`При дифференцировании по $x$ множитель $y$ — константа: $(x^2 y)'_x = 2xy$, а слагаемое $${poly([[d, "y"]])}$ без $x$ даёт ноль.`
        : String.raw`При дифференцировании по $y$ множитель $x$ — константа: $(x y^2)'_y = 2xy$, а слагаемое $${poly([[c, "x"]])}$ без $y$ даёт ноль.`,
    };
  },
};

/** Урок II.1: градиент квадратичного многочлена в точке — столбец частных производных. */
export const gradientPoint: Generator = {
  id: "calc.gradient-point",
  version: 1,
  title: "Градиент в точке",
  make(seed) {
    const r = rng(seed);
    const [a, b, c, d, e] = [r.nonzero(-2, 3), r.nonzero(-3, 3), r.nonzero(-2, 3), r.int(-4, 4), r.int(-4, 4)];
    const [x, y] = [r.nonzero(-2, 2), r.nonzero(-2, 2)];
    const g = [2 * a * x + b * y + d, b * x + 2 * c * y + e];
    const tex = poly([[a, "x_1^2"], [b, "x_1 x_2"], [c, "x_2^2"], [d, "x_1"], [e, "x_2"]]);
    return {
      kind: "matrix",
      prompt: String.raw`$f(x) = ${tex}$. Найдите градиент $\nabla f$ в точке $x = (${x}, ${y})$.`,
      label: String.raw`$\nabla f =$`,
      answer: g.map((v) => [v]),
      tol: 0,
      hints: [String.raw`$\nabla f = \begin{pmatrix} \partial f / \partial x_1 \\ \partial f / \partial x_2 \end{pmatrix}$ — столбец, как и $x$.`, String.raw`$\dfrac{\partial f}{\partial x_1} = ${poly([[2 * a, "x_1"], [b, "x_2"], [d, ""]])}$.`],
      right: String.raw`$\nabla f = \begin{pmatrix} ${poly([[2 * a, "x_1"], [b, "x_2"], [d, ""]])} \\ ${poly([[b, "x_1"], [2 * c, "x_2"], [e, ""]])} \end{pmatrix} = ${pm(g.map((v) => [v]))}$.`,
      wrong: String.raw`Слагаемое $${poly([[b, "x_1 x_2"]])}$ даёт вклад в обе частные производные: $${b}x_2$ в первую и $${b}x_1$ во вторую.`,
    };
  },
};

const DIRS: readonly [number, number][] = [[3, 4], [4, 3], [-3, 4], [4, -3], [0, 5], [-5, 0], [-4, -3]];

/** Урок II.1: производная по направлению D_u f = ∇fᵀu и наибольшая скорость роста ‖∇f‖. */
export const directional: Generator = {
  id: "calc.directional",
  version: 1,
  title: "Производная по направлению",
  make(seed) {
    const r = rng(seed);
    if (seed % 3 === 0) {
      const [p, q] = r.pick([[3, 4], [6, 8], [5, 12], [-3, 4], [8, -6]] as const);
      const n = Math.hypot(p, q);
      return {
        kind: "numeric",
        prompt: String.raw`В точке $x_0$ градиент функции равен $\nabla f(x_0) = (${p}, ${q})$. С какой наибольшей скоростью растёт $f$, если выйти из $x_0$ в направлении единичного вектора?`,
        label: String.raw`$\max_{\lVert u \rVert = 1} D_u f =$`,
        answer: n,
        tol: 0,
        hints: [String.raw`$D_u f = \nabla f^\top u = \lVert \nabla f \rVert \cos \alpha$ (урок I.2). Когда косинус наибольший?`],
        right: String.raw`При $u = \nabla f / \lVert \nabla f \rVert$: $D_u f = \lVert \nabla f \rVert = \sqrt{${p * p} + ${q * q}} = ${n}$.`,
        wrong: String.raw`Наибольший рост — вдоль самого градиента, и он равен его длине: $\sqrt{${p}^2 + ${par(q)}^2} = ${n}$.`,
      };
    }
    const [g1, g2] = [r.nonzero(-4, 4), r.nonzero(-4, 4)];
    const [p, q] = r.pick(DIRS);
    const ans = (g1 * p + g2 * q) / 5;
    const u = `(${p / 5}, ${q / 5})`;
    return {
      kind: "numeric",
      prompt: String.raw`$\nabla f(x_0) = (${g1}, ${g2})$. Найдите производную $f$ в точке $x_0$ по направлению $u = ${u}$.`,
      label: String.raw`$D_u f(x_0) =$`,
      answer: ans,
      tol: 1e-9,
      hints: [String.raw`$D_u f = \nabla f(x_0)^\top u$ — скалярное произведение.`],
      right: String.raw`$D_u f = ${g1} \cdot ${par(p / 5)} + ${par(g2)} \cdot ${par(q / 5)} = ${ans}$.`,
      wrong: String.raw`Умножьте покоординатно и сложите: $${g1} \cdot ${par(p / 5)} + ${par(g2)} \cdot ${par(q / 5)}$. Вектор $u$ уже единичный, делить на его длину не нужно.`,
    };
  },
};

/** Урок II.1: критическая точка ∇f = 0 у f = ax² + by² + dx + ey; при разных знаках a, b — седло. */
export const criticalPoint: Generator = {
  id: "calc.critical-point",
  version: 1,
  title: "Критическая точка",
  make(seed) {
    const r = rng(seed);
    const [a, b] = [r.pick([1, 2, 3]), r.pick([1, 2, -1, -2])];
    const [p, q] = [r.int(-3, 3), r.nonzero(-3, 3)];
    const [d, e] = [-2 * a * p, -2 * b * q];
    const tex = poly([[a, "x_1^2"], [b, "x_2^2"], [d, "x_1"], [e, "x_2"]]);
    return {
      kind: "matrix",
      prompt: String.raw`Найдите критическую точку функции $f(x) = ${tex}$ — точку, где $\nabla f = 0$.`,
      label: String.raw`$x^\star =$`,
      answer: [[p], [q]],
      tol: 0,
      hints: [String.raw`$\nabla f = \begin{pmatrix} ${poly([[2 * a, "x_1"], [d, ""]])} \\ ${poly([[2 * b, "x_2"], [e, ""]])} \end{pmatrix}$. Приравняйте каждую координату нулю.`],
      right: String.raw`$${poly([[2 * a, "x_1"], [d, ""]])} = 0$ и $${poly([[2 * b, "x_2"], [e, ""]])} = 0$ дают $x^\star = (${p}, ${q})$.${b < 0 ? " Коэффициенты при квадратах разных знаков — это седло, а не минимум (урок II.4)." : ""}`,
      wrong: String.raw`Решите два уравнения отдельно: $\partial f / \partial x_1 = ${poly([[2 * a, "x_1"], [d, ""]])} = 0$ и $\partial f / \partial x_2 = ${poly([[2 * b, "x_2"], [e, ""]])} = 0$.`,
    };
  },
};

/** Урок II.2: якобиан отображения ℝ² → ℝ² в точке: строка i — градиент i-й координаты, транспонированный. */
export const jacobian: Generator = {
  id: "calc.jacobian",
  version: 1,
  title: "Якобиан в точке",
  make(seed) {
    const r = rng(seed);
    const [a, b, c, d] = [r.nonzero(-2, 3), r.nonzero(-3, 3), r.nonzero(-2, 2), r.int(-3, 3)];
    const [x, y] = [r.nonzero(-2, 2), r.nonzero(-2, 2)];
    // f₁ = a x² + b y, f₂ = c x y + d x
    const J = [[2 * a * x, b], [c * y + d, c * x]];
    return {
      kind: "matrix",
      prompt: String.raw`$f(x, y) = \begin{pmatrix} ${poly([[a, "x^2"], [b, "y"]])} \\ ${poly([[c, "xy"], [d, "x"]])} \end{pmatrix}$. Найдите якобиан $J_f$ в точке $(${x}, ${y})$.`,
      label: String.raw`$J_f =$`,
      answer: J,
      tol: 0,
      hints: [String.raw`Строка $i$ — частные производные $i$-й координаты: $J_f = \begin{pmatrix} \partial f_1 / \partial x & \partial f_1 / \partial y \\ \partial f_2 / \partial x & \partial f_2 / \partial y \end{pmatrix}$.`],
      right: String.raw`$J_f = \begin{pmatrix} ${poly([[2 * a, "x"]])} & ${b} \\ ${poly([[c, "y"], [d, ""]])} & ${poly([[c, "x"]])} \end{pmatrix} = ${pm(J)}$.`,
      wrong: String.raw`Строки — координаты $f$, столбцы — переменные. Если ответ получился транспонированным, переставьте: $J_{12} = \partial f_1 / \partial y = ${b}$.`,
    };
  },
};

/** Урок II.2: порядок и размерности якобианов композиции g ∘ f: J = J_g J_f, внешняя функция слева. */
export const jacobianOrder: Generator = {
  id: "calc.jacobian-order",
  version: 1,
  title: "Якобиан композиции",
  make(seed) {
    const r = rng(seed);
    const [n, m, k] = r.shuffle([2, 3, 4, 5]).slice(0, 3) as [number, number, number];
    return {
      kind: "choice",
      prompt: String.raw`$f: \mathbb{R}^{${n}} \to \mathbb{R}^{${m}}$, $g: \mathbb{R}^{${m}} \to \mathbb{R}^{${k}}$. Чему равен якобиан композиции $h(x) = g(f(x))$?`,
      options: r.shuffle([
        { text: String.raw`$J_h = J_g J_f$, матрица $${k} \times ${n}$`, correct: true, why: String.raw`Малый сдвиг $dx$ даёт $df = J_f dx$, а он — $dh = J_g\, df = J_g J_f\, dx$. Размеры: $(${k} \times ${m})(${m} \times ${n}) = ${k} \times ${n}$.` },
        { text: String.raw`$J_h = J_f J_g$`, why: String.raw`Порядок как у композиции: сначала действует $f$, поэтому $J_f$ стоит справа. Здесь $(${m} \times ${n})(${k} \times ${m})$ ещё и не перемножается.` },
        { text: String.raw`$J_h = J_g^\top J_f$, матрица $${m} \times ${n}$`, why: String.raw`Транспонирование нужно для градиента скалярной функции, $\nabla h = J_f^\top \nabla g$, а не для якобиана. У $J_h$ строк столько, сколько выходов у $h$: $${k}$.` },
      ]),
      hints: [String.raw`Якобиан $h: \mathbb{R}^{${n}} \to \mathbb{R}^{${k}}$ — матрица $${k} \times ${n}$. Какое произведение даёт такой размер?`],
    };
  },
};

/** Урок II.2: обратный проход для L = (θᵀx − y)²: ∂L/∂θⱼ = 2(θᵀx − y) xⱼ. */
export const backprop: Generator = {
  id: "calc.backprop",
  version: 1,
  title: "Обратный проход",
  make(seed) {
    const r = rng(seed);
    const theta = [r.nonzero(-2, 2), r.nonzero(-2, 2)];
    const x = [r.nonzero(-3, 3), r.nonzero(-3, 3)];
    const y = r.int(-4, 4);
    const s = theta[0]! * x[0]! + theta[1]! * x[1]!;
    const res = s - y;
    const j = seed % 2 === 1 ? 0 : 1;
    const ans = 2 * res * x[j]! + 0;
    return {
      kind: "numeric",
      prompt: String.raw`$L = (\theta^\top x - y)^2$, $\theta = (${theta.join(", ")})$, $x = (${x.join(", ")})$, $y = ${y}$. Найдите $\partial L / \partial \theta_${j + 1}$ обратным проходом.`,
      label: String.raw`$\dfrac{\partial L}{\partial \theta_${j + 1}} =$`,
      answer: ans,
      tol: 0,
      hints: [String.raw`Прямой проход: $s = \theta^\top x$, $r = s - y$, $L = r^2$.`, String.raw`Обратный: $\partial L / \partial r = 2r$, $\partial L / \partial s = 2r$, $\partial L / \partial \theta_${j + 1} = 2r \cdot x_${j + 1}$.`],
      right: String.raw`$s = ${s}$, $r = ${res}$; $\dfrac{\partial L}{\partial \theta_${j + 1}} = 2r\, x_${j + 1} = 2 \cdot ${par(res)} \cdot ${par(x[j]!)} = ${ans}$.`,
      wrong: String.raw`Не забудьте множитель от внешней функции: $\partial L / \partial r = 2r = ${2 * res}$, и только потом умножайте на $\partial s / \partial \theta_${j + 1} = x_${j + 1} = ${x[j]}$.`,
    };
  },
};

/** Урок II.3: градиент f(x) = xᵀAx + bᵀx с несимметричной A — (A + Aᵀ)x + b, а не 2Ax + b. */
export const matrixGrad: Generator = {
  id: "calc.matrix-grad",
  version: 1,
  title: "Градиент квадратичной функции",
  make(seed) {
    const r = rng(seed);
    for (;;) {
      const A = [[r.int(-2, 3), r.int(-3, 3)], [r.int(-3, 3), r.int(-2, 3)]];
      if (A[0]![1] === A[1]![0]) continue; // несимметричная — иначе ловушка 2Ax не видна
      const b = [r.int(-3, 3), r.int(-3, 3)];
      const x = [r.nonzero(-2, 2), r.nonzero(-2, 2)];
      const S = [[2 * A[0]![0]!, A[0]![1]! + A[1]![0]!], [A[0]![1]! + A[1]![0]!, 2 * A[1]![1]!]];
      const g = S.map((row, i) => row[0]! * x[0]! + row[1]! * x[1]! + b[i]!);
      const col = (w: readonly number[]) => pm(w.map((v) => [v]));
      return {
        kind: "matrix",
        prompt: String.raw`$f(x) = x^\top A x + b^\top x$, $$A = ${pm(A)}, \quad b = ${col(b)}, \quad x = ${col(x)}.$$ Найдите $\nabla f(x)$.`,
        label: String.raw`$\nabla f =$`,
        answer: g.map((v) => [v]),
        tol: 0,
        hints: [String.raw`$\nabla_x\, x^\top A x = (A + A^\top)x$, $\nabla_x\, b^\top x = b$.`, String.raw`$A + A^\top = ${pm(S)}$.`],
        right: String.raw`$\nabla f = (A + A^\top)x + b = ${pm(S)} ${col(x)} + ${col(b)} = ${col(g)}$.`,
        wrong: String.raw`Матрица $A$ несимметрична, поэтому $2Ax$ не подходит: $\nabla_x\, x^\top A x = (A + A^\top)x$. Не забудьте прибавить $b$.`,
      };
    }
  },
};

/** Урок II.4: гессиан многочлена в точке — симметричная матрица вторых производных. */
export const hessian: Generator = {
  id: "calc.hessian",
  version: 1,
  title: "Гессиан в точке",
  make(seed) {
    const r = rng(seed);
    const [a, b, c, d] = [r.nonzero(-2, 2), r.nonzero(-2, 2), r.int(-2, 2), r.nonzero(-3, 3)];
    const [x, y] = [r.nonzero(-2, 2), r.nonzero(-2, 2)];
    // f = a x³ + b x² y + c x y² + d y²
    const hxx = 6 * a * x + 2 * b * y;
    const hxy = 2 * b * x + 2 * c * y;
    const hyy = 2 * c * x + 2 * d;
    const H = [[hxx, hxy], [hxy, hyy]];
    return {
      kind: "matrix",
      prompt: String.raw`$f(x, y) = ${poly([[a, "x^3"], [b, "x^2 y"], [c, "x y^2"], [d, "y^2"]])}$. Найдите гессиан $H$ в точке $(${x}, ${y})$.`,
      label: String.raw`$H =$`,
      answer: H,
      tol: 0,
      hints: [String.raw`$H = \begin{pmatrix} f_{xx} & f_{xy} \\ f_{yx} & f_{yy} \end{pmatrix}$; смешанные производные равны: $f_{xy} = f_{yx}$.`, String.raw`$f_{xx} = ${poly([[6 * a, "x"], [2 * b, "y"]])}$.`],
      right: String.raw`$f_{xx} = ${poly([[6 * a, "x"], [2 * b, "y"]])} = ${hxx}$, $f_{xy} = ${poly([[2 * b, "x"], [2 * c, "y"]])} = ${hxy}$, $f_{yy} = ${poly([[2 * c, "x"], [2 * d, ""]])} = ${hyy}$: $H = ${pm(H)}$.`,
      wrong: String.raw`Продифференцируйте дважды: $f_{xy}$ — сначала по $x$, потом по $y$. Гессиан симметричен, поэтому внедиагональные элементы одинаковы.`,
    };
  },
};

type CpKind = "min" | "max" | "saddle" | "degenerate";

/** Урок II.4: тип критической точки по гессиану 2 × 2 — по знакам det H и tr H. */
export const classifyPoint: Generator = {
  id: "calc.classify",
  version: 1,
  title: "Тип критической точки",
  make(seed) {
    const r = rng(seed);
    const kind = (["min", "saddle", "max", "degenerate"] as const)[(seed - 1) % 4]!;
    let H: number[];
    for (;;) {
      if (kind === "degenerate") {
        const [p, q, s] = [r.nonzero(-2, 2), r.nonzero(-2, 2), r.pick([1, -1])];
        H = [s * p * p, s * p * q, s * q * q];
      } else H = [r.nonzero(-4, 4), r.nonzero(-3, 3), r.nonzero(-4, 4)];
      const d = H[0]! * H[2]! - H[1]! ** 2;
      const t = H[0]! + H[2]!;
      const k: CpKind = d === 0 ? "degenerate" : d < 0 ? "saddle" : t > 0 ? "min" : "max";
      if (k === kind) break;
    }
    const [a, b, c] = H as [number, number, number];
    const d = a * c - b * b;
    const t = a + c;
    const facts = String.raw`$\det H = ${d}$, $\operatorname{tr} H = ${t}$`;
    const why: Record<CpKind, string> = {
      min: String.raw`${facts}: собственные значения одного знака, сумма положительна — оба $> 0$, $H \succ 0$. Это минимум.`,
      max: String.raw`${facts}: собственные значения одного знака, сумма отрицательна — оба $< 0$, $H \prec 0$. Это максимум.`,
      saddle: String.raw`${facts}: произведение собственных значений отрицательно — они разных знаков. Это седло.`,
      degenerate: String.raw`${facts}: одно собственное значение — ноль. Вдоль его направления решают члены выше второго порядка, гессиан ответа не даёт.`,
    };
    const names: Record<CpKind, string> = { min: "Минимум", max: "Максимум", saddle: "Седло", degenerate: "По гессиану не определить" };
    return {
      kind: "choice",
      prompt: String.raw`В точке $x^\star$ градиент равен нулю, а гессиан $$H = ${pm([[a, b], [b, c]])}.$$ Что это за точка?`,
      options: (["min", "max", "saddle", "degenerate"] as const).map((k) => ({ text: names[k], correct: k === kind, why: why[kind] })),
      hints: [String.raw`$\lambda_1 \lambda_2 = \det H$, $\lambda_1 + \lambda_2 = \operatorname{tr} H$ (урок I.10).`],
    };
  },
};

type ConvexKind = "pd" | "psd" | "indefinite" | "nd";

/** Урок II.5: выпукла ли f(x) = ½ xᵀAx + bᵀx — критерий второго порядка, H = A во всех точках. */
export const convexForm: Generator = {
  id: "calc.convex-form",
  version: 1,
  title: "Выпукла ли квадратичная функция",
  make(seed) {
    const r = rng(seed);
    const kind = (["pd", "indefinite", "psd", "nd"] as const)[(seed - 1) % 4]!;
    let A: [number, number, number];
    for (;;) {
      if (kind === "psd") {
        const [p, q] = [r.nonzero(-2, 2), r.int(-2, 2)];
        A = [p * p, p * q, q * q];
      } else A = [r.nonzero(-4, 4), r.int(-3, 3), r.nonzero(-4, 4)];
      const d = A[0] * A[2] - A[1] ** 2;
      const t = A[0] + A[2];
      const k: ConvexKind = d < 0 ? "indefinite" : d === 0 ? (t > 0 ? "psd" : "nd") : t > 0 ? "pd" : "nd";
      if (k === kind) break;
    }
    const [a, b, c] = A;
    const [b1, b2] = [r.int(-3, 3), r.int(-3, 3)];
    const d = a * c - b * b;
    const t = a + c;
    const facts = String.raw`$H = A$ во всех точках, $\det A = ${d}$, $\operatorname{tr} A = ${t}$`;
    const convex = kind === "pd" || kind === "psd";
    const why: Record<ConvexKind, string> = {
      pd: String.raw`${facts}: оба собственных значения положительны, $A \succ 0$ — функция выпукла, и даже строго.`,
      psd: String.raw`${facts}: собственные значения $${t}$ и $0$, $A \succeq 0$ — функция выпукла. Строгой выпуклости нет: вдоль собственного вектора с $\lambda = 0$ функция линейна.`,
      indefinite: String.raw`${facts}: собственные значения разных знаков. Вдоль собственного вектора с $\lambda < 0$ функция — перевёрнутая парабола, хорда там ниже графика.`,
      nd: String.raw`${facts}: собственные значения не положительны, и хотя бы одно отрицательно — вдоль его вектора функция вогнута, не выпукла.`,
    };
    return {
      kind: "choice",
      prompt: String.raw`$f(x) = \tfrac12 x^\top A x + b^\top x$, где $$A = ${pm([[a, b], [b, c]])}, \quad b = ${pm([[b1], [b2]])}.$$ Выпукла ли $f$ на $\mathbb{R}^2$?`,
      options: [
        { text: "Выпукла", correct: convex, why: why[kind] },
        { text: "Не выпукла", correct: !convex, why: why[kind] },
        { text: "Зависит от точки: надо проверить гессиан в каждой", correct: false, why: String.raw`У квадратичной функции гессиан один и тот же во всех точках — $A$. ${why[kind]}` },
      ],
      hints: [String.raw`Гессиан $\tfrac12 x^\top A x + b^\top x$ равен $A$ (урок II.4); выпуклость — $A \succeq 0$. Для $2 \times 2$: $\det A \ge 0$ и $\operatorname{tr} A \ge 0$.`],
    };
  },
};

const OPS: readonly { tex: string; convex: boolean; why: string }[] = [
  { tex: String.raw`\log\bigl(1 + e^{\theta^\top x}\bigr) - y\, \theta^\top x`, convex: true, why: String.raw`$\log(1 + e^{z})$ выпукла ($g(z)(1 - g(z)) > 0$), $z = \theta^\top x$ — аффинная функция $\theta$, а $-y\,\theta^\top x$ линейна. Это логистическая потеря.` },
  { tex: String.raw`\lVert X\theta - y \rVert^2 + \lambda \lVert \theta \rVert^2, \ \lambda > 0`, convex: true, why: String.raw`Квадрат нормы выпукл, $X\theta - y$ — аффинная функция $\theta$; сумма выпуклых с неотрицательными весами выпукла. Это гребневая регрессия.` },
  { tex: String.raw`\max\bigl(0,\ 1 - y\, \theta^\top x\bigr)`, convex: true, why: String.raw`Максимум двух аффинных функций $\theta$ выпукл. Это шарнирная потеря SVM.` },
  { tex: String.raw`e^{\theta^\top x}`, convex: true, why: String.raw`$e^{z}$ выпукла, $z = \theta^\top x$ — аффинная функция $\theta$: композиция с аффинной функцией сохраняет выпуклость.` },
  { tex: String.raw`\lVert \theta \rVert_1 + \lVert \theta \rVert^2`, convex: true, why: String.raw`Любая норма выпукла (неравенство треугольника), сумма выпуклых выпукла.` },
  { tex: String.raw`\sin(\theta^\top x)`, convex: false, why: String.raw`$\sin z$ не выпукл: при $z \in (0, \pi)$ вторая производная $-\sin z < 0$. Аффинная подстановка выпуклости не добавляет.` },
  { tex: String.raw`-\lVert \theta \rVert^2`, convex: false, why: String.raw`Гессиан $-2I \prec 0$: функция вогнута. Умножение на отрицательное число выпуклость не сохраняет.` },
  { tex: String.raw`(\theta^\top x)^3`, convex: false, why: String.raw`$z^3$ не выпукла на всей прямой: $6z < 0$ при $z < 0$.` },
  { tex: String.raw`\log(\theta^\top x), \ \theta^\top x > 0`, convex: false, why: String.raw`$\log z$ вогнута: $-1/z^2 < 0$. Выпукла $-\log z$.` },
];

/** Урок II.5: выпукла ли функция потерь — по операциям, сохраняющим выпуклость. */
export const convexOps: Generator = {
  id: "calc.convex-ops",
  version: 1,
  title: "Выпукла ли функция по θ",
  make(seed) {
    const r = rng(seed);
    // чередуем выпуклые и невыпуклые, внутри — случайная заготовка
    const pool = OPS.filter((o) => o.convex === (seed % 2 === 1));
    const op = r.pick(pool);
    return {
      kind: "choice",
      prompt: String.raw`Выпукла ли по $\theta$ функция $$${op.tex}?$$`,
      options: [
        { text: "Выпукла", correct: op.convex, why: op.why },
        { text: "Не выпукла", correct: !op.convex, why: op.why },
      ],
      hints: [String.raw`Выпуклость сохраняют неотрицательные суммы, композиция с аффинной функцией и максимум. Начните с одномерной функции от $z = \theta^\top x$.`],
    };
  },
};
