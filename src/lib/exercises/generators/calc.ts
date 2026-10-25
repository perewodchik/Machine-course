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
