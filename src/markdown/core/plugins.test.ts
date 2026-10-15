// Конвейер Markdown через общее ядро: роли символов, блокировка HTML-команд KaTeX, типограф, ошибки TeX.
import type { Element, ElementContent, Root as HastRoot } from "hast";
import rehypeStringify from "rehype-stringify";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import remarkRehype, { type Options as RemarkRehypeOptions } from "remark-rehype";
import { unified } from "unified";
import { VFile } from "vfile";
import { describe, expect, it } from "vitest";
import type { SymbolSpec } from "../../lib/content/types";
import { assignRoles, renderTex, symbolNames, texToText } from "./katex";
import { rehypePlugins, remarkPlugins } from "./plugins";
import { typograf } from "./typograf";

const symbols: SymbolSpec[] = [
  { name: "X", tex: "X", role: "data" },
  { name: "theta", tex: "\\theta", role: "param" },
  { name: "y", tex: "y", role: "target" },
  { name: "eps", tex: "\\varepsilon", role: "aux" },
  { name: "n", tex: "n" },
];

async function md(value: string, frontmatter: Record<string, unknown> = { symbols }): Promise<string> {
  // плагины по одному: массив из функций unified понял бы как [плагин, настройки]
  const processor = unified().use(remarkParse);
  for (const plugin of remarkPlugins) processor.use(plugin);
  processor.use(remarkRehype);
  for (const plugin of rehypePlugins) processor.use(...((Array.isArray(plugin) ? plugin : [plugin]) as [never]));
  processor.use(rehypeStringify);
  return String(await processor.process(new VFile({ value, path: "demo.mdx", data: { astro: { frontmatter } } })));
}

describe("роли символов", () => {
  it("assignRoles переписывает \\sym по таблице, имя без роли не трогает", () => {
    expect(assignRoles("\\sym{theta}{\\theta} + \\sym{n}{n}", symbols)).toBe("\\symr{theta}{2}{\\theta} + \\sym{n}{n}");
    expect(symbolNames("\\sym{X}{X}\\sym{theta}{\\theta}\\sym{X}{X}")).toEqual(["X", "theta"]);
  });

  it("MDX: символы получают data-sym и класс роли s1–s4", async () => {
    const html = await md("Предсказание $\\sym{X}{X}\\sym{theta}{\\theta}$ и остатки $\\sym{eps}{\\varepsilon}$.\n\n$$\n\\sym{y}{y} = \\sym{X}{X}\\sym{theta}{\\theta}\n$$\n");
    expect(html).toContain('data-sym="X"><span class="enclosing sym s1"');
    expect(html).toContain('data-sym="theta"><span class="enclosing sym s2"');
    expect(html).toContain('data-sym="y"><span class="enclosing sym s3"');
    expect(html).toContain('data-sym="eps"><span class="enclosing sym s4"');
    expect(html).toContain('class="katex-display"');
  });

  it("texToText даёт текст символа для доступного имени", () => {
    expect(texToText("\\theta")).toBe("θ");
    expect(texToText("X^\\top")).toBe("X⊤");
  });

  it("renderTex для компонентов даёт те же классы", () => {
    expect(renderTex("\\sym{theta}{\\theta}", { symbols })).toContain('class="enclosing sym s2"');
  });
});

describe("HTML-команды KaTeX заблокированы", () => {
  it.each([
    // исходный TeX остаётся текстом в <annotation> MathML — проверяем разметку, а не текст
    ["\\href{javascript:alert(1)}{x}", /<a\b|href=/],
    ["\\url{https://example.com}", /<a\b|href=/],
    ["\\htmlStyle{color:red;background:url(x)}{x}", /style="[^"]*background/],
    ["\\htmlId{evil}{x}", /id="evil"/],
    ["\\includegraphics{https://example.com/x.png}", /<img\b/],
  ])("%s", (tex, forbidden) => {
    const html = renderTex(tex);
    expect(html).not.toMatch(forbidden);
    expect(html).toContain("katex"); // формула отрисована, команда показана как текст
  });

  it("в MDX тоже", async () => {
    const html = await md("Ссылка $\\href{javascript:alert(1)}{x}$");
    expect(html).not.toMatch(/<a\b|href=/);
  });
});

describe("ошибки TeX", () => {
  it("renderTex роняет сборку с текстом формулы", () => {
    expect(() => renderTex("\\frac{1}{")).toThrow(/KaTeX не разобрал формулу «\\frac\{1\}\{»/);
  });

  it("MDX с неразбираемой формулой роняет сборку с именем файла", async () => {
    await expect(md("Плохо: $\\frac{1}{$ — так нельзя")).rejects.toThrow(/demo\.mdx: формула не разобрана KaTeX/);
  });
});

describe("типограф", () => {
  it("кавычки, тире, неразрывные пробелы", () => {
    expect(typograf('Он сказал "да" - и ушёл в лес')).toBe("Он\u00a0сказал «да»\u00a0— и\u00a0ушёл в\u00a0лес");
  });

  it("числа с десятичной точкой и длинные числа не трогает", () => {
    const out = typograf("шаг 0.05 и seed 12345");
    expect(out).toContain("0.05");
    expect(out).toContain("12345");
    expect(typograf("функция f(x) ")).toBe("функция f(x) ");
  });

  it("кавычки, разорванные формулой, остаются на местах", async () => {
    const html = await md("Читать $AB$ как «сначала $A$, потом $B$». Для поворота «сначала $R$, потом $S$» — это $SR$.");
    expect(html).not.toContain("„");
    expect(html.match(/«/g)).toHaveLength(2);
    expect(html.match(/»/g)).toHaveLength(2);
    expect(html).toMatch(/<\/span>»\.<\/span> Для/);
  });

  it("формула и знак после неё неразрывны, предлог перед формулой не висит", async () => {
    const html = await md("Ближайшая к $y$ точка, а потом $X^\\top X\\theta = X^\\top y$, и всё.");
    expect(html).toContain("к\u00a0<span class=\"math-glue is-short\">");
    expect(html).toMatch(/<span class="math-glue is-short">(?:(?!math-glue)[\s\S])*<\/span>,<\/span> и/);
  });

  it("в MDX: текст типографится, код и формулы — нет", async () => {
    const html = await md('Текст "в кавычках" и `x = "a - b"` и $a - b$');
    expect(html).toContain("«в\u00a0кавычках»");
    expect(html).toContain('<code>x = "a - b"</code>');
    expect(html).not.toContain("a — b");
  });

  it("однострочный компонент MDX: кавычка после формулы закрывается, короткая формула не рвётся", async () => {
    // <Note>текст</Note> в одну строку — абзац с узлом mdxJsxTextElement, текст и формулы лежат прямо в нём
    const mdx = ["mdxJsxFlowElement", "mdxJsxTextElement", "mdxFlowExpression", "mdxTextExpression", "mdxjsEsm"];
    const processor = unified().use(remarkParse).use(remarkMdx);
    for (const plugin of remarkPlugins) processor.use(plugin);
    processor.use(remarkRehype, { passThrough: mdx } as RemarkRehypeOptions);
    for (const plugin of rehypePlugins) processor.use(...((Array.isArray(plugin) ? plugin : [plugin]) as [never]));
    const tree = (await processor.run(processor.parse('<Note label="x">Пишут «функция $J(\\theta)$», хотя $A = B$ — значение.</Note>\n'))) as HastRoot;
    const para = tree.children.find((c): c is Element => c.type === "element" && c.tagName === "p");
    const note = para?.children.find((c) => (c as { type: string }).type === "mdxJsxTextElement") as unknown as { children: ElementContent[] };
    const text = (n: ElementContent): string => (n.type === "text" ? n.value : n.type === "element" && !(n.properties.className as string[] | undefined)?.includes("katex") ? n.children.map(text).join("") : n.type === "element" ? "$" : "");
    expect(JSON.stringify(note.children.map(text).join(""))).toBe(JSON.stringify("Пишут «функция $», хотя $\u00a0— значение."));
    const glued = note.children.filter((c): c is Element => c.type === "element" && (c.properties.className as string[]).includes("math-glue"));
    expect(glued.map((g) => (g.properties.className as string[]).join(" "))).toEqual(["math-glue is-short", "math-glue is-short"]);
  });
});
