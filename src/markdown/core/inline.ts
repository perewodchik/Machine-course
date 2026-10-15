// Текст с формулами для компонентов (условия задач, подсказки, разборы): $…$ — строчная формула,
// $$…$$ — выключная, \$ — знак доллара. Текст проходит типограф и экранируется, формулы — KaTeX ядра.
import type { SymbolSpec } from "../../lib/content/types";
import { renderTex, texToText } from "./katex";
import { typograf } from "./typograf";

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const text = (s: string) => escapeHtml(typograf(s.replace(/\\\$/g, "$")));

const MATH = "\uE001"; // место формулы: типограф видит фразу целиком, и кавычки вокруг формул не разворачиваются

export function renderInline(source: string, symbols?: readonly SymbolSpec[]): string {
  const re = /\$\$([\s\S]+?)\$\$|\$((?:\\.|[^$\\])+?)\$/g;
  const maths: string[] = [];
  const texts: string[] = [];
  let last = 0;
  for (let m = re.exec(source); m; m = re.exec(source)) {
    texts.push(source.slice(last, m.index));
    maths.push(m[1] !== undefined ? renderTex(m[1], { display: true, symbols }) : renderTex(m[2]!, { symbols }));
    last = re.lastIndex;
  }
  texts.push(source.slice(last));
  const parts = typograf(texts.join(MATH).replace(/\\\$/g, "$")).split(MATH);
  // правило типографа съело метку — по кускам, как раньше
  const safe = parts.length === texts.length ? parts.map(escapeHtml) : texts.map(text);
  return safe.map((t, i) => t + (maths[i] ?? "")).join("");
}

/** Тот же текст без разметки — для aria-label: формулы заменены их текстом из MathML («θ1 =»). */
export function inlineText(source: string): string {
  return source
    .replace(/\$\$([\s\S]+?)\$\$|\$((?:\\.|[^$\\])+?)\$/g, (_m, display: string | undefined, inline: string | undefined) => texToText(display ?? inline ?? ""))
    .replace(/\\\$/g, "$")
    .replace(/\s+/g, " ")
    .trim();
}
