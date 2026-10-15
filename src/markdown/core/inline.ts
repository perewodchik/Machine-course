// Текст с формулами для компонентов (условия задач, подсказки, разборы): $…$ — строчная формула,
// $$…$$ — выключная, \$ — знак доллара. Текст проходит типограф и экранируется, формулы — KaTeX ядра.
import type { SymbolSpec } from "../../lib/content/types";
import { renderTex, texToText } from "./katex";
import { glueClass, isShortMath, nbspBeforeMath, PUNCT_AFTER } from "./nobr";
import { typograf } from "./typograf";

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const text = (s: string) => escapeHtml(typograf(s.replace(/\\\$/g, "$")));

const MATH = "\uE001"; // место формулы: типограф видит фразу целиком, и кавычки вокруг формул не разворачиваются

export function renderInline(source: string, symbols?: readonly SymbolSpec[]): string {
  const re = /\$\$([\s\S]+?)\$\$|\$((?:\\.|[^$\\])+?)\$/g;
  const maths: { html: string; short: boolean }[] = [];
  const texts: string[] = [];
  let last = 0;
  for (let m = re.exec(source); m; m = re.exec(source)) {
    texts.push(source.slice(last, m.index));
    maths.push(
      m[1] !== undefined
        ? { html: renderTex(m[1], { display: true, symbols }), short: false }
        : { html: renderTex(m[2]!, { symbols }), short: isShortMath(texToText(m[2]!)) },
    );
    last = re.lastIndex;
  }
  texts.push(source.slice(last));
  const parts = nbspBeforeMath(typograf(texts.join(MATH).replace(/\\\$/g, "$")), MATH).split(MATH);
  // правило типографа съело метку — по кускам, как раньше
  const safe = parts.length === texts.length ? parts.map(escapeHtml) : texts.map(text);
  // формула и знак препинания после неё — одним неразрывным куском (src/markdown/core/nobr.ts)
  let out = safe[0]!;
  maths.forEach((math, i) => {
    const after = safe[i + 1]!;
    const display = math.html.includes("katex-display");
    const punct = display ? "" : (PUNCT_AFTER.exec(after)?.[0] ?? "");
    const cls = display ? undefined : glueClass(math.short, punct !== "");
    out += cls ? `<span class="${cls.join(" ")}">${math.html}${punct}</span>${after.slice(punct.length)}` : math.html + after;
  });
  return out;
}

/** Тот же текст без разметки — для aria-label: формулы заменены их текстом из MathML («θ1 =»). */
export function inlineText(source: string): string {
  return source
    .replace(/\$\$([\s\S]+?)\$\$|\$((?:\\.|[^$\\])+?)\$/g, (_m, display: string | undefined, inline: string | undefined) => texToText(display ?? inline ?? ""))
    .replace(/\\\$/g, "$")
    .replace(/\s+/g, " ")
    .trim();
}
