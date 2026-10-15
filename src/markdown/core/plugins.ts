// Плагины unified для MDX: роли символов в формулах (remark), KaTeX (rehype-katex с ядром), типограф текста (rehype).
// Подключаются в astro.config.mjs через unified() из @astrojs/markdown-remark.
import type { Element, ElementContent, Root as HastRoot } from "hast";
import type { Root as MdastRoot } from "mdast";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { SKIP, visit } from "unist-util-visit";
import type { VFile } from "vfile";
import type { SymbolSpec } from "../../lib/content/types";
import { assignRoles, katexOptions } from "./katex";
import { glueClass, isShortMath, nbspBeforeMath, PUNCT_AFTER } from "./nobr";
import { pythonTokens } from "./python";
import { typograf } from "./typograf";

interface AstroData {
  astro?: { frontmatter?: { symbols?: SymbolSpec[] } };
}

/** \sym{name}{…} → \symr{name}{слот}{…} по ролям из frontmatter урока (symbols). */
export function remarkSymbolRoles() {
  return (tree: MdastRoot, file: VFile) => {
    const symbols = (file.data as AstroData).astro?.frontmatter?.symbols ?? [];
    visit(tree, (node) => {
      if (node.type !== "math" && node.type !== "inlineMath") return;
      node.value = assignRoles(node.value, symbols);
      // mdast-util-math уже положил исходный TeX в data.hChildren (у блочной формулы — внутри <code>);
      // HTML строится по нему, поэтому заменяем текст и там
      const value = node.value;
      const replace = (children: ElementContent[]) =>
        children.forEach((child) => {
          if (child.type === "text") child.value = value;
          else if (child.type === "element") replace(child.children);
        });
      if (node.data?.hChildren) replace(node.data.hChildren);
    });
  };
}

const RAW_TAGS = new Set(["code", "pre", "kbd", "samp", "script", "style", "math", "svg"]);
const isMath = (el: Element) => {
  const cls = el.properties?.className;
  return Array.isArray(cls) && cls.some((c) => c === "katex" || c === "katex-display" || c === "math-inline" || c === "math-display");
};

// Абзац типографится целиком: иначе кавычки, разорванные формулой («сначала $A$, потом $B$»), типограф
// видит по кускам и разворачивает. Границы текстовых узлов — символ SEP, формула или код на месте — MATH.
const SEP = "\uE000";
const MATH = "\uE001";
const BLOCKS = new Set(["p", "li", "td", "th", "h1", "h2", "h3", "h4", "h5", "h6", "figcaption", "dt", "dd", "summary", "caption"]);

/**
 * Компонент MDX с текстом в одну строку (`<Note>текст $x$</Note>`): абзаца внутри нет, текст и формулы лежат прямо
 * в узле компонента. Внутри абзаца (mdxJsxTextElement) он типографится вместе с абзацем, без абзаца — как абзац.
 */
interface MdxJsx {
  type: "mdxJsxFlowElement" | "mdxJsxTextElement";
  children: ElementContent[];
}
const isMdxJsx = (node: { type: string }): node is MdxJsx => node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement";
const hasInlineText = (node: MdxJsx) => node.children.some((c) => c.type === "text" && c.value.trim() !== "");

function typografBlock(block: { children: ElementContent[] }): void {
  const texts: { value: string }[] = [];
  let joined = "";
  const walk = (children: ElementContent[]) => {
    for (const child of children) {
      if (child.type === "text") {
        texts.push(child);
        joined += child.value + SEP;
      } else if (child.type === "element") {
        if (RAW_TAGS.has(child.tagName) || isMath(child)) joined += MATH;
        else walk(child.children);
      } else if (isMdxJsx(child)) walk(child.children);
    }
  };
  walk(block.children);
  const parts = nbspBeforeMath(typograf(joined), MATH, SEP).split(SEP);
  if (parts.length !== texts.length + 1) {
    texts.forEach((t) => (t.value = typograf(t.value))); // правило съело границу — по узлам, как раньше
    return;
  }
  texts.forEach((t, i) => (t.value = parts[i]!.replaceAll(MATH, "")));
}

/** Типограф: абзацы и ячейки — целиком, остальной текст — по узлам; код, формулы и SVG пропускаются. */
export function rehypeTypograf() {
  return (tree: HastRoot) => {
    visit(tree, (node) => {
      if (node.type === "element" && (RAW_TAGS.has(node.tagName) || isMath(node))) return SKIP;
      if ((node.type === "element" && BLOCKS.has(node.tagName)) || (isMdxJsx(node) && hasInlineText(node))) {
        typografBlock(node as { children: ElementContent[] });
        return SKIP;
      }
      if (node.type === "text") node.value = typograf(node.value);
      return undefined;
    });
  };
}

const hasClass = (node: Element, name: string) => {
  const cls = node.properties?.className;
  return Array.isArray(cls) && cls.includes(name);
};

/** Видимый текст строчной формулы — из её MathML, без исходного TeX (annotation). */
function mathText(node: ElementContent): string {
  if (node.type === "text") return node.value;
  if (node.type !== "element" || node.tagName === "annotation") return "";
  return node.children.map(mathText).join("");
}

/**
 * Строчная формула и знак препинания после неё — в одной обёртке .math-glue, короткая формула — неразрывно
 * (src/markdown/core/nobr.ts). После типографа: кавычки «» появляются только в нём.
 */
export function rehypeMathGlue() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: Element, index, parent) => {
      // родитель — элемент, корень или компонент MDX с текстом в одну строку (<Note>…</Note>)
      if (!parent || index === undefined) return;
      if (hasClass(node, "katex-display") || (parent.type === "element" && hasClass(parent, "math-glue"))) return SKIP;
      if (!hasClass(node, "katex")) return;
      const next = parent.children[index + 1];
      const punct = next?.type === "text" ? (PUNCT_AFTER.exec(next.value)?.[0] ?? "") : "";
      const mathml = node.children.find((c): c is Element => c.type === "element" && hasClass(c, "katex-mathml"));
      const cls = glueClass(isShortMath(mathml ? mathText(mathml) : ""), punct !== "");
      if (!cls) return SKIP;
      const children: ElementContent[] = [node];
      if (punct && next?.type === "text") {
        children.push({ type: "text", value: punct });
        next.value = next.value.slice(punct.length);
      }
      parent.children[index] = { type: "element", tagName: "span", properties: { className: cls }, children };
      return SKIP;
    });
  };
}

/** rehype-katex на ошибке TeX лишь пишет предупреждение и рисует формулу красным — сборка должна упасть. */
export function rehypeFailOnMathErrors() {
  return (_tree: HastRoot, file: VFile) => {
    const errors = file.messages.filter((m) => m.source === "rehype-katex");
    if (errors.length) {
      throw new Error(`${file.path}: формула не разобрана KaTeX:\n${errors.map((m) => `  строка ${m.line ?? "?"}: ${m.cause instanceof Error ? m.cause.message : m.reason}`).join("\n")}`);
    }
  };
}

/**
 * Блоки ```python в уроке — той же подсветкой «карандашом», что ячейки кода (src/markdown/core/python.ts).
 * Shiki в astro.config.mjs выключен: его темы красят мимо токенов и не проходят контраст на фоне блоков.
 */
export function rehypeHighlightPython() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "pre") return;
      const code = node.children.find((c): c is Element => c.type === "element" && c.tagName === "code");
      if (!code || !hasClass(code, "language-python")) return;
      const text = code.children.map((c) => (c.type === "text" ? c.value : "")).join("").replace(/\n$/, "");
      code.children = pythonTokens(text).map((t) => (t.cls ? { type: "element", tagName: "span", properties: { className: [t.cls] }, children: [{ type: "text", value: t.text }] } : { type: "text", value: t.text }));
      node.properties = { ...node.properties, className: ["code", "code-listing"] };
      return SKIP;
    });
  };
}

/** Короткий код в строке — `(n, 1)`, `A @ B` — не рвётся посередине: класс nowrap (src/styles/base.css). */
export function rehypeShortCode() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: Element, _i, parent) => {
      if (node.tagName === "pre") return SKIP;
      if (node.tagName !== "code" || (parent?.type === "element" && parent.tagName === "pre")) return;
      const text = node.children.map((c) => (c.type === "text" ? c.value : "")).join("");
      if (text.length <= 16) node.properties = { ...node.properties, className: ["nowrap"] };
    });
  };
}

export const remarkPlugins = [remarkMath, remarkSymbolRoles];
/** Текст ячейки заголовка: у формулы — из MathML, без дубля из katex-html. */
function cellText(node: ElementContent): string {
  if (node.type === "text") return node.value;
  if (node.type !== "element" || hasClass(node, "katex-html") || node.tagName === "annotation") return "";
  return node.children.map(cellText).join("");
}

/**
 * Таблица урока — в обёртке .table-wrap: на узком экране прокручивается сама, а не вся страница.
 * У таблицы из трёх и больше столбцов ячейки получают data-label с заголовком столбца: на телефоне строки
 * складываются в карточки «заголовок — значение» (.table-wrap--stack, src/styles/layout.css).
 */
export function rehypeWrapTables() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "table" || !parent || index === undefined) return;
      if (parent.type === "element" && (parent.properties?.className as string[] | undefined)?.includes("table-wrap")) return;
      const rows: Element[] = [];
      visit(node, "element", (el: Element) => {
        if (el.tagName === "tr") rows.push(el);
      });
      const cells = (tr: Element) => tr.children.filter((c): c is Element => c.type === "element" && (c.tagName === "td" || c.tagName === "th"));
      const head = rows[0] ? cells(rows[0]).map((c) => cellText(c).replace(/\s+/g, " ").trim()) : [];
      const stack = head.length >= 3 && head.every(Boolean);
      if (stack) for (const tr of rows.slice(1)) cells(tr).forEach((c, i) => (c.properties = { ...c.properties, dataLabel: head[i] }));
      parent.children[index] = { type: "element", tagName: "div", properties: { className: stack ? ["table-wrap", "table-wrap--stack"] : ["table-wrap"] }, children: [node] };
      return SKIP;
    });
  };
}

export const rehypePlugins = [[rehypeKatex, katexOptions], rehypeFailOnMathErrors, rehypeHighlightPython, rehypeShortCode, rehypeTypograf, rehypeMathGlue, rehypeWrapTables] as const;
