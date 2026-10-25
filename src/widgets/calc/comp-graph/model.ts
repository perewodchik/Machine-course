// Модель виджета «Вычислительный граф» (урок II.2): L = (θᵀx − y)² для θ, x ∈ ℝ² разложена на элементарные
// операции p₁ = θ₁x₁, p₂ = θ₂x₂, s = p₁ + p₂, r = s − y, L = r². Прямой проход считает значения снизу вверх,
// обратный — производные ∂L/∂(узел) от выхода к входам по правилу цепочки. Чистые функции без DOM.

export type NodeId = "t1" | "x1" | "t2" | "x2" | "y" | "p1" | "p2" | "s" | "r" | "L";

export interface Inputs {
  theta: readonly [number, number];
  x: readonly [number, number];
  y: number;
}

export interface Pass {
  value: Record<NodeId, number>;
  grad: Record<NodeId, number>;
}

/** Прямой и обратный проход целиком. */
export function run({ theta, x, y }: Inputs): Pass {
  const p1 = theta[0] * x[0];
  const p2 = theta[1] * x[1];
  const s = p1 + p2;
  const r = s - y;
  const L = r * r;
  const gL = 1;
  const gr = 2 * r * gL; // dL/dr
  const gs = gr; // r = s − y
  const gy = -gr;
  const [gp1, gp2] = [gs, gs]; // s = p₁ + p₂ раздаёт градиент без изменений
  return {
    value: { t1: theta[0], x1: x[0], t2: theta[1], x2: x[1], y, p1, p2, s, r, L },
    grad: { L: gL, r: gr, s: gs, y: gy, p1: gp1, p2: gp2, t1: gp1 * x[0], x1: gp1 * theta[0], t2: gp2 * x[1], x2: gp2 * theta[1] },
  };
}

export interface Step {
  phase: "forward" | "backward";
  node: NodeId;
  /** Пояснение шага: формула и подстановка. */
  text: (p: Pass) => string;
}

const f = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(2)).replace("-", "−");

/** Порядок шагов: прямой проход p₁, p₂, s, r, L, затем обратный — от L к θ. */
export const STEPS: readonly Step[] = [
  { phase: "forward", node: "p1", text: (p) => `p₁ = θ₁x₁ = ${f(p.value.t1)} · ${f(p.value.x1)} = ${f(p.value.p1)}` },
  { phase: "forward", node: "p2", text: (p) => `p₂ = θ₂x₂ = ${f(p.value.t2)} · ${f(p.value.x2)} = ${f(p.value.p2)}` },
  { phase: "forward", node: "s", text: (p) => `s = p₁ + p₂ = ${f(p.value.s)} — это θᵀx` },
  { phase: "forward", node: "r", text: (p) => `r = s − y = ${f(p.value.s)} − ${f(p.value.y)} = ${f(p.value.r)}` },
  { phase: "forward", node: "L", text: (p) => `L = r² = ${f(p.value.L)}. Прямой проход закончен.` },
  { phase: "backward", node: "L", text: () => "Обратный проход начинается с ∂L/∂L = 1." },
  { phase: "backward", node: "r", text: (p) => `∂L/∂r = 2r = ${f(p.grad.r)}` },
  { phase: "backward", node: "s", text: (p) => `∂L/∂s = ∂L/∂r · ∂r/∂s = ${f(p.grad.r)} · 1 = ${f(p.grad.s)}` },
  { phase: "backward", node: "p1", text: (p) => `Сумма раздаёт градиент: ∂L/∂p₁ = ∂L/∂p₂ = ∂L/∂s = ${f(p.grad.p1)}` },
  { phase: "backward", node: "t1", text: (p) => `∂L/∂θ₁ = ∂L/∂p₁ · x₁ = ${f(p.grad.p1)} · ${f(p.value.x1)} = ${f(p.grad.t1)}` },
  { phase: "backward", node: "t2", text: (p) => `∂L/∂θ₂ = ∂L/∂p₂ · x₂ = ${f(p.grad.p2)} · ${f(p.value.x2)} = ${f(p.grad.t2)}. Это и есть ∇θL = 2(θᵀx − y)x.` },
];

/** Какие узлы уже посчитаны к шагу k (0 — только входы): значения и производные. */
export function known(k: number): { values: Set<NodeId>; grads: Set<NodeId> } {
  const values = new Set<NodeId>(["t1", "x1", "t2", "x2", "y"]);
  const grads = new Set<NodeId>();
  for (const s of STEPS.slice(0, k)) {
    if (s.phase === "forward") values.add(s.node);
    else {
      grads.add(s.node);
      if (s.node === "p1") grads.add("p2");
    }
  }
  return { values, grads };
}

/** Рёбра графа: от аргумента к результату операции. */
export const EDGES: readonly [NodeId, NodeId][] = [
  ["t1", "p1"], ["x1", "p1"], ["t2", "p2"], ["x2", "p2"], ["p1", "s"], ["p2", "s"], ["s", "r"], ["y", "r"], ["r", "L"],
];
