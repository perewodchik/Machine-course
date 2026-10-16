// Числа и подписи на рисунках: десятичная точка (как в коде и CS229), настоящий минус, индексы.
const MINUS = "−";

/** 0.5 → «0.50», −1 → «−1.00». Ноль без знака. */
export function fmt(v: number, digits = 2): string {
  const s = v.toFixed(digits);
  return Number(s) === 0 ? s.replace("-", "") : s.replace("-", MINUS);
}

export interface LabelPart {
  text: string;
  sub?: boolean;
  /** Имя функции (cos, log, det …): прямым шрифтом, как \cos в формулах. */
  fn?: boolean;
}

const FN = /\b(cos|sin|tan|log|exp|det|tr|rank)\b/;

/** «θ_0 + θ_{12} x» → основа и индексы: индекс — один знак после «_» или группа в фигурных скобках. */
export function labelParts(label: string): LabelPart[] {
  const parts: LabelPart[] = [];
  let text = "";
  for (let i = 0; i < label.length; i++) {
    if (label[i] !== "_") {
      text += label[i];
      continue;
    }
    if (text) parts.push({ text });
    text = "";
    if (label[i + 1] === "{") {
      const end = label.indexOf("}", i + 2);
      parts.push({ text: label.slice(i + 2, end < 0 ? undefined : end), sub: true });
      i = end < 0 ? label.length : end;
    } else if (i + 1 < label.length) {
      parts.push({ text: label[i + 1]!, sub: true });
      i++;
    }
  }
  if (text) parts.push({ text });
  return parts.flatMap((p) => (p.sub ? [p] : p.text.split(FN).filter(Boolean).map((t) => (FN.test(t) ? { text: t, fn: true } : { text: t }))));
}

/** Текст для скринридера: «θ_0» → «θ0». */
export function plainLabel(label: string): string {
  return labelParts(label)
    .map((p) => p.text)
    .join("");
}
