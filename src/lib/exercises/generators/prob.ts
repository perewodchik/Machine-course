// Генераторы задач по вероятности (урок III.3): формула полной вероятности и Байес.
// Ответ — десятичная дробь (вероятность), ввод с точкой или запятой; допуск — полпроцента.
import { rng } from "../../math/rng";
import type { Generator } from "../types";

const par = (x: number) => (x < 0 ? `(${x})` : String(x));
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

/** Урок III.4: F(t) = P(X ≤ t) по таблице функции вероятности. */
export const pmfCdf: Generator = {
  id: "prob.pmf-cdf",
  version: 1,
  title: "Функция распределения по таблице",
  make(seed) {
    const r = rng(seed);
    const xs = [0, 1, 2, 3];
    // вероятности — десятые, в сумме 1
    const w = r.pick([
      [1, 2, 3, 4],
      [4, 3, 2, 1],
      [2, 2, 5, 1],
      [1, 5, 1, 3],
      [3, 1, 4, 2],
    ]);
    const ps = w.map((v) => v / 10);
    const t = r.pick([0.5, 1, 1.5, 2, 2.7]);
    const answer = round(ps.filter((_, i) => xs[i]! <= t).reduce((a, b) => a + b, 0));
    const row = xs.map((x, i) => `P(X = ${x}) = ${ps[i]}`).join(",\\ ");
    return {
      kind: "numeric",
      prompt: String.raw`$X$ принимает значения $0, 1, 2, 3$: $${row}$. Найдите $F(${t}) = P(X \le ${t})$.`,
      label: String.raw`$F(${t}) =$`,
      answer,
      tol: 0.005,
      hints: [String.raw`$F(t)$ — сумма вероятностей всех значений, не больших $t$.`],
      right: String.raw`Значения не больше $${t}$: ${xs.filter((x) => x <= t).map((x) => `$${x}$`).join(", ")}; $F(${t}) = ${answer}$.`,
      wrong: String.raw`$F(t)$ накапливает вероятности: не $P(X = t)$, а сумма $P(X = x)$ по всем $x \le ${t}$.`,
    };
  },
};

/** Урок III.4: P(a ≤ X ≤ b) — интеграл плотности; чётный seed — равномерное, нечётный — показательное. */
export const intervalProb: Generator = {
  id: "prob.interval-prob",
  version: 1,
  title: "Вероятность интервала по плотности",
  make(seed) {
    const r = rng(seed);
    if (seed % 2 === 0) {
      const L = r.pick([2, 4, 5, 10]);
      const a = r.int(0, L - 2);
      const bb = r.int(a + 1, L);
      const answer = round((bb - a) / L);
      return {
        kind: "numeric",
        prompt: String.raw`$X$ равномерна на $[0, ${L}]$: плотность $p(x) = 1/${L}$ на отрезке и ноль вне его. Найдите $P(${a} \le X \le ${bb})$.`,
        label: String.raw`$P =$`,
        answer,
        tol: 0.005,
        hints: [String.raw`$P(a \le X \le b) = \int_a^b p(x)\, dx$ — площадь прямоугольника.`],
        right: String.raw`$\int_{${a}}^{${bb}} \frac{1}{${L}}\, dx = \frac{${bb - a}}{${L}} = ${answer}$.`,
        wrong: String.raw`Вероятность — площадь под плотностью, а не её значение: ширина $${bb - a}$ на высоту $1/${L}$.`,
      };
    }
    const lam = r.pick([1, 2, 0.5]);
    const [a, bb] = r.pick([
      [0, 1],
      [1, 2],
      [0, 2],
      [0.5, 1.5],
    ] as const);
    const answer = round(Math.exp(-lam * a) - Math.exp(-lam * bb));
    return {
      kind: "numeric",
      prompt: String.raw`$X$ — показательная: $p(x) = ${lam === 1 ? "" : lam}e^{-${lam === 1 ? "" : lam}x}$ при $x \ge 0$. Найдите $P(${a} \le X \le ${bb})$.`,
      label: String.raw`$P =$`,
      answer,
      tol: 0.005,
      hints: [String.raw`Первообразная $\lambda e^{-\lambda x}$ — это $-e^{-\lambda x}$; $F(x) = 1 - e^{-\lambda x}$.`],
      right: String.raw`$F(${bb}) - F(${a}) = e^{-${lam * a}} - e^{-${lam * bb}} \approx ${answer}$.`,
      wrong: String.raw`$P(a \le X \le b) = F(b) - F(a) = e^{-\lambda a} - e^{-\lambda b}$; значение плотности в точке — не вероятность.`,
    };
  },
};

/** Урок III.4: плотность Y = aX + c при X равномерной на [0, 1] — 1/|a| на образе отрезка (с модулем). */
export const linearDensity: Generator = {
  id: "prob.linear-density",
  version: 1,
  title: "Плотность линейной функции",
  make(seed) {
    const r = rng(seed);
    const a = r.pick([2, 3, 4, 0.5, -2, -4]);
    const c = r.int(-2, 2);
    const answer = round(1 / Math.abs(a));
    const lo = Math.min(c, a + c);
    const hi = Math.max(c, a + c);
    return {
      kind: "numeric",
      prompt: String.raw`$X$ равномерна на $[0, 1]$, $Y = ${a}X ${c < 0 ? "-" : "+"} ${Math.abs(c)}$. Какова плотность $Y$ внутри отрезка $[${lo}, ${hi}]$?`,
      label: String.raw`$p_Y(y) =$`,
      answer,
      tol: 0.005,
      hints: [String.raw`$p_Y(y) = p_X(g^{-1}(y))\, \lvert (g^{-1})'(y) \rvert$, $g^{-1}(y) = (y - ${par(c)})/${par(a)}$.`],
      right: String.raw`$p_X = 1$ на $[0, 1]$, $\lvert (g^{-1})' \rvert = 1/${Math.abs(a)}$: $p_Y = ${answer}$ на отрезке длины $${Math.abs(a)}$ — площадь снова $1$.`,
      wrong: a < 0 ? String.raw`Плотность не бывает отрицательной: нужен модуль, $1/\lvert ${a} \rvert$.` : String.raw`Отрезок растянулся в $${a}$ раз, поэтому плотность во столько же раз меньше: площадь под ней должна остаться $1$.`,
    };
  },
};

/** Урок III.5: матожидание (нечётный seed) или дисперсия (чётный) по таблице функции вероятности. */
export const evVar: Generator = {
  id: "prob.ev-var",
  version: 1,
  title: "Матожидание и дисперсия по таблице",
  make(seed) {
    const r = rng(seed);
    const xs = r.pick([
      [0, 1, 2],
      [1, 2, 4],
      [-1, 0, 2],
      [0, 2, 3],
    ]);
    const ps = r.pick([
      [0.2, 0.5, 0.3],
      [0.5, 0.25, 0.25],
      [0.1, 0.6, 0.3],
      [0.4, 0.4, 0.2],
    ]);
    const m = xs.reduce((s, x, i) => s + x * ps[i]!, 0);
    const m2 = xs.reduce((s, x, i) => s + x * x * ps[i]!, 0);
    const v = m2 - m * m;
    const wantVar = seed % 2 === 0;
    const answer = round(wantVar ? v : m);
    const row = xs.map((x, i) => `P(X = ${x}) = ${ps[i]}`).join(",\\ ");
    return {
      kind: "numeric",
      prompt: String.raw`$X$ принимает значения $${xs.join(", ")}$: $${row}$. Найдите $${wantVar ? String.raw`\operatorname{Var} X` : String.raw`\mathbb{E}X`}$.`,
      label: wantVar ? String.raw`$\operatorname{Var} X =$` : String.raw`$\mathbb{E}X =$`,
      answer,
      tol: 0.005,
      hints: wantVar ? [String.raw`$\operatorname{Var} X = \mathbb{E}X^2 - (\mathbb{E}X)^2$; $\mathbb{E}X = ${round(m)}$.`] : [String.raw`$\mathbb{E}X = \sum_x x\, P(X = x)$.`],
      right: wantVar ? String.raw`$\mathbb{E}X^2 = ${round(m2)}$, $(\mathbb{E}X)^2 = ${round(m * m)}$, $\operatorname{Var} X = ${answer}$.` : String.raw`$\mathbb{E}X = ${xs.map((x, i) => `${par(x)} \\cdot ${ps[i]}`).join(" + ")} = ${answer}$.`,
      wrong: wantVar ? String.raw`$\mathbb{E}X^2$ — среднее квадратов, $\sum_x x^2 P(X = x) = ${round(m2)}$; из него вычитают квадрат среднего $${round(m * m)}$.` : String.raw`Каждое значение умножьте на его вероятность и сложите; простое среднее значений $${round(xs.reduce((a, b) => a + b, 0) / 3)}$ годится, только если вероятности равны.`,
    };
  },
};

/** Урок III.5: Var(aX + b) = a² Var X — сдвиг не меняет разброс, множитель входит в квадрате. */
export const varLinear: Generator = {
  id: "prob.var-linear",
  version: 1,
  title: "Дисперсия линейной функции",
  make(seed) {
    const r = rng(seed);
    const v = r.pick([1, 2, 4, 9]);
    const a = r.pick([2, 3, -2, -3, 0.5]);
    const b = r.int(-5, 5);
    const answer = round(a * a * v);
    return {
      kind: "numeric",
      prompt: String.raw`$\operatorname{Var} X = ${v}$. Найдите $\operatorname{Var}(${a}X ${b < 0 ? "-" : "+"} ${Math.abs(b)})$.`,
      label: String.raw`$\operatorname{Var} =$`,
      answer,
      tol: 0.005,
      hints: [String.raw`Сдвиг на константу не меняет отклонений от среднего, а множитель $a$ умножает каждое отклонение на $a$, его квадрат — на $a^2$.`],
      right: String.raw`$\operatorname{Var}(aX + b) = a^2 \operatorname{Var} X = ${a * a} \cdot ${v} = ${answer}$.`,
      wrong: String.raw`Дисперсия не бывает отрицательной и не зависит от сдвига $${b}$: $a^2 \operatorname{Var} X = ${par(a)}^2 \cdot ${v}$.`,
    };
  },
};

/** Урок III.5: неравенство Йенсена — сравнить f(E X) и E f(X) для выпуклой или вогнутой f. */
export const jensen: Generator = {
  id: "prob.jensen",
  version: 1,
  title: "Неравенство Йенсена",
  make(seed) {
    const fs = [
      { tex: "x^2", convex: true, why: String.raw`$x^2$ выпукла ($f'' = 2 > 0$), поэтому $f(\mathbb{E}X) \le \mathbb{E}f(X)$; разница — $\operatorname{Var} X$.` },
      { tex: String.raw`\log x`, convex: false, why: String.raw`$\log x$ вогнута ($f'' = -1/x^2 < 0$), неравенство переворачивается: $\mathbb{E}\log X \le \log \mathbb{E}X$. На этом стоит нижняя оценка в алгоритме EM (CS229).` },
      { tex: "e^x", convex: true, why: String.raw`$e^x$ выпукла: $e^{\mathbb{E}X} \le \mathbb{E}e^X$.` },
      { tex: String.raw`\sqrt{x}`, convex: false, why: String.raw`$\sqrt{x}$ вогнута: $\mathbb{E}\sqrt{X} \le \sqrt{\mathbb{E}X}$.` },
    ];
    const f = fs[(seed - 1) % fs.length]!;
    return {
      kind: "choice",
      prompt: String.raw`$X$ — положительная величина, не константа. Сравните $f(\mathbb{E}X)$ и $\mathbb{E}f(X)$ для $f(x) = ${f.tex}$.`,
      options: [
        { text: String.raw`$f(\mathbb{E}X) < \mathbb{E}f(X)$`, correct: f.convex, why: f.why },
        { text: String.raw`$f(\mathbb{E}X) > \mathbb{E}f(X)$`, correct: !f.convex, why: f.why },
        { text: String.raw`$f(\mathbb{E}X) = \mathbb{E}f(X)$`, correct: false, why: String.raw`Равенство — только для линейной $f$ или постоянной $X$. ${f.why}` },
      ],
      hints: [String.raw`Неравенство Йенсена: для выпуклой $f$ — $f(\mathbb{E}X) \le \mathbb{E}f(X)$; для вогнутой — наоборот.`],
    };
  },
};

/** Урок III.6: матожидание или дисперсия известного семейства по параметрам. */
export const familyMoments: Generator = {
  id: "prob.family-moments",
  version: 1,
  title: "Моменты распределения",
  make(seed) {
    const r = rng(seed);
    const fams = [
      () => {
        const [n, phi] = [r.pick([10, 20, 50]), r.pick([0.1, 0.2, 0.5])];
        return { tex: String.raw`$X$ — число успехов в $${n}$ независимых испытаниях с вероятностью успеха $${phi}$`, mean: n * phi, variance: n * phi * (1 - phi), fm: String.raw`n\phi`, fv: String.raw`n\phi(1 - \phi)` };
      },
      () => {
        const phi = r.pick([0.1, 0.2, 0.25, 0.5]);
        return { tex: String.raw`$X$ — номер первого успеха в независимых испытаниях с вероятностью успеха $${phi}$`, mean: 1 / phi, variance: (1 - phi) / (phi * phi), fm: String.raw`1/\phi`, fv: String.raw`(1 - \phi)/\phi^2` };
      },
      () => {
        const lam = r.pick([2, 3.5, 5, 8]);
        return { tex: String.raw`$X$ — пуассоновская с $\lambda = ${lam}$`, mean: lam, variance: lam, fm: String.raw`\lambda`, fv: String.raw`\lambda` };
      },
      () => {
        const phi = r.pick([0.3, 0.6, 0.8]);
        return { tex: String.raw`$X$ — бернуллиевская с $P(X = 1) = ${phi}$`, mean: phi, variance: phi * (1 - phi), fm: String.raw`\phi`, fv: String.raw`\phi(1 - \phi)` };
      },
    ];
    const f = fams[(seed - 1) % fams.length]!();
    const wantVar = Math.floor((seed - 1) / fams.length) % 2 === 1;
    const answer = round(wantVar ? f.variance : f.mean);
    return {
      kind: "numeric",
      prompt: String.raw`${f.tex}. Найдите $${wantVar ? String.raw`\operatorname{Var} X` : String.raw`\mathbb{E}X`}$.`,
      label: wantVar ? String.raw`$\operatorname{Var} X =$` : String.raw`$\mathbb{E}X =$`,
      answer,
      tol: 0.005,
      hints: [String.raw`Сначала узнайте семейство по сюжету, потом возьмите его формулу.`],
      right: String.raw`$${wantVar ? f.fv : f.fm} = ${answer}$.`,
      wrong: String.raw`Формула семейства: $\mathbb{E}X = ${f.fm}$, $\operatorname{Var} X = ${f.fv}$.`,
    };
  },
};

/** Урок III.6: вероятность значения — Пуассон (нечётный seed) или биномиальное (чётный). */
export const pointProb: Generator = {
  id: "prob.point-prob",
  version: 1,
  title: "Вероятность значения",
  make(seed) {
    const r = rng(seed);
    if (seed % 2 === 1) {
      const lam = r.pick([1, 2, 3]);
      const k = r.int(0, 3);
      const fact = [1, 1, 2, 6][k]!;
      const answer = round((Math.exp(-lam) * lam ** k) / fact);
      return {
        kind: "numeric",
        prompt: String.raw`Число звонков за минуту — пуассоновское с $\lambda = ${lam}$. Найдите вероятность ровно $${k}$ звонков.`,
        label: String.raw`$P(X = ${k}) =$`,
        answer,
        tol: 0.005,
        hints: [String.raw`$P(X = k) = e^{-\lambda} \lambda^k / k!$.`],
        right: String.raw`$e^{-${lam}} \cdot ${lam}^{${k}} / ${k}! \approx ${answer}$.`,
        wrong: String.raw`Не забудьте множитель $e^{-\lambda} = e^{-${lam}} \approx ${round(Math.exp(-lam))}$ и деление на $${k}! = ${fact}$.`,
      };
    }
    const n = r.pick([4, 5, 6]);
    const phi = r.pick([0.2, 0.5]);
    const k = r.int(1, n - 1);
    let c = 1;
    for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i;
    const answer = round(c * phi ** k * (1 - phi) ** (n - k));
    return {
      kind: "numeric",
      prompt: String.raw`Монету с вероятностью орла $${phi}$ бросают $${n}$ раз. Найдите вероятность ровно $${k}$ орлов.`,
      label: String.raw`$P(X = ${k}) =$`,
      answer,
      tol: 0.005,
      hints: [String.raw`$P(X = k) = \binom{n}{k} \phi^k (1 - \phi)^{n - k}$: $\binom{${n}}{${k}} = ${c}$.`],
      right: String.raw`$${c} \cdot ${phi}^{${k}} \cdot ${round(1 - phi)}^{${n - k}} \approx ${answer}$.`,
      wrong: String.raw`Орлы могут выпасть в любых $${k}$ бросках из $${n}$: вероятность одной последовательности нужно умножить на $\binom{${n}}{${k}} = ${c}$.`,
    };
  },
};
