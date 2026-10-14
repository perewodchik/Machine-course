// Типограф для текста урока: кавычки «», неразрывные пробелы после коротких слов, тире.
// Только текст: код, формулы и числа с десятичной точкой не трогаем (точка — как в коде, docs/conventions/notation.md).
import Typograf from "typograf";

const tp = new Typograf({
  locale: ["ru", "en-US"],
  // символы, а не HTML-сущности: работаем с текстовыми узлами
  htmlEntity: { type: "default" },
  disableRule: [
    "ru/number/comma", // 0.5 → 0,5 — нельзя: десятичная точка, как в коде
    "common/number/digitGrouping", // 12345 → 12 345: числа в тексте пишем как в коде
    "common/number/fraction", // 1/2 → ½
    "common/space/trimLeft", // текст режется на узлы: пробел на краю узла — граница со ссылкой или кодом
    "common/space/trimRight",
    "common/space/delTrailingBlanks",
    "common/space/delLeadingBlanks",
    "common/space/delRepeatN",
    "common/space/replaceTab",
    "common/space/squareBracket",
    "common/space/bracket",
    "common/space/beforeBracket", // f(x) → f (x)
    "common/space/insertFinalNewline",
  ],
});

export function typograf(text: string): string {
  return tp.execute(text);
}
