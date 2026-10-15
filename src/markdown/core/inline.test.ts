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

  it("роли символов, как в формулах реестра", () => {
    expect(renderInline("$\\sym{theta}{\\theta}$", [{ name: "theta", tex: "\\theta", role: "param" }])).toContain("sym s2");
  });
});

describe("inlineText", () => {
  it("формулы — текстом, для доступного имени", () => {
    expect(inlineText("$\\theta_1 =$")).toBe("θ1=");
    expect(inlineText("Форма $3 \\times 1$")).toBe("Форма 3×1");
  });
});
