// Переносы рядом со строчными формулами. Строка не начинается со знака препинания после формулы («. Модель…»),
// короткая формула не рвётся по «=» или «∣», однобуквенный предлог не висит в конце строки перед формулой.
// Формула со знаком после неё оборачивается в <span class="math-glue">; короткая — ещё и с классом is-short
// (CSS в src/styles/math.css: длинная формула внутри обёртки переносится, короткая — нет).

/** Знаки, которые не начинают строку: точка, запятая, кавычка «», скобка. */
export const PUNCT_AFTER = /^[.,;:!?…»)\]]+/;

/** Короткая формула — до стольких знаков видимого текста: «P(A ∣ B)», «XᵀXθ = Xᵀy». */
const SHORT = 16;
export const isShortMath = (visible: string) => visible.replace(/\s+/g, "").length <= SHORT;

/** Класс обёртки формулы: undefined — обёртка не нужна. */
export function glueClass(short: boolean, punct: boolean): string[] | undefined {
  if (!short && !punct) return undefined;
  return short ? ["math-glue", "is-short"] : ["math-glue"];
}

/**
 * Неразрывный пробел после короткого слова перед формулой: «к $y$», «и $X$». В строке формулы заменены меткой mark,
 * между текстом и меткой могут стоять метки границ узлов (gap). Типограф сам так не делает: после слова у него не буква.
 */
export function nbspBeforeMath(text: string, mark: string, gap = ""): string {
  const g = gap ? `${gap}*` : "";
  return text.replace(new RegExp(`(?<=^|[\\s(«—\u00a0])([а-яёa-z]{1,2}) (?=${g}${mark})`, "giu"), "$1\u00a0");
}
