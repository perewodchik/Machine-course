// Банк фрагментов итоговой проверки V.2 (S5.01): выводы из курсов ML, собранные из приёмов математики. Каждый фрагмент —
// формула реестра (content/formulas/ml/) с численно проверенными шагами и подложенными ошибками шагов (mutations);
// харнесс code/mlf/formulas.py проверяет, что каждая ошибка действительно отличается от верного шага.
// Из фрагмента собираются задачи с выбором трёх видов: «какое правило применено», «восстанови строку», «найди ошибку».
import type { ChoiceSpec } from "../exercises/types";
import { rng } from "../math/rng";
import { ru } from "./catalog";
import type { DerivationStep, Formula, FormulaId } from "./types";

/** Курс ML, к которому готовит фрагмент: по ошибкам строится карта готовности (S5.02). */
export type FragmentCourse = "ml-basics" | "ml-classic" | "deep-learning" | "unsupervised";

export interface FragmentEntry {
  formula: FormulaId;
  course: FragmentCourse;
}

/** Порядок — как в таблице карточки V.2 (docs/program/05-bridge.md). */
export const FRAGMENTS: readonly FragmentEntry[] = [
  { formula: "f.logistic-gradient", course: "ml-basics" },
  { formula: "f.logistic-hessian", course: "ml-basics" },
  { formula: "f.glm-response", course: "ml-basics" },
  { formula: "f.gda-mean", course: "ml-classic" },
  { formula: "f.svm-dual", course: "ml-classic" },
  { formula: "f.backprop-two-layer", course: "deep-learning" },
  { formula: "f.em-jensen", course: "unsupervised" },
  { formula: "f.pca-eigen", course: "unsupervised" },
];

export type FragmentAsk = "rule" | "fill" | "error";

export interface FragmentTaskOptions {
  ask: FragmentAsk;
  /** Номер шага с единицы. */
  step: number;
  /** Номер подложенной ошибки шага с единицы (для «найди ошибку»). */
  mutation?: number;
  seed?: number;
  /** Название правила или понятия по id: «Градиент линейной функции». */
  titleOf: (id: string) => string;
  /** Обоснования шагов всех фрагментов: из них берутся неверные варианты «какое правило». */
  pool: readonly string[];
}

// номер строки — слева текстом, а не \tag: на узком экране \tag справа наезжает на прокручиваемую формулу
const line = (tex: string, tag?: number) => `$$${tag ? `\\text{(${tag})}\\qquad ` : ""}${tex.replace(/\\changed\{/g, "{")}$$`;
const plain = (tex: string) => tex.replace(/\\changed\{/g, "{");

function stepOf(f: Formula, n: number): DerivationStep {
  const s = f.derivation?.steps[n - 1];
  if (!s) throw new Error(`${f.id}: нет шага ${n}`);
  return s;
}

/** Задача с выбором по фрагменту вывода. Тексты — с $…$, как у остальных упражнений. */
export function fragmentTask(f: Formula, o: FragmentTaskOptions): ChoiceSpec {
  const steps = f.derivation?.steps ?? [];
  const s = stepOf(f, o.step);
  const r = rng(o.seed ?? 1);
  const where = f.cs229?.[0] ? ` (CS229, «${f.cs229[0].section}»)` : "";
  const head = `Фрагмент «${f.title.ru}»${where}.`;
  const note = s.note ? ` ${ru(s.note)}` : "";

  if (o.ask === "rule") {
    if (!s.by.length) throw new Error(`${f.id}, шаг ${o.step}: нет обоснования by`);
    const right = o.titleOf(s.by[0]!);
    const own = new Set(s.by.map(o.titleOf));
    const others = r.shuffle([...new Set(o.pool.map(o.titleOf))].filter((t) => !own.has(t))).slice(0, 3);
    if (others.length < 2) throw new Error(`${f.id}: мало неверных вариантов для «какое правило»`);
    const prev = o.step > 1 ? line(stepOf(f, o.step - 1).tex) : "";
    return {
      kind: "choice",
      prompt: `${head} На чём стоит переход к строке ниже?${prev}${line(s.tex)}`,
      options: r.shuffle([
        { text: right, correct: true, why: `Да.${note}` },
        ...others.map((t) => ({ text: t, why: `Этот приём здесь не нужен: переход опирается на «${right}».${note}` })),
      ]),
    };
  }

  const ms = s.mutations ?? [];
  if (!ms.length) throw new Error(`${f.id}, шаг ${o.step}: нет mutations — неверных вариантов не из чего собрать`);

  if (o.ask === "fill") {
    const prev = o.step > 1 ? line(stepOf(f, o.step - 1).tex) : "";
    const next = o.step < steps.length ? line(stepOf(f, o.step + 1).tex) : "";
    return {
      kind: "choice",
      prompt: `${head} Какая строка стоит на месте вопроса?${prev}${line("\\boxed{\\;?\\;}")}${next}`,
      options: r.shuffle([{ text: `$${plain(s.tex)}$`, correct: true, why: `Верно.${note}` }, ...ms.map((m) => ({ text: `$${m.tex}$`, why: ru(m.why) }))]),
    };
  }

  // «найди ошибку»: шаг заменён подложенной ошибкой, остальные — верные
  const bad = ms[(o.mutation ?? 1) - 1];
  if (!bad) throw new Error(`${f.id}, шаг ${o.step}: нет ошибки ${o.mutation}`);
  const lines = steps.map((x, i) => line(i + 1 === o.step ? bad.tex : x.tex, i + 1)).join("");
  return {
    kind: "choice",
    prompt: `${head} В одной строке вывода ошибка. В какой?${lines}`,
    options: steps.map((x, i) => (i + 1 === o.step ? { text: `Строка ${i + 1}`, correct: true, why: ru(bad.why) } : { text: `Строка ${i + 1}`, why: `Строка ${i + 1} верна.${x.note ? ` ${ru(x.note)}` : ""}` })),
  };
}

/** Все обоснования шагов фрагментов — пул неверных вариантов для «какое правило». */
export function fragmentPool(formulas: readonly Formula[]): string[] {
  return [...new Set(formulas.flatMap((f) => (f.derivation?.steps ?? []).flatMap((s) => s.by)))];
}
