// Генераторы задач по вероятности (урок III.3): формула полной вероятности и Байес.
// Ответ — десятичная дробь (вероятность), ввод с точкой или запятой; допуск — полпроцента.
import { rng } from "../../math/rng";
import type { Generator } from "../types";

const round = (v: number, k = 4) => Math.round(v * 10 ** k) / 10 ** k;
const perc = (v: number) => `${round(v * 100, 2)}\u00a0%`; // в тексте, не в формуле: без обратной косой; пробел — как в уроках

export const totalProbability: Generator = {
  id: "prob.total-probability",
  version: 1,
  title: "Формула полной вероятности",
  make(seed) {
    const r = rng(seed);
    const shares = r.pick([[0.5, 0.3, 0.2], [0.4, 0.35, 0.25], [0.6, 0.25, 0.15], [0.45, 0.35, 0.2]]);
    const defects = [r.int(1, 5) / 100, r.int(1, 5) / 100, r.int(1, 5) / 100];
    const answer = round(shares.reduce((s, w, i) => s + w * defects[i]!, 0));
    const terms = shares.map((w, i) => `${w} \\cdot ${defects[i]}`).join(" + ");
    return {
      kind: "numeric",
      prompt: String.raw`Детали делают три станка: первый — ${perc(shares[0]!)} всех деталей, второй — ${perc(shares[1]!)}, третий — ${perc(shares[2]!)}. Доля брака у них — ${perc(defects[0]!)}, ${perc(defects[1]!)} и ${perc(defects[2]!)}. Какова вероятность, что случайная деталь бракованная?`,
      label: String.raw`$P(\text{брак}) =$`,
      answer,
      tol: 0.0005,
      hints: [
        String.raw`Станки разбивают все детали на три группы: $P(\text{брак}) = \sum_k P(\text{брак} \mid \text{станок } k)\, P(\text{станок } k)$.`,
        String.raw`$P(\text{брак}) = ${terms}$.`,
      ],
      right: String.raw`$P(\text{брак}) = ${terms} = ${answer}$.`,
      wrong: "Каждую долю брака нужно умножить на долю станка — и только потом сложить.",
    };
  },
};

export const bayesTest: Generator = {
  id: "prob.bayes-test",
  version: 1,
  title: "Медицинский тест: формула Байеса",
  make(seed) {
    const r = rng(seed);
    const prevalence = r.pick([0.005, 0.01, 0.02, 0.05]);
    const sensitivity = r.pick([0.8, 0.9, 0.95, 0.99]);
    const falsePositive = r.pick([0.01, 0.05, 0.1]);
    const evidence = sensitivity * prevalence + falsePositive * (1 - prevalence);
    const answer = round((sensitivity * prevalence) / evidence, 3);
    return {
      kind: "numeric",
      prompt: String.raw`Болезнь встречается у ${perc(prevalence)} людей. Тест находит ${perc(sensitivity)} больных и ошибочно срабатывает у ${perc(falsePositive)} здоровых. Тест положителен. Какова вероятность, что человек болен?`,
      label: String.raw`$P(\text{болен} \mid +) =$`,
      answer,
      tol: 0.005,
      hints: [
        String.raw`Сначала формула полной вероятности: $P(+) = P(+ \mid \text{болен})\, P(\text{болен}) + P(+ \mid \text{здоров})\, P(\text{здоров})$.`,
        String.raw`$P(+) = ${sensitivity} \cdot ${prevalence} + ${falsePositive} \cdot ${round(1 - prevalence)} = ${round(evidence, 5)}$.`,
        String.raw`$P(\text{болен} \mid +) = ${sensitivity} \cdot ${prevalence} / ${round(evidence, 5)}$.`,
      ],
      right: String.raw`$P(\text{болен} \mid +) = \dfrac{${sensitivity} \cdot ${prevalence}}{${round(evidence, 5)}} \approx ${answer}$: базовая частота ${perc(prevalence)} тянет ответ вниз.`,
      wrong: String.raw`Не путайте $P(+ \mid \text{болен}) = ${sensitivity}$ и $P(\text{болен} \mid +)$. Числитель — $P(+ \mid \text{болен})\, P(\text{болен})$, знаменатель — $P(+)$ по формуле полной вероятности.`,
    };
  },
};

export const union: Generator = {
  id: "prob.union",
  version: 1,
  title: "Вероятность объединения",
  make(seed) {
    const r = rng(seed);
    const pa = r.pick([0.3, 0.4, 0.5, 0.6]);
    const pb = r.pick([0.2, 0.3, 0.45, 0.5]);
    const pab = r.pick([0.1, 0.15, 0.2].filter((x) => x < Math.min(pa, pb)));
    const answer = round(pa + pb - pab);
    return {
      kind: "numeric",
      prompt: String.raw`$P(A) = ${pa}$, $P(B) = ${pb}$, $P(A \cap B) = ${pab}$. Найдите $P(A \cup B)$.`,
      label: String.raw`$P(A \cup B) =$`,
      answer,
      tol: 0.005,
      hints: [String.raw`В сумме $P(A) + P(B)$ пересечение $A \cap B$ посчитано дважды.`],
      right: String.raw`$P(A \cup B) = P(A) + P(B) - P(A \cap B) = ${pa} + ${pb} - ${pab} = ${answer}$.`,
      wrong: String.raw`Если получилось $${round(pa + pb)}$, пересечение учтено дважды: его нужно вычесть один раз.`,
    };
  },
};

export const conditionalTable: Generator = {
  id: "prob.conditional-table",
  version: 1,
  title: "Условная вероятность по таблице",
  make(seed) {
    const r = rng(seed);
    const [a, b, c, d] = [r.int(2, 9) * 5, r.int(1, 6) * 5, r.int(1, 8) * 5, r.int(2, 9) * 5];
    const answer = round(a / (a + b), 3);
    return {
      kind: "numeric",
      prompt: String.raw`Студентов спросили, ходили ли они на консультацию, и посмотрели, сдали ли они экзамен: $$\begin{array}{l|cc} & \text{сдал} & \text{не сдал} \\ \hline \text{ходил} & ${a} & ${b} \\ \text{не ходил} & ${c} & ${d} \end{array}$$ Какова вероятность сдать экзамен для того, кто ходил на консультацию?`,
      label: String.raw`$P(\text{сдал} \mid \text{ходил}) =$`,
      answer,
      tol: 0.005,
      hints: [String.raw`Условие сужает выборку: остаются только те, кто ходил, — их $${a + b}$.`],
      right: String.raw`$P(\text{сдал} \mid \text{ходил}) = \dfrac{${a}}{${a} + ${b}} \approx ${answer}$.`,
      wrong: String.raw`Делить нужно на число ходивших ($${a + b}$), а не на всех ($${a + b + c + d}$) и не на всех сдавших ($${a + c}$).`,
    };
  },
};

type Dice = readonly [number, number];
const DICE: Dice[] = Array.from({ length: 36 }, (_, i) => [Math.floor(i / 6) + 1, (i % 6) + 1] as const);

/** Урок III.1: вероятность события на двух кубиках — доля из 36 равновозможных исходов. */
export const diceEvent: Generator = {
  id: "prob.dice-event",
  version: 1,
  title: "Событие на двух кубиках",
  make(seed) {
    const r = rng(seed);
    const s = r.int(3, 10);
    const m = r.int(2, 5);
    const kinds = [
      { tex: String.raw`сумма очков равна $${s}$`, has: ([a, b]: Dice) => a + b === s, hint: String.raw`Выпишите пары $(a, b)$ с $a + b = ${s}$.` },
      { tex: String.raw`сумма очков не меньше $${s}$`, has: ([a, b]: Dice) => a + b >= s, hint: String.raw`Посчитайте пары по суммам $${s}, ${s + 1}, \ldots, 12$ — или через дополнение.` },
      { tex: "выпала хотя бы одна шестёрка", has: ([a, b]: Dice) => a === 6 || b === 6, hint: String.raw`Через дополнение: «ни одной шестёрки» — $5 \cdot 5$ исходов.` },
      { tex: String.raw`наибольшее из очков не больше $${m}$`, has: ([a, b]: Dice) => Math.max(a, b) <= m, hint: String.raw`Оба кубика показывают от $1$ до $${m}$: $${m} \cdot ${m}$ исходов.` },
    ];
    const k = kinds[(seed - 1) % kinds.length]!;
    const n = DICE.filter(k.has).length;
    const answer = Math.round((n / 36) * 1000) / 1000;
    return {
      kind: "numeric",
      prompt: `Бросаем два кубика. Найдите вероятность, что ${k.tex}.`,
      label: String.raw`$P =$`,
      answer,
      tol: 0.005,
      hints: [String.raw`Исходов $36$, все равновозможны: $P = \lvert E \rvert / 36$.`, k.hint],
      right: String.raw`Подходит $${n}$ исходов из $36$: $P = ${n}/36 \approx ${answer}$.`,
      wrong: String.raw`Считайте упорядоченные пары: $(1, 2)$ и $(2, 1)$ — разные исходы. Подходящих пар $${n}$.`,
    };
  },
};

const binom = (n: number, k: number) => {
  let c = 1;
  for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i;
  return Math.round(c);
};

/** Урок III.1 ★: число мономов степени не выше k от d переменных — C(d + k, k) (пригодится для полиномиальных ядер). */
export const monomials: Generator = {
  id: "prob.monomials",
  version: 1,
  title: "Число мономов",
  make(seed) {
    const r = rng(seed);
    const d = r.int(2, 5);
    const k = r.int(2, 3);
    const answer = binom(d + k, k);
    return {
      kind: "numeric",
      prompt: String.raw`Сколько мономов $x_1^{a_1} \cdots x_${d}^{a_${d}}$ степени не выше $${k}$ (включая константу $1$) можно составить из $${d}$ переменных?`,
      label: "Число мономов:",
      answer,
      tol: 0,
      hints: [String.raw`Добавьте фиктивную переменную $a_0 = ${k} - (a_1 + \cdots + a_${d})$: нужно разложить $${k}$ на $${d + 1}$ неотрицательных слагаемых.`, String.raw`«Шары и перегородки»: $${k}$ шаров и $${d}$ перегородок, $\binom{${d + k}}{${k}}$ способов.`],
      right: String.raw`$\binom{d + k}{k} = \binom{${d + k}}{${k}} = ${answer}$.`,
      wrong: String.raw`Не забудьте константу и мономы меньших степеней: ответ — $\binom{${d + k}}{${k}}$, а не только мономы степени ровно $${k}$.`,
    };
  },
};

const EV: readonly { tex: string; has: (o: Dice) => boolean }[] = [
  { tex: "сумма очков не меньше $8$", has: ([a, b]) => a + b >= 8 },
  { tex: "на первом кубике чётное число", has: ([a]) => a % 2 === 0 },
  { tex: "выпал дубль", has: ([a, b]) => a === b },
  { tex: "на втором кубике $6$", has: ([, b]) => b === 6 },
  { tex: "сумма очков не больше $4$", has: ([a, b]) => a + b <= 4 },
  { tex: "хотя бы на одном кубике $1$", has: ([a, b]) => a === 1 || b === 1 },
  { tex: "сумма очков чётная", has: ([a, b]) => (a + b) % 2 === 0 },
];

/** Урок III.2: P(A | B) на двух кубиках — условие сужает мир до исходов B. */
export const condDice: Generator = {
  id: "prob.cond-dice",
  version: 1,
  title: "Условная вероятность на кубиках",
  make(seed) {
    const r = rng(seed);
    let i: number, j: number, nab: number, nb: number;
    for (;;) {
      [i, j] = [r.int(0, EV.length - 1), r.int(0, EV.length - 1)];
      nb = DICE.filter(EV[j]!.has).length;
      nab = DICE.filter((o) => EV[i]!.has(o) && EV[j]!.has(o)).length;
      if (i !== j && nab > 0) break;
    }
    const [A, B] = [EV[i]!, EV[j]!];
    const na = DICE.filter(A.has).length;
    const nba = nab; // |A ∩ B| = |B ∩ A|
    const answer = Math.round((nab / nb) * 1000) / 1000;
    return {
      kind: "numeric",
      prompt: `Бросаем два кубика. Известно, что ${B.tex}. Найдите вероятность, что ${A.tex}.`,
      label: String.raw`$P(A \mid B) =$`,
      answer,
      tol: 0.005,
      hints: [String.raw`Условие сужает мир: остаются $${nb}$ исходов события $B$.`, String.raw`$P(A \mid B) = \lvert A \cap B \rvert / \lvert B \rvert$.`],
      right: String.raw`$\lvert A \cap B \rvert = ${nab}$, $\lvert B \rvert = ${nb}$: $P(A \mid B) = ${nab}/${nb} \approx ${answer}$.`,
      wrong: String.raw`Делите на число исходов условия $B$ (их $${nb}$), а не на $36$ и не на $\lvert A \rvert = ${na}$ — это было бы $P(B \mid A) = ${nba}/${na}$.`,
    };
  },
};

/** Урок III.2: независимы ли события — проверка P(A ∩ B) = P(A) P(B); среди вариантов — несовместные. */
export const independenceCheck: Generator = {
  id: "prob.independence-check",
  version: 1,
  title: "Независимы ли события",
  make(seed) {
    // пары: первая — независимые, вторая — зависимые совместные, третья — несовместные
    const pairs: readonly [number, number][][] = [
      [[1, 3], [1, 2], [6, 1]],
      [[0, 1], [0, 2], [2, 5]],
      [[0, 4], [4, 0]],
    ];
    const kind = (seed - 1) % 3;
    const list = pairs[kind]!;
    const [i, j] = list[rng(seed).int(0, list.length - 1)]!;
    const [A, B] = [EV[i]!, EV[j]!];
    const na = DICE.filter(A.has).length;
    const nb = DICE.filter(B.has).length;
    const nab = DICE.filter((o) => A.has(o) && B.has(o)).length;
    const indep = 36 * nab === na * nb;
    const facts = String.raw`$P(A) = ${na}/36$, $P(B) = ${nb}/36$, $P(A \cap B) = ${nab}/36$, а $P(A)\,P(B) = ${na * nb}/1296 = ${Math.round(((na * nb) / 36) * 100) / 100}/36$`;
    const why = indep ? `${facts}: равны — события независимы.` : nab === 0 ? `${facts}: события несовместны, и знание, что произошло $B$, исключает $A$ — сильнейшая зависимость.` : `${facts}: не равны — события зависимы.`;
    return {
      kind: "choice",
      prompt: `Бросаем два кубика. $A$ — ${A.tex}, $B$ — ${B.tex}. Независимы ли $A$ и $B$?`,
      options: [
        { text: "Независимы", correct: indep, why },
        { text: "Зависимы", correct: !indep, why },
      ],
      hints: [String.raw`Сравните $P(A \cap B)$ с $P(A)\,P(B)$ — или $P(A \mid B)$ с $P(A)$.`],
    };
  },
};
