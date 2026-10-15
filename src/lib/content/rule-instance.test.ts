// Правило с подставленными символами: правая и левая части, мутации; буквы внутри команд не трогаются.
import { describe, expect, it } from "vitest";
import { instantiate, substitute } from "./rule-instance";
import type { Rule } from "./types";

const transpose: Rule = {
  id: "rule.transpose-product",
  kind: "rule",
  title: { ru: "Транспонирование произведения" },
  statement: String.raw`(AB)^\top = B^\top A^\top`,
  symbols: [
    { name: "A", tex: "A", shape: ["m", "k"] },
    { name: "B", tex: "B", shape: ["k", "p"] },
  ],
  concept: "la.transpose",
  checks: [{ kind: "identity", lhs: "(A @ B).T", rhs: "B.T @ A.T" }],
  mutations: [{ tex: String.raw`A^\top B^\top`, py: "A.T @ B.T", why: "без смены порядка" }],
};

describe("правило с подставленными символами", () => {
  it("левая и правая части и мутации", () => {
    expect(instantiate(transpose, { A: "X", B: String.raw`\theta` })).toEqual({
      lhs: String.raw`({X}{\theta})^\top`,
      rhs: String.raw`{\theta}^\top {X}^\top`,
      mutations: [{ tex: String.raw`{X}^\top {\theta}^\top`, why: "без смены порядка" }],
    });
  });

  it("буквы внутри команд и имён не заменяются", () => {
    const syms = [{ name: "A", tex: "A" }, { name: "x", tex: "x" }] as Rule["symbols"];
    expect(substitute(String.raw`\max_x A x + \exp(x) + Ax_1`, { A: "M", x: "v" }, syms)).toBe(String.raw`\max_{v} {M} {v} + \exp({v}) + {M}{v}_1`);
  });
});
