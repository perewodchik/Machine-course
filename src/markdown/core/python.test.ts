import { describe, expect, it } from "vitest";
import { highlightPython } from "./python";

describe("подсветка Python", () => {
  it("ключевые слова, строки, числа, комментарии; остальное — как есть", () => {
    expect(highlightPython('import numpy as np\nx = np.ones(3)  # три\nprint("θ =", 0.5e-3, None)')).toBe(
      '<span class="tok-k">import</span> numpy <span class="tok-k">as</span> np\n' +
        'x = np.ones(<span class="tok-n">3</span>)  <span class="tok-c"># три</span>\n' +
        '<span class="tok-k">print</span>(<span class="tok-s">"θ ="</span>, <span class="tok-n">0.5e-3</span>, <span class="tok-k">None</span>)',
    );
  });

  it("экранирует HTML, понимает тройные кавычки и префиксы строк", () => {
    expect(highlightPython('a < b and f"{x}" > r\'\\d\'')).toBe(
      'a &lt; b <span class="tok-k">and</span> <span class="tok-s">f"{x}"</span> &gt; <span class="tok-s">r\'\\d\'</span>',
    );
    expect(highlightPython('"""doc # не комментарий\n"""')).toBe('<span class="tok-s">"""doc # не комментарий\n"""</span>');
  });

  it("числа внутри имён не подсвечиваются", () => {
    expect(highlightPython("x2 = theta_1")).toBe("x2 = theta_1");
  });
});
