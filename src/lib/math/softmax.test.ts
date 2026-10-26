// Softmax и перцептрон: устойчивость, сдвиг логитов не меняет вероятностей, k = 2 — сигмоида разности; спуск
// приходит к минимуму кросс-энтропии; перцептрон на разделимых данных останавливается. Числа урока — в тестах виджетов.
import { describe, expect, it } from "vitest";
import { accuracy, crossEntropy, fitSoftmax, nextMistake, perceptronEpochs, probs, softmax } from "./softmax";

describe("softmax", () => {
  it("устойчив, не зависит от сдвига логитов, при k = 2 — сигмоида разности", () => {
    expect(softmax([1000, 1000])).toEqual([0.5, 0.5]);
    const a = softmax([0.3, -1, 2]);
    softmax([5.3, 4, 7]).forEach((v, i) => expect(v).toBeCloseTo(a[i]!, 12));
    const p = probs([[0.5, 1], [-0.2, 0.3]], [1, 2]);
    expect(p[0]).toBeCloseTo(1 / (1 + Math.exp(-(0.7 + 2 * 0.7))), 12);
  });

  it("спуск уменьшает кросс-энтропию; перцептрон на разделимых данных — без ошибок", () => {
    const X = [-2, -1.5, -1, 1, 1.5, 2, 3, 3.5].map((v) => [1, v]);
    const y = [0, 0, 0, 1, 1, 1, 2, 2];
    const zero = [[0, 0], [0, 0], [0, 0]];
    const t = fitSoftmax(X, y, 3, 1, 500);
    expect(crossEntropy(t, X, y)).toBeLessThan(crossEntropy(zero, X, y) / 2);
    expect(accuracy(t, X, y)).toBe(1);
    const yb = [0, 0, 0, 1, 1, 1, 1, 1];
    const { theta, mistakes } = perceptronEpochs(X, yb);
    expect(mistakes.at(-1)).toBe(0);
    expect(nextMistake(theta, X, yb, 0)).toBeNull();
  });
});
