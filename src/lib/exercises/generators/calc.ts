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

/** Урок II.6: один шаг градиентного спуска или подъёма. Нечётный seed — спуск к минимуму, чётный — подъём. */
export const gdStep: Generator = {
  id: "calc.gd-step",
  version: 1,
  title: "Шаг градиентного спуска",
  make(seed) {
    const r = rng(seed);
    const ascent = seed % 2 === 0;
    const s = ascent ? -1 : 1;
    // спуск — на выпуклой чаше, подъём — на перевёрнутой: знак коэффициентов при квадратах
    const [a, c] = [s * r.int(1, 3), s * r.int(1, 3)];
    const [d, e] = [r.int(-4, 4), r.int(-4, 4)];
    const [x, y] = [r.nonzero(-2, 2), r.nonzero(-2, 2)];
    // шаг без перескока: множитель 1 − 2|a|η вдоль каждой оси не меньше нуля
    const eta = r.pick([0.1, 0.25, 0.5].filter((h) => 2 * h * Math.max(Math.abs(a), Math.abs(c)) <= 1));
    const g = [2 * a * x + d, 2 * c * y + e];
    const next = [x - s * eta * g[0]!, y - s * eta * g[1]!].map((v) => Math.round(v * 1000) / 1000);
    const tex = poly([[a, "\\theta_1^2"], [c, "\\theta_2^2"], [d, "\\theta_1"], [e, "\\theta_2"]]);
    const goal = ascent ? "максимизируем" : "минимизируем";
    const rule = ascent ? String.raw`\theta + \eta \nabla f` : String.raw`\theta - \eta \nabla f`;
    return {
      kind: "matrix",
      prompt: String.raw`${ascent ? "Градиентный подъём" : "Градиентный спуск"}: ${goal} $f(\theta) = ${tex}$. Шаг $\eta = ${eta}$, сейчас $\theta = (${x}, ${y})$. Найдите $\theta$ после одного шага.`,
      label: String.raw`$\theta :=$`,
      answer: next.map((v) => [v]),
      tol: 0.005,
      hints: [String.raw`$\nabla f = \begin{pmatrix} ${poly([[2 * a, "\\theta_1"], [d, ""]])} \\ ${poly([[2 * c, "\\theta_2"], [e, ""]])} \end{pmatrix}$; в точке $\theta$ это $${pm(g.map((v) => [v]))}$.`, String.raw`${ascent ? "Подъём" : "Спуск"}: $\theta := ${rule}$.`],
      right: String.raw`$\nabla f = ${pm(g.map((v) => [v]))}$, $\theta := ${rule} = ${pm(next.map((v) => [v]))}$.`,
      wrong: ascent
        ? String.raw`При подъёме шаг идёт по градиенту: $\theta + \eta \nabla f$. Со знаком минус $f$ уменьшилась бы.`
        : String.raw`При спуске шаг идёт против градиента: $\theta - \eta \nabla f$. Со знаком плюс $f$ выросла бы.`,
    };
  },
};

// симметричные 2 × 2 с целыми собственными значениями λ_max > λ_min > 0: порог 2/λ_max считается в уме
const SPD: readonly (readonly [number, number, number, number])[] = [
  [2, 1, 2, 3],
  [3, 1, 3, 4],
  [5, 2, 2, 6],
  [2, 2, 5, 6],
  [3, 2, 3, 5],
  [6, 2, 3, 7],
  [7, 2, 4, 8],
  [4, 0, 1, 4],
  [1, 0, 5, 5],
];

/** Урок II.6: наибольший сходящийся шаг 2/λ_max для f = ½ θᵀAθ. */
export const lrThreshold: Generator = {
  id: "calc.lr-threshold",
  version: 1,
  title: "Порог шага",
  make(seed) {
    const r = rng(seed);
    const [a, b0, c, l1] = r.pick(SPD);
    const b = b0 * r.pick([1, -1]);
    const l2 = a + c - l1;
    const answer = Math.round((2 / l1) * 10000) / 10000;
    return {
      kind: "numeric",
      prompt: String.raw`Градиентный спуск на $f(\theta) = \tfrac12 \theta^\top A \theta$ с $$A = ${pm([[a, b], [b, c]])}.$$ При каких $\eta$ он сходится из любой точки? Введите границу.`,
      label: String.raw`$\eta <$`,
      answer,
      tol: 0.005,
      hints: [String.raw`Шаг $\theta := (I - \eta A)\theta$ умножает координату вдоль собственного вектора на $1 - \eta\lambda$. Нужно $\lvert 1 - \eta \lambda \rvert < 1$ для обоих $\lambda$.`, String.raw`$\lambda_1 + \lambda_2 = \operatorname{tr} A = ${a + c}$, $\lambda_1 \lambda_2 = \det A = ${a * c - b * b}$.`],
      right: String.raw`Собственные значения $${l1}$ и $${l2}$; порог задаёт большее: $\eta < 2/\lambda_{\max} = 2/${l1} \approx ${answer}$.`,
      wrong: String.raw`Порог задаёт наибольшее собственное значение, а не элементы матрицы: $\lambda_{\max} = ${l1}$, $\eta < 2/${l1}$.`,
    };
  },
};

/** Урок II.7: один шаг метода Ньютона для функции одной переменной: θ := θ − f′(θ)/f″(θ). */
export const newton1d: Generator = {
  id: "calc.newton-1d",
  version: 1,
  title: "Шаг Ньютона",
  make(seed) {
    const r = rng(seed);
    let p: number, q: number, s: number, t: number, d1: number, d2: number;
    for (;;) {
      [p, q, s, t] = [r.int(-1, 1), r.int(1, 3), r.int(-6, 6), r.nonzero(-2, 2)];
      d1 = 3 * p * t * t + 2 * q * t + s;
      d2 = 6 * p * t + 2 * q;
      if (d2 > 0 && d1 !== 0) break;
    }
    const answer = Math.round((t - d1 / d2) * 1000) / 1000;
    const tex = poly([[p, "\\theta^3"], [q, "\\theta^2"], [s, "\\theta"]]);
    return {
      kind: "numeric",
      prompt: String.raw`Минимизируем $f(\theta) = ${tex}$ методом Ньютона. Сейчас $\theta = ${t}$. Найдите $\theta$ после одного шага.`,
      label: String.raw`$\theta :=$`,
      answer,
      tol: 0.005,
      hints: [String.raw`Ньютон ищет ноль $f'$: $\theta := \theta - f'(\theta) / f''(\theta)$.`, String.raw`$f'(\theta) = ${poly([[3 * p, "\\theta^2"], [2 * q, "\\theta"], [s, ""]])}$, $f''(\theta) = ${poly([[6 * p, "\\theta"], [2 * q, ""]])}$.`],
      right: String.raw`$f'(${t}) = ${d1}$, $f''(${t}) = ${d2}$, $\theta := ${t} - ${d1 < 0 ? `(${d1})` : d1}/${d2} \approx ${answer}$.`,
      wrong: String.raw`Шаг Ньютона — $\theta - f'/f''$: делим первую производную на вторую и вычитаем. Здесь $f'(${t}) = ${d1}$, $f''(${t}) = ${d2}$.`,
    };
  },
};

/** Урок II.7 (к V.2): первый шаг Ньютона для логистической регрессии с одним признаком из θ = 0. */
export const newtonLogistic: Generator = {
  id: "calc.newton-logistic",
  version: 1,
  title: "Шаг Ньютона для логистической регрессии",
  make(seed) {
    const r = rng(seed);
    let xs: number[], ys: number[], num: number, den: number;
    for (;;) {
      xs = [r.nonzero(-3, 3), r.nonzero(-3, 3), r.nonzero(-3, 3), r.nonzero(-3, 3)];
      ys = xs.map(() => r.pick([0, 1]));
      // ℓ′(0) = Σ (½ − yᵢ) xᵢ, ℓ″(0) = ¼ Σ xᵢ²
      num = xs.reduce((a, x, i) => a + (0.5 - ys[i]!) * x, 0);
      den = 0.25 * xs.reduce((a, x) => a + x * x, 0);
      if (num !== 0 && ys.some((y) => y === 0) && ys.some((y) => y === 1)) break;
    }
    const answer = Math.round((-num / den) * 1000) / 1000;
    const rows = xs.map((x, i) => `(${x}, ${ys[i]})`).join(", ");
    return {
      kind: "numeric",
      prompt: String.raw`Логистическая регрессия с одним признаком без свободного члена: $p(y = 1 \mid x) = g(\theta x)$. Объекты $(x^{(i)}, y^{(i)})$: ${rows}. Начинаем с $\theta = 0$. Найдите $\theta$ после одного шага Ньютона для потерь $\ell(\theta) = -\sum_i \log p(y^{(i)} \mid x^{(i)})$.`,
      label: String.raw`$\theta :=$`,
      answer,
      tol: 0.005,
      hints: [
        String.raw`$\ell'(\theta) = \sum_i \bigl(g(\theta x^{(i)}) - y^{(i)}\bigr) x^{(i)}$, $\ell''(\theta) = \sum_i g(1 - g)\, (x^{(i)})^2$.`,
        String.raw`При $\theta = 0$: $g(0) = \tfrac12$, $g(1 - g) = \tfrac14$.`,
      ],
      right: String.raw`$\ell'(0) = \sum_i (\tfrac12 - y^{(i)}) x^{(i)} = ${num}$, $\ell''(0) = \tfrac14 \sum_i (x^{(i)})^2 = ${den}$, $\theta := 0 - ${num < 0 ? `(${num})` : num}/${den} \approx ${answer}$.`,
      wrong: String.raw`Шаг $\theta := \theta - \ell'(\theta)/\ell''(\theta)$; при $\theta = 0$ все $g = \tfrac12$, поэтому $\ell'(0) = ${num}$ и $\ell''(0) = ${den}$.`,
    };
  },
};

/** Урок II.8: минимум a x₁² + c x₂² на прямой p x₁ + q x₂ = r через лагранжиан. */
export const lagrangeLine: Generator = {
  id: "calc.lagrange-line",
  version: 1,
  title: "Минимум на прямой",
  make(seed) {
    const r = rng(seed);
    const [a, c] = [r.int(1, 3), r.int(1, 3)];
    const [p, q] = [r.nonzero(-2, 2), r.nonzero(-2, 2)];
    const rhs = r.nonzero(-4, 4);
    // 2a x₁ = λp, 2c x₂ = λq ⇒ x₁ = λp/(2a), x₂ = λq/(2c); ограничение: λ (p²/(2a) + q²/(2c)) = r
    const lam = rhs / (p * p / (2 * a) + (q * q) / (2 * c));
    const x = [(lam * p) / (2 * a), (lam * q) / (2 * c)].map((v) => Math.round(v * 1000) / 1000);
    const f = poly([[a, "x_1^2"], [c, "x_2^2"]]);
    const h = `${poly([[p, "x_1"], [q, "x_2"]])} = ${rhs}`;
    return {
      kind: "matrix",
      prompt: String.raw`Найдите минимум $f(x) = ${f}$ при ограничении $${h}$.`,
      label: String.raw`$x^\star =$`,
      answer: x.map((v) => [v]),
      tol: 0.005,
      hints: [
        String.raw`$\mathcal{L} = ${f} - \lambda (${poly([[p, "x_1"], [q, "x_2"]])} - ${par(rhs)})$. Условия: $\partial \mathcal{L}/\partial x_1 = 0$, $\partial \mathcal{L}/\partial x_2 = 0$ и само ограничение.`,
        String.raw`$x_1 = \lambda \cdot ${p}/${2 * a}$, $x_2 = \lambda \cdot ${q}/${2 * c}$; подставьте в ограничение и найдите $\lambda$.`,
      ],
      right: String.raw`$\lambda = ${Math.round(lam * 1000) / 1000}$, $x^\star = ${pm(x.map((v) => [v]))}$: здесь $\nabla f = \lambda \nabla h$, и ограничение выполнено.`,
      wrong: String.raw`Проверьте, что ответ лежит на прямой $${h}$: без уравнения ограничения $\lambda$ не найти.`,
    };
  },
};

/** Урок II.8: экстремум uᵀΣu при ‖u‖ = 1 — собственное значение Σ. Нечётный seed — максимум, чётный — минимум. */
export const lagrangeEig: Generator = {
  id: "calc.lagrange-eig",
  version: 1,
  title: "Экстремум uᵀΣu на сфере",
  make(seed) {
    const r = rng(seed);
    const [a, b0, c, l1] = r.pick(SPD);
    const b = b0 * r.pick([1, -1]);
    const l2 = a + c - l1;
    const max = seed % 2 === 1;
    return {
      kind: "numeric",
      prompt: String.raw`$$\Sigma = ${pm([[a, b], [b, c]])}.$$ Найдите ${max ? "наибольшее" : "наименьшее"} значение $u^\top \Sigma u$ при $\lVert u \rVert = 1$.`,
      label: String.raw`$${max ? "\\max" : "\\min"}\, u^\top \Sigma u =$`,
      answer: max ? l1 : l2,
      tol: 0.005,
      hints: [
        String.raw`$\mathcal{L} = u^\top \Sigma u - \lambda (u^\top u - 1)$, $\nabla_u \mathcal{L} = 2\Sigma u - 2\lambda u = 0$: $u$ — собственный вектор, а $u^\top \Sigma u = \lambda u^\top u = \lambda$.`,
        String.raw`$\lambda_1 + \lambda_2 = ${a + c}$, $\lambda_1 \lambda_2 = ${a * c - b * b}$.`,
      ],
      right: String.raw`Собственные значения $${l1}$ и $${l2}$; ${max ? "наибольшее" : "наименьшее"} $u^\top \Sigma u$ равно $${max ? l1 : l2}$ — на соответствующем собственном векторе. Множитель Лагранжа здесь и есть собственное значение.`,
      wrong: String.raw`В экстремуме $\Sigma u = \lambda u$, и значение $u^\top \Sigma u$ равно самому $\lambda$ — ответ — собственное значение, а не элемент матрицы.`,
    };
  },
};

/** Урок II.8: MLE категориального распределения — доли nₖ/n. */
export const categoricalMle: Generator = {
  id: "calc.categorical-mle",
  version: 1,
  title: "MLE категориального распределения",
  make(seed) {
    const r = rng(seed);
    const counts = [r.int(1, 9), r.int(1, 9), r.int(1, 9)];
    const n = counts.reduce((a, b) => a + b, 0);
    const phi = counts.map((k) => Math.round((k / n) * 1000) / 1000);
    return {
      kind: "matrix",
      prompt: String.raw`Бросаем кубик с тремя гранями. Грани выпали $${counts[0]}$, $${counts[1]}$ и $${counts[2]}$ раз. Найдите оценку максимального правдоподобия вероятностей $\phi$ при ограничении $\phi_1 + \phi_2 + \phi_3 = 1$.`,
      label: String.raw`$\hat\phi =$`,
      answer: phi.map((v) => [v]),
      tol: 0.005,
      hints: [String.raw`$\mathcal{L} = \sum_k n_k \log \phi_k - \lambda (\sum_k \phi_k - 1)$, $\partial \mathcal{L}/\partial \phi_k = n_k/\phi_k - \lambda = 0$.`, String.raw`Из ограничения $\lambda = \sum_k n_k = ${n}$.`],
      right: String.raw`$\lambda = n = ${n}$, $\hat\phi_k = n_k/n$: $${pm(phi.map((v) => [v]))}$.`,
      wrong: String.raw`$\phi_k = n_k/\lambda$, а $\lambda$ находят из ограничения: $\lambda = ${n}$. Сумма ответа должна быть равна $1$.`,
    };
  },
};

/** Урок II.9: проекция c на полуплоскость x₁ + x₂ ≤ b — множитель α* = max(0, g(c)/‖a‖²). */
export const kktAlpha: Generator = {
  id: "calc.kkt-alpha",
  version: 1,
  title: "Множитель KKT",
  make(seed) {
    const r = rng(seed);
    const b = r.int(-1, 2);
    // нечётный seed — c вне полуплоскости (ограничение активно), чётный — внутри
    let c: [number, number];
    for (;;) {
      c = [r.int(-3, 4), r.int(-3, 4)];
      const g = c[0] + c[1] - b;
      if (seed % 2 === 1 ? g > 0 : g < 0) break;
    }
    const g = c[0] + c[1] - b;
    const alpha = Math.max(0, g / 2);
    return {
      kind: "numeric",
      prompt: String.raw`Минимизируем $\tfrac12 \lVert x - c \rVert^2$ при $x_1 + x_2 \le ${b}$, где $c = (${c[0]}, ${c[1]})$. Найдите множитель $\alpha^\star$ из условий KKT.`,
      label: String.raw`$\alpha^\star =$`,
      answer: alpha,
      tol: 0.005,
      hints: [String.raw`Стационарность: $x - c + \alpha a = 0$, $a = (1, 1)$. Дополняющая нежёсткость: $\alpha\, g(x) = 0$, $\alpha \ge 0$.`, String.raw`Сначала проверьте, допустима ли сама $c$: $g(c) = c_1 + c_2 - ${par(b)} = ${g}$.`],
      right: g > 0 ? String.raw`$g(c) = ${g} > 0$: $c$ недопустима, ограничение активно. $x = c - \alpha a$ на границе: $g(c) - 2\alpha = 0$, $\alpha^\star = ${alpha}$.` : String.raw`$g(c) = ${g} < 0$: $c$ допустима, $x^\star = c$, ограничение неактивно и $\alpha^\star = 0$.`,
      wrong: g > 0 ? String.raw`Ограничение активно: $x^\star$ лежит на прямой $x_1 + x_2 = ${b}$, и из $x^\star = c - \alpha (1, 1)$ получается $\alpha = g(c)/2$.` : String.raw`$c$ уже удовлетворяет ограничению — минимум без ограничения допустим, и по дополняющей нежёсткости $\alpha^\star = 0$.`,
    };
  },
};

/** Урок II.10: двойной интеграл по прямоугольнику как повторный (Фубини). */
export const doubleIntegral: Generator = {
  id: "calc.double-integral",
  version: 1,
  title: "Двойной интеграл",
  make(seed) {
    const r = rng(seed);
    const [a, b] = [r.int(1, 3), r.int(1, 3)];
    const [p, q] = [r.int(0, 2), r.int(1, 2)];
    const k = r.int(1, 4);
    // ∫₀ᵃ∫₀ᵇ k xᵖ y^q dy dx = k · aᵖ⁺¹/(p + 1) · b^(q+1)/(q + 1)
    const ix = a ** (p + 1) / (p + 1);
    const iy = b ** (q + 1) / (q + 1);
    const answer = Math.round(k * ix * iy * 1000) / 1000;
    const mono = `${k === 1 ? "" : k}${p === 0 ? "" : p === 1 ? "x" : `x^${p}`}${q === 1 ? "y" : `y^${q}`}`;
    return {
      kind: "numeric",
      prompt: String.raw`Найдите $\displaystyle\iint_D ${mono}\, dx\, dy$, где $D = [0, ${a}] \times [0, ${b}]$.`,
      label: String.raw`$\iint_D =$`,
      answer,
      tol: 0.005,
      hints: [String.raw`По Фубини интеграл по прямоугольнику — повторный: $\int_0^{${a}} \Bigl( \int_0^{${b}} ${mono}\, dy \Bigr) dx$.`, String.raw`Множители по $x$ и по $y$ разделяются: $${k} \int_0^{${a}} x^{${p}}\, dx \cdot \int_0^{${b}} y^{${q}}\, dy$.`],
      right: String.raw`$${k} \cdot \frac{${a}^{${p + 1}}}{${p + 1}} \cdot \frac{${b}^{${q + 1}}}{${q + 1}} \approx ${answer}$.`,
      wrong: String.raw`Посчитайте внутренний интеграл по $y$ при постоянном $x$, затем внешний по $x$: $\int_0^{${b}} y^{${q}} dy = ${b}^{${q + 1}}/${q + 1}$.`,
    };
  },
};

/** Урок II.10: площадь образа при линейной замене x = Au — умножение на |det A| (с модулем). */
export const areaScale: Generator = {
  id: "calc.area-scale",
  version: 1,
  title: "Площадь при линейной замене",
  make(seed) {
    const r = rng(seed);
    let A: number[];
    for (;;) {
      A = [r.int(-3, 3), r.int(-3, 3), r.int(-3, 3), r.int(-3, 3)];
      const d = A[0]! * A[3]! - A[1]! * A[2]!;
      // чётный seed — отрицательный определитель: проверяем модуль
      if (d !== 0 && (seed % 2 === 0 ? d < 0 : d > 0)) break;
    }
    const [a, b, c, d] = A as [number, number, number, number];
    const det = a * d - b * c;
    const S = r.pick([2, 3, 5, 0.5]);
    const answer = Math.abs(det) * S;
    return {
      kind: "numeric",
      prompt: String.raw`Область $U$ на плоскости $(u_1, u_2)$ имеет площадь $${S}$. Какую площадь имеет её образ при замене $x = Au$, $$A = ${pm([[a, b], [c, d]])}?$$`,
      label: String.raw`$\operatorname{area}(AU) =$`,
      answer,
      tol: 0.005,
      hints: [String.raw`$dx = \lvert \det J \rvert\, du$, а якобиан линейной замены — сама $A$ (урок II.2).`],
      right: String.raw`$\det A = ${det}$, площадь умножается на $\lvert \det A \rvert = ${Math.abs(det)}$: $${Math.abs(det)} \cdot ${S} = ${answer}$.`,
      wrong: det < 0 ? String.raw`$\det A = ${det} < 0$: замена переворачивает ориентацию, но площадь не бывает отрицательной — нужен модуль, $\lvert \det A \rvert = ${-det}$.` : String.raw`Площадь умножается на $\lvert \det A \rvert = ${det}$, а не на след или элемент матрицы.`,
    };
  },
};

/** Урок II.10: интеграл по кругу в полярных координатах: ∬_{r ≤ R} (x² + y²)ᵏ dx dy = 2π R^{2k+2}/(2k + 2). */
export const polarIntegral: Generator = {
  id: "calc.polar-integral",
  version: 1,
  title: "Интеграл по кругу",
  make(seed) {
    const r = rng(seed);
    const R = r.int(1, 3);
    const k = r.int(0, 2);
    // в долях π: 2 R^{2k+2}/(2k + 2) = R^{2k+2}/(k + 1)
    const coef = Math.round((R ** (2 * k + 2) / (k + 1)) * 1000) / 1000;
    const f = k === 0 ? "1" : k === 1 ? "(x^2 + y^2)" : "(x^2 + y^2)^2";
    return {
      kind: "numeric",
      prompt: String.raw`Найдите $\displaystyle\iint_{x^2 + y^2 \le ${R * R}} ${f}\, dx\, dy$. Ответ — $c\pi$; введите $c$.`,
      label: String.raw`$c =$`,
      answer: coef,
      tol: 0.005,
      hints: [String.raw`В полярных координатах $x^2 + y^2 = r^2$, $dx\, dy = r\, dr\, d\varphi$, круг — $0 \le r \le ${R}$, $0 \le \varphi \le 2\pi$.`, String.raw`$\int_0^{2\pi} \int_0^{${R}} r^{${2 * k}} \cdot r\, dr\, d\varphi = 2\pi \cdot \frac{${R}^{${2 * k + 2}}}{${2 * k + 2}}$.`],
      right: String.raw`$2\pi \cdot ${R}^{${2 * k + 2}}/${2 * k + 2} = ${coef}\pi$.`,
      wrong: String.raw`Не забудьте якобиан $r$: подынтегральное выражение в полярных координатах — $r^{${2 * k}} \cdot r$, а не $r^{${2 * k}}$.`,
    };
  },
};
