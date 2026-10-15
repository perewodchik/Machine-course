// Разбор ответа ученика: точка и запятая, настоящий минус, пробелы, дробь «1/2», экспонента «1e-3».
// Вывод — всегда с десятичной точкой (как в коде и CS229).

/** Число из строки или null, если это не число. */
export function parseNumber(raw: string): number | null {
  const s = raw
    .trim()
    .replace(/[−‒–]/g, "-") // минус и тире → дефис-минус
    .replace(/\s+/g, "")
    .replace(",", ".");
  if (!s) return null;
  const frac = /^([+-]?\d+(?:\.\d+)?)\/([+-]?\d+(?:\.\d+)?)$/.exec(s);
  if (frac) {
    const d = Number(frac[2]);
    return d === 0 ? null : Number(frac[1]) / d;
  }
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(s)) return null;
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
}

/** 0.5 → «0.5», −0.25 → «−0.25»; лишние нули убираются, не больше digits знаков. */
export function formatNumber(v: number, digits = 4): string {
  const r = Number(v.toFixed(digits));
  const s = String(Object.is(r, -0) ? 0 : r);
  return s.replace("-", "−");
}
