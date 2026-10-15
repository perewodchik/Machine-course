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

function typografBlock(block: Element): void {
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
      }
    }
  };
  walk(block.children);
  const parts = typograf(joined).split(SEP);
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
      if (node.type === "element" && BLOCKS.has(node.tagName)) {
        typografBlock(node);
        return SKIP;
      }
      if (node.type === "text") node.value = typograf(node.value);
      return undefined;
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

export const remarkPlugins = [remarkMath, remarkSymbolRoles];
/** Таблица урока — в обёртке .table-wrap: на узком экране прокручивается сама, а не вся страница. */
export function rehypeWrapTables() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "table" || !parent || index === undefined) return;
      if (parent.type === "element" && (parent.properties?.className as string[] | undefined)?.includes("table-wrap")) return;
      parent.children[index] = { type: "element", tagName: "div", properties: { className: ["table-wrap"] }, children: [node] };
      return SKIP;
    });
  };
}

export const rehypePlugins = [[rehypeKatex, katexOptions], rehypeFailOnMathErrors, rehypeTypograf, rehypeWrapTables] as const;
