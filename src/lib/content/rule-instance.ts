// Правило с подставленными символами (S3.05): «(AB)ᵀ = BᵀAᵀ» при A = X, B = θ → «(Xθ)ᵀ = θᵀXᵀ», и так же
// его типичные ошибки. Из этого собираются неверные варианты задачи с выбором и диагноз ответа ученика.
import { ru } from "./catalog";
import type { Rule } from "./types";

export interface RuleInstance {
  lhs: string;
  rhs: string;
  mutations: { tex: string; why: string }[];
}

/**
 * Замена символов правила в TeX. Буквы подряд в формуле — отдельные символы («AB» — это A и B), а буквы имени команды
 * после обратной косой черты — нет (top, max). Символ-команда (theta) заменяется целиком.
 */
export function substitute(tex: string, bind: Readonly<Record<string, string>>, symbols: Rule["symbols"]): string {
  const map = new Map(symbols.filter((s) => bind[s.name] !== undefined).map((s) => [s.tex, bind[s.name]!]));
  let out = "";
  for (let i = 0; i < tex.length; ) {
    const tok = tex[i] === "\\" ? /^\\(?:[A-Za-z]+|.)/.exec(tex.slice(i))![0] : tex[i]!;
    out += map.has(tok) ? `{${map.get(tok)}}` : tok;
    i += tok.length;
  }
  return out;
}

export function instantiate(rule: Rule, bind: Readonly<Record<string, string>>): RuleInstance {
  const eq = rule.statement.indexOf("=");
  if (eq < 0) throw new Error(`${rule.id}: в утверждении нет «=»`);
  const sub = (t: string) => substitute(t, bind, rule.symbols).trim();
  return {
    lhs: sub(rule.statement.slice(0, eq)),
    rhs: sub(rule.statement.slice(eq + 1)),
    mutations: (rule.mutations ?? []).map((m) => ({ tex: sub(m.tex), why: ru(m.why) })),
  };
}
