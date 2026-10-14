// Ядро формул: макросы курса и настройки KaTeX 0.19. Один модуль для MDX (remark/rehype) и компонентов (<Formula>).
// Символ с ролью пишется \sym{name}{tex}; роль берётся из таблицы symbols (формулы или frontmatter урока).
import katex, { type KatexOptions } from "katex";
import type { SymbolRole, SymbolSpec } from "../../lib/content/types";

/** Роль символа → слот цвета дизайн-системы: s1 бирюза, s2 оранжевый, s3 пурпур, s4 карандаш. */
export const ROLE_SLOT: Record<SymbolRole, 1 | 2 | 3 | 4> = { data: 1, param: 2, target: 3, aux: 4 };

/** Макросы курса (docs/conventions/notation.md). */
export const MACROS: Readonly<Record<string, string>> = {
  // символ без роли (имя не объявлено): подсвечивается, но не красится; валидатор считает это ошибкой
  "\\sym": "\\htmlData{sym=#1}{\\htmlClass{sym}{#2}}",
  // символ с ролью: \symr{имя}{слот}{tex}; сюда переписывает assignRoles
  "\\symr": "\\htmlData{sym=#1}{\\htmlClass{sym s#2}{#3}}",
  "\\changed": "\\htmlClass{changed}{#1}",
  // правка красной ручкой в «Типичной ошибке»: \struck{неверно} \fix{исправление}
  "\\struck": "\\htmlClass{struck}{#1}",
  "\\fix": "\\htmlClass{fix}{#1}",
  "\\T": "^{\\top}",
  "\\R": "\\mathbb{R}",
  "\\E": "\\mathbb{E}",
  "\\Var": "\\operatorname{Var}",
  "\\Cov": "\\operatorname{Cov}",
  "\\tr": "\\operatorname{tr}",
  "\\diag": "\\operatorname{diag}",
  "\\argmin": "\\operatorname*{arg\\,min}",
  "\\argmax": "\\operatorname*{arg\\,max}",
  "\\softmax": "\\operatorname{softmax}",
};

/** HTML-команды KaTeX, которые разрешены: только данные и класс для подсветки символов. \href, \url, \htmlStyle, \htmlId, \includegraphics — нет. */
export const TRUSTED_COMMANDS: ReadonlySet<string> = new Set(["\\htmlData", "\\htmlClass"]);

export const katexOptions: KatexOptions = {
  // копия: KaTeX дописывает в объект макросов определения \gdef, общий объект нельзя портить
  get macros() {
    return { ...MACROS };
  },
  trust: (ctx) => TRUSTED_COMMANDS.has(ctx.command),
  // KaTeX ≥ 0.19 предупреждает о \htmlData, если strict не ответил явно
  strict: (code: string) => (code === "htmlExtension" ? "ignore" : "warn"),
  throwOnError: true,
};

const SYM = /\\sym\{([A-Za-z][A-Za-z0-9_]*)\}/g;

/** Переписывает \sym{name}{…} в \symr{name}{слот}{…} по ролям из таблицы символов. Имена без роли остаются \sym. */
export function assignRoles(tex: string, symbols: readonly Pick<SymbolSpec, "name" | "role">[] = []): string {
  if (!symbols.length) return tex;
  const slots = new Map(symbols.flatMap((s) => (s.role ? [[s.name, ROLE_SLOT[s.role]] as const] : [])));
  return tex.replace(SYM, (whole, name: string) => {
    const slot = slots.get(name);
    return slot ? `\\symr{${name}}{${slot}}` : whole;
  });
}

/** Имена символов, упомянутые через \sym в TeX (для валидатора и легенды). */
export function symbolNames(tex: string): string[] {
  return [...new Set([...tex.matchAll(SYM)].map((m) => m[1]!))];
}

/** TeX → HTML при сборке. Ошибка TeX роняет сборку с текстом формулы. */
export function renderTex(tex: string, opts: { display?: boolean; symbols?: readonly SymbolSpec[] } = {}): string {
  try {
    return katex.renderToString(assignRoles(tex, opts.symbols), { ...katexOptions, displayMode: opts.display ?? false });
  } catch (e) {
    throw new Error(`KaTeX не разобрал формулу «${tex}»: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
  }
}

/** Текст формулы для доступного имени (aria-label): символы из MathML KaTeX — «θ», «X⊤». */
export function texToText(tex: string): string {
  const mathml = katex.renderToString(tex, { ...katexOptions, output: "mathml" });
  return mathml
    .replace(/<annotation[\s\S]*?<\/annotation>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
