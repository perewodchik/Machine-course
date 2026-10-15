// Проверка вывода по шагам (S3.04): вывод нормальных уравнений и он же с подложенными ошибками — первая неверная
// строка и сообщение для ученика.
import { describe, expect, it } from "vitest";
import { checkDerivation, classify, type DerivationTask } from "./derivation";

const task: DerivationTask = {
  start: String.raw`\tfrac12 (X\theta - y)^\top (X\theta - y)`,
  goal: String.raw`\theta = (X^\top X)^{-1} X^\top y`,
  symbols: [
    { name: "X", shape: ["n", "d"] },
    { name: "theta", shape: ["d", 1] },
    { name: "y", shape: ["n", 1] },
  ],
};

const right = [
  String.raw`= \tfrac12 (\theta^\top X^\top X\theta - 2 y^\top X\theta + y^\top y)`,
  String.raw`\nabla_\theta J = X^\top X\theta - X^\top y`,
  String.raw`X^\top X\theta - X^\top y = 0`,
  String.raw`X^\top X\theta = X^\top y`,
  String.raw`\theta = (X^\top X)^{-1} X^\top y`,
];

describe("вывод нормальных уравнений", () => {
  it("верный вывод доходит до цели", () => {
    const v = checkDerivation(task, right);
    expect(v).toMatchObject({ ok: true, done: true, first: -1 });
    expect(v.lines).toHaveLength(5);
  });

  it("верные шаги без последнего — ошибок нет, но до цели не дошли", () => {
    expect(checkDerivation(task, right.slice(0, 4))).toMatchObject({ ok: true, done: false });
  });

  it.each([
    ["транспонирование без смены порядка", 0, String.raw`= \tfrac12 (X^\top \theta^\top X\theta - 2 y^\top X\theta + y^\top y)`, "произведение"],
    ["потерянная двойка при раскрытии", 0, String.raw`= \tfrac12 (\theta^\top X^\top X\theta - y^\top X\theta + y^\top y)`, "не равна строке выше"],
    ["знак в градиенте", 1, String.raw`\nabla_\theta J = X^\top X\theta + X^\top y`, "не градиент"],
    ["лишняя двойка в градиенте", 1, String.raw`\nabla_\theta J = 2X^\top X\theta - 2X^\top y`, "не градиент"],
    ["перенос без смены знака", 3, String.raw`X^\top X\theta = -X^\top y`, "не равносильно"],
    ["XXᵀ вместо XᵀX", 4, String.raw`\theta = (X X^\top)^{-1} X^\top y`, "матрица 7\u202f×\u202f7 вырождена"],
    ["θ справа в решении", 4, String.raw`\theta = \theta - X^\top X\theta + X^\top y`, "не должно быть самой переменной"],
  ])("%s — строка %i", (_name, at, wrong, message) => {
    const lines = [...right];
    lines[at] = wrong;
    const v = checkDerivation(task, lines);
    expect(v.ok).toBe(false);
    expect(v.first).toBe(at);
    expect(v.lines[at]!.message).toContain(message);
    expect(v.lines).toHaveLength(at + 1);
  });

  it("уравнение можно умножить на число, имя строки слева не мешает", () => {
    const lines = [...right];
    lines[3] = String.raw`2X^\top X\theta = 2X^\top y`;
    expect(checkDerivation(task, lines)).toMatchObject({ ok: true, done: true });
    expect(checkDerivation(task, [String.raw`J(\theta) = \tfrac12 \lVert X\theta - y\rVert^2`, ...right.slice(1)])).toMatchObject({ ok: true, done: true });
  });

  it("цель-выражение: раскрыть скобки — скобок не больше, чем в цели", () => {
    const expand: DerivationTask = { ...task, goal: String.raw`\tfrac12 \theta^\top X^\top X\theta - y^\top X\theta + \tfrac12 y^\top y` };
    expect(checkDerivation(expand, [right[0]!])).toMatchObject({ ok: true, done: false });
    expect(checkDerivation(expand, [right[0]!, String.raw`\tfrac12 \theta^\top X^\top X\theta - y^\top X\theta + \tfrac12 y^\top y`])).toMatchObject({ ok: true, done: true });
  });

  it("вид строки определяется по записи", () => {
    const wrt = { tex: String.raw`\theta`, name: "theta" };
    expect(classify(String.raw`\nabla_{\theta} J(\theta) = a`, wrt, task.symbols).kind).toBe("gradient");
    expect(classify(String.raw`\theta^\star = a`, wrt, task.symbols).kind).toBe("solution");
    expect(classify(String.raw`\hat\theta = a`, wrt, task.symbols).kind).toBe("solution");
    expect(classify(String.raw`X\theta = y`, wrt, task.symbols).kind).toBe("equation");
    expect(classify(String.raw`= X\theta`, wrt, task.symbols).kind).toBe("same");
  });
});
