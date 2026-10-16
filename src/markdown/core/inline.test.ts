import { describe, expect, it } from "vitest";
import { inlineText, renderInline } from "./inline";

describe("renderInline", () => {
  it("текст типографится и экранируется, формулы — KaTeX", () => {
    const html = renderInline('Найдите "det" для $A$ <b>');
    expect(html).toContain("«det»");
    expect(html).toContain("&lt;b&gt;");
    expect(html).toContain('class="katex"');
  });

  it("выключная формула и знак доллара", () => {
    expect(renderInline("$$x^2$$")).toContain("katex-display");
    expect(renderInline("цена \\$5")).toContain("$5");
  });

  it("код в строке — как есть, без типографа; короткий не рвётся", () => {
    const html = renderInline('Что вернёт `A * B` для "матриц"? И `np.linalg.norm(x, ord=1)`');
    expect(html).toContain('<code class="nowrap">A * B</code>');
    expect(html).toContain("<code>np.linalg.norm(x, ord=1)</code>");
    expect(html).toContain("«матриц»");
    expect(renderInline("`a < b`")).toContain("<code class=\"nowrap\">a &lt; b</code>");
  });

  it("роли символов, как в формулах реестра", () => {
    expect(renderInline("$\\sym{theta}{\\theta}$", [{ name: "theta", tex: "\\theta", role: "param" }])).toContain("sym s2");
  });
});

describe("переносы рядом с формулами", () => {
  it("знак препинания после формулы — в одной обёртке с ней", () => {
    expect(renderInline("Ответ $x$. Дальше")).toMatch(/<span class="math-glue is-short"><span class="katex">[\s\S]*<\/span>\.<\/span> Дальше/);
  });

  it("длинная формула без знака после неё не оборачивается", () => {
    expect(renderInline("Сумма $a_1 + a_2 + a_3 + a_4 + a_5 + a_6 + a_7$ и всё")).not.toContain("math-glue");
  });

  it("после однобуквенного предлога перед формулой — неразрывный пробел", () => {
    expect(renderInline("ближайшая к $y$ точка")).toContain("к\u00a0<span");
  });
});

describe("inlineText", () => {
  it("формулы — текстом, для доступного имени", () => {
    expect(inlineText("$\\theta_1 =$")).toBe("θ1=");
    expect(inlineText("Форма $3 \\times 1$")).toBe("Форма 3×1");
    expect(inlineText("Что вернёт `A * B`?")).toBe("Что вернёт A * B?");
  });
});
