// Чтение токенов из tokens.css при сборке: значения светлой и тёмной темы и контраст WCAG.
// Нужно витрине /lab и тестам контраста (tests/unit/tokens.test.ts).
// ?raw: Vite кладёт текст файла в сборку — путь к файлу после сборки не нужен
import tokensCss from "./tokens.css?raw";

export type TokenMap = Record<string, string>;

/** Тело блока CSS после селектора: до парной закрывающей скобки. */
function block(css: string, selector: string): string {
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`tokens.css: нет блока ${selector}`);
  let i = css.indexOf("{", start) + 1;
  const from = i;
  for (let depth = 1; depth > 0; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") depth--;
  }
  return css.slice(from, i - 1);
}

function vars(body: string): TokenMap {
  const out: TokenMap = {};
  for (const m of body.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) out[m[1]!] = m[2]!.trim();
  return out;
}

export interface Themes {
  light: TokenMap;
  dark: TokenMap;
  /** Блок тёмной темы для системной настройки (должен совпадать с блоком переключателя). */
  darkSystem: TokenMap;
}

export function readTokens(css: string = tokensCss): Themes {
  const light = vars(block(css, ":root {"));
  const darkSystem = vars(block(block(css, "@media (prefers-color-scheme: dark)"), ':root:not([data-theme="light"])'));
  const darkToggle = vars(block(css, ':root[data-theme="dark"] {'));
  return { light, dark: { ...light, ...darkToggle }, darkSystem };
}

/** Значение токена с разворотом var(--x). */
export function resolve(tokens: TokenMap, name: string): string {
  let v = tokens[name] ?? "";
  for (let guard = 0; v.startsWith("var(--") && guard < 10; guard++) v = tokens[v.slice(6, -1)] ?? "";
  return v;
}

const lum = (hex: string) => {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0]! + 0.7152 * v[1]! + 0.0722 * v[2]!;
};

/** Контраст WCAG двух цветов #rrggbb. */
export function contrast(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
}
