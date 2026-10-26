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

/** Урок III.7: правило 68–95–99.7 — доля нормальной величины в интервале или за ним. */
export const normalRule: Generator = {
  id: "prob.normal-rule",
  version: 1,
  title: "Правило 68–95–99.7",
  make(seed) {
    const r = rng(seed);
    const mu = r.pick([0, 10, 100, 170]);
    const sigma = r.pick([2, 5, 10]);
    const k = r.pick([1, 2, 3]);
    const inside = { 1: 0.68, 2: 0.95, 3: 0.997 }[k]!;
    const tail = seed % 2 === 0;
    const answer = round(tail ? (1 - inside) / 2 : inside);
    const lo = mu - k * sigma;
    const hi = mu + k * sigma;
    return {
      kind: "numeric",
      prompt: tail
        ? String.raw`Рост — нормальная величина со средним $${mu}$ и стандартным отклонением $${sigma}$. Какая доля значений больше $${hi}$? Пользуйтесь правилом 68–95–99.7.`
        : String.raw`$X \sim \mathcal{N}(${mu}, ${sigma * sigma})$. Найдите $P(${lo} \le X \le ${hi})$ по правилу 68–95–99.7.`,
      label: String.raw`$P \approx$`,
      answer,
      tol: 0.006,
      hints: [String.raw`Стандартизуйте: $z = (x - \mu)/\sigma$${tail ? "" : String.raw`; второй параметр $\mathcal{N}(\mu, \sigma^2)$ — дисперсия, $\sigma = ${sigma}$`}.`, String.raw`В пределах $\pm 1\sigma$ — $68\,\%$, $\pm 2\sigma$ — $95\,\%$, $\pm 3\sigma$ — $99.7\,\%$; хвосты симметричны.`],
      right: tail ? String.raw`$${hi}$ — это $\mu + ${k}\sigma$; снаружи $\pm ${k}\sigma$ остаётся $${round(1 - inside)}$, справа — половина: $${answer}$.` : String.raw`$[${lo}, ${hi}] = \mu \pm ${k}\sigma$: доля $${answer}$.`,
      wrong: tail ? String.raw`Снаружи интервала два хвоста, справа — только половина: $(1 - ${inside})/2$.` : String.raw`Во втором параметре $\mathcal{N}(${mu}, ${sigma * sigma})$ стоит дисперсия: $\sigma = ${sigma}$, а интервал — $\mu \pm ${k}\sigma$.`,
    };
  },
};

/** Урок III.7: матожидание или дисперсия непрерывного семейства. */
export const contMomentsGen: Generator = {
  id: "prob.cont-moments",
  version: 1,
  title: "Моменты непрерывного распределения",
  make(seed) {
    const r = rng(seed);
    const fams = [
      () => {
        const [a, b] = r.pick([[0, 6], [2, 8], [-3, 3], [1, 4]] as const);
        return { tex: String.raw`$X$ равномерна на $[${a}, ${b}]$`, mean: (a + b) / 2, variance: (b - a) ** 2 / 12, fm: "(a + b)/2", fv: "(b - a)^2/12" };
      },
      () => {
        const lam = r.pick([0.5, 2, 4]);
        return { tex: String.raw`$X$ — показательная с $\lambda = ${lam}$`, mean: 1 / lam, variance: 1 / (lam * lam), fm: String.raw`1/\lambda`, fv: String.raw`1/\lambda^2` };
      },
      () => {
        const [mu, b] = [r.int(-2, 2), r.pick([0.5, 1, 2])];
        return { tex: String.raw`$X$ — распределение Лапласа с $\mu = ${mu}$, $b = ${b}$`, mean: mu, variance: 2 * b * b, fm: String.raw`\mu`, fv: "2b^2" };
      },
      () => {
        const [al, be] = r.pick([[2, 2], [2, 3], [1, 4], [3, 1]] as const);
        return { tex: String.raw`$X \sim \operatorname{Beta}(${al}, ${be})$`, mean: al / (al + be), variance: (al * be) / ((al + be) ** 2 * (al + be + 1)), fm: String.raw`\alpha/(\alpha + \beta)`, fv: String.raw`\alpha\beta / \bigl((\alpha + \beta)^2(\alpha + \beta + 1)\bigr)` };
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
      hints: [String.raw`$\mathbb{E}X = ${f.fm}$, $\operatorname{Var} X = ${f.fv}$.`],
      right: String.raw`$${wantVar ? f.fv : f.fm} = ${answer}$.`,
      wrong: String.raw`Формулы семейства: $\mathbb{E}X = ${f.fm}$, $\operatorname{Var} X = ${f.fv}$.`,
    };
  },
};

/** Урок III.8: ошибка выборочного среднего σ/√n — найти её, нужное n или во сколько раз увеличить выборку. */
export const mcError: Generator = {
  id: "prob.mc-error",
  version: 1,
  title: "Ошибка метода Монте-Карло",
  make(seed) {
    const r = rng(seed);
    const kind = (seed - 1) % 3;
    if (kind === 0) {
      const sigma = r.pick([2, 3, 5, 10]);
      const n = r.pick([25, 100, 400, 2500]);
      const answer = round(sigma / Math.sqrt(n));
      return {
        kind: "numeric",
        prompt: String.raw`Наблюдения независимы, $\sigma = ${sigma}$. Среднее посчитали по $n = ${n}$ наблюдениям. Найдите стандартное отклонение выборочного среднего $\bar X$.`,
        label: String.raw`$\sqrt{\operatorname{Var} \bar X} =$`,
        answer,
        tol: 0.001,
        hints: [String.raw`$\operatorname{Var} \bar X = \sigma^2/n$; стандартное отклонение — корень из дисперсии.`],
        right: String.raw`$\sigma/\sqrt{n} = ${sigma}/${Math.sqrt(n)} = ${answer}$.`,
        wrong: String.raw`Делить нужно на $\sqrt{n} = ${Math.sqrt(n)}$, а не на $n$: $n$ стоит в знаменателе дисперсии.`,
      };
    }
    if (kind === 1) {
      const sigma = r.pick([1, 2, 5]);
      const eps = r.pick([0.1, 0.05, 0.01]);
      const answer = Math.round((sigma / eps) ** 2);
      return {
        kind: "numeric",
        prompt: String.raw`Оцениваем $\mathbb{E}\,g(X)$ средним по $n$ независимым значениям, $\sigma = ${sigma}$ — стандартное отклонение $g(X)$. Какое наименьшее $n$ даёт стандартное отклонение оценки не больше $${eps}$?`,
        label: String.raw`$n =$`,
        answer,
        tol: 0.5,
        hints: [String.raw`Решите $\sigma/\sqrt{n} \le ${eps}$ относительно $n$.`],
        right: String.raw`$\sqrt{n} \ge ${sigma}/${eps} = ${round(sigma / eps)}$, $n \ge ${answer}$.`,
        wrong: String.raw`Из $\sigma/\sqrt{n} \le \varepsilon$ следует $n \ge (\sigma/\varepsilon)^2$ — квадрат, а не $\sigma/\varepsilon$.`,
      };
    }
    const n = r.pick([100, 1000, 500]);
    const k = r.pick([2, 3, 10]);
    const answer = n * k * k;
    return {
      kind: "numeric",
      prompt: String.raw`Оценка Монте-Карло по $${n}$ точкам даёт ошибку около $\delta$. Сколько точек нужно, чтобы ошибка стала в $${k}$ раза меньше?`,
      label: String.raw`$n =$`,
      answer,
      tol: 0.5,
      hints: [String.raw`Ошибка $\sim \sigma/\sqrt{n}$: во сколько раз должен вырасти $\sqrt{n}$?`],
      right: String.raw`$\sqrt{n}$ должен вырасти в $${k}$ раза, $n$ — в $${k * k}$: $${n} \cdot ${k * k} = ${answer}$.`,
      wrong: String.raw`Ошибка убывает как $1/\sqrt{n}$, поэтому $n$ растёт в $${k}^2 = ${k * k}$ раза, а не в $${k}$.`,
    };
  },
};

/** Урок III.8: оценка объединения P(A₁ ∪ … ∪ A_k) ≤ Σ P(Aᵢ) — граница или допустимая вероятность одного события. */
export const unionBound: Generator = {
  id: "prob.union-bound",
  version: 1,
  title: "Оценка объединения",
  make(seed) {
    const r = rng(seed);
    const k = r.pick([5, 10, 20, 50]);
    if (seed % 2 === 1) {
      const delta = r.pick([0.001, 0.002, 0.005]);
      const answer = round(k * delta);
      return {
        kind: "numeric",
        prompt: String.raw`Есть $${k}$ моделей. Для каждой вероятность, что ошибка на обучающей выборке далека от настоящей, не больше $${delta}$. Оцените сверху вероятность, что хотя бы для одной модели ошибка далека от настоящей.`,
        label: String.raw`$P \le$`,
        answer,
        tol: 0.0005,
        hints: [String.raw`$P(A_1 \cup \cdots \cup A_k) \le P(A_1) + \cdots + P(A_k)$ — независимость не нужна.`],
        right: String.raw`$${k} \cdot ${delta} = ${answer}$.`,
        wrong: String.raw`Вероятности объединения оценивают суммой: $${k} \cdot ${delta}$. Произведение — вероятность, что события случились все сразу, и то только для независимых.`,
      };
    }
    const total = r.pick([0.05, 0.1, 0.01]);
    const answer = round(total / k, 5);
    return {
      kind: "numeric",
      prompt: String.raw`Проверяем $${k}$ гипотез и хотим, чтобы вероятность хотя бы одной ложной тревоги была не больше $${total}$. Какую вероятность ложной тревоги допустить для каждой гипотезы, если делить поровну?`,
      label: String.raw`$\delta =$`,
      answer,
      tol: 0.00001,
      hints: [String.raw`По оценке объединения $P(\text{хоть одна}) \le k\delta$; приравняйте $k\delta$ к $${total}$.`],
      right: String.raw`$\delta = ${total}/${k} = ${answer}$ — поправка Бонферрони.`,
      wrong: String.raw`Сумма $k$ одинаковых вероятностей — $k\delta$; она должна быть не больше $${total}$: $\delta = ${total}/${k}$.`,
    };
  },
};

/** Совместная таблица X ∈ {0, 1, 2}, Y ∈ {0, 1} с вероятностями, кратными 0.05; строки — значения X. */
function jointTable(seed: number): number[][] {
  const r = rng(seed);
  for (;;) {
    const cells = Array.from({ length: 5 }, () => r.int(1, 5));
    const last = 20 - cells.reduce((a, b) => a + b, 0);
    if (last < 1 || last > 6) continue;
    const c = [...cells, last].map((v) => v / 20);
    return [
      [c[0]!, c[1]!],
      [c[2]!, c[3]!],
      [c[4]!, c[5]!],
    ];
  }
}

const jointTex = (t: number[][]) =>
  String.raw`$$\begin{array}{c|cc} & Y = 0 & Y = 1 \\ \hline ${t.map((row, x) => String.raw`X = ${x} & ${row[0]} & ${row[1]}`).join(String.raw` \\ `)} \end{array}$$`;

/** Урок III.9: по совместной таблице — маргинальная вероятность, условное матожидание или E X через E[E[X | Y]]. */
export const jointMarginal: Generator = {
  id: "prob.joint-marginal",
  version: 1,
  title: "Маргинальное и условное по совместной таблице",
  make(seed) {
    const t = jointTable(seed);
    const kind = (seed - 1) % 3;
    const pY = [0, 1].map((y) => t.reduce((s, row) => s + row[y]!, 0));
    if (kind === 0) {
      const x = seed % 3;
      const answer = round(t[x]![0]! + t[x]![1]!);
      return {
        kind: "numeric",
        prompt: String.raw`Совместное распределение $X$ и $Y$ задано таблицей: ${jointTex(t)} Найдите $P(X = ${x})$.`,
        label: String.raw`$P(X = ${x}) =$`,
        answer,
        tol: 0.001,
        hints: [String.raw`Маргинальное: $p(x) = \sum_y p(x, y)$ — сумма по строке.`],
        right: String.raw`$${t[x]![0]} + ${t[x]![1]} = ${answer}$.`,
        wrong: String.raw`Сложите вероятности строки $X = ${x}$ по всем значениям $Y$.`,
      };
    }
    const y = seed % 2;
    const ex = (yy: number) => (t[1]![yy]! + 2 * t[2]![yy]!) / pY[yy]!;
    if (kind === 1) {
      const answer = round(ex(y), 3);
      return {
        kind: "numeric",
        prompt: String.raw`Совместное распределение $X$ и $Y$ задано таблицей: ${jointTex(t)} Найдите $\mathbb{E}[X \mid Y = ${y}]$.`,
        label: String.raw`$\mathbb{E}[X \mid Y = ${y}] =$`,
        answer,
        tol: 0.005,
        hints: [String.raw`Сначала $P(Y = ${y}) = ${round(pY[y]!)}$ — сумма столбца. Условные вероятности $p(x \mid ${y}) = p(x, ${y}) / P(Y = ${y})$.`],
        right: String.raw`$\dfrac{0 \cdot ${t[0]![y]} + 1 \cdot ${t[1]![y]} + 2 \cdot ${t[2]![y]}}{${round(pY[y]!)}} \approx ${answer}$.`,
        wrong: String.raw`Не забудьте разделить на $P(Y = ${y}) = ${round(pY[y]!)}$: без этого столбец не сумма вероятностей $1$.`,
      };
    }
    const answer = round(pY[0]! * ex(0) + pY[1]! * ex(1), 3);
    return {
      kind: "numeric",
      prompt: String.raw`Совместное распределение $X$ и $Y$ задано таблицей: ${jointTex(t)} Известно: $\mathbb{E}[X \mid Y = 0] = ${round(ex(0), 3)}$, $\mathbb{E}[X \mid Y = 1] = ${round(ex(1), 3)}$. Найдите $\mathbb{E}X$ по закону полного матожидания.`,
      label: String.raw`$\mathbb{E}X =$`,
      answer,
      tol: 0.005,
      hints: [String.raw`$\mathbb{E}X = \mathbb{E}[\mathbb{E}[X \mid Y]] = P(Y = 0)\, \mathbb{E}[X \mid Y = 0] + P(Y = 1)\, \mathbb{E}[X \mid Y = 1]$.`],
      right: String.raw`$${round(pY[0]!)} \cdot ${round(ex(0), 3)} + ${round(pY[1]!)} \cdot ${round(ex(1), 3)} \approx ${answer}$.`,
      wrong: String.raw`Условные средние нужно взвесить вероятностями $P(Y = 0) = ${round(pY[0]!)}$ и $P(Y = 1) = ${round(pY[1]!)}$, а не брать их простое среднее.`,
    };
  },
};

/** Урок III.9: ковариация или корреляция двух индикаторов по таблице 2 × 2. */
export const covariance: Generator = {
  id: "prob.covariance",
  version: 1,
  title: "Ковариация и корреляция",
  make(seed) {
    const r = rng(seed);
    let p: number[];
    do p = [r.int(1, 4), r.int(1, 4), r.int(1, 4)];
    while (p[0]! + p[1]! + p[2]! > 9);
    const [p00, p01, p10, p11] = [...p, 10 - p[0]! - p[1]! - p[2]!].map((v) => v / 10) as [number, number, number, number];
    const px = p10 + p11;
    const py = p01 + p11;
    const cov = p11 - px * py;
    const wantRho = seed % 2 === 0;
    const rho = cov / Math.sqrt(px * (1 - px) * py * (1 - py));
    const answer = round(wantRho ? rho : cov, wantRho ? 3 : 4);
    const tex = String.raw`$$\begin{array}{c|cc} & Y = 0 & Y = 1 \\ \hline X = 0 & ${p00} & ${p01} \\ X = 1 & ${p10} & ${p11} \end{array}$$`;
    return {
      kind: "numeric",
      prompt: String.raw`$X$ и $Y$ принимают значения $0$ и $1$, совместное распределение: ${tex} Найдите ${wantRho ? String.raw`корреляцию $\rho(X, Y)$` : String.raw`$\operatorname{Cov}(X, Y)$`}.`,
      label: wantRho ? String.raw`$\rho =$` : String.raw`$\operatorname{Cov}(X, Y) =$`,
      answer,
      tol: wantRho ? 0.005 : 0.0005,
      hints: [String.raw`$\operatorname{Cov}(X, Y) = \mathbb{E}XY - \mathbb{E}X\, \mathbb{E}Y$; у индикаторов $\mathbb{E}XY = P(X = 1, Y = 1)$, $\mathbb{E}X = P(X = 1)$.`, ...(wantRho ? [String.raw`$\rho = \operatorname{Cov}/(\sigma_X \sigma_Y)$, у Бернулли $\sigma^2 = \phi(1 - \phi)$.`] : [])],
      right: String.raw`$\operatorname{Cov} = ${p11} - ${round(px)} \cdot ${round(py)} = ${round(cov, 4)}$${wantRho ? String.raw`, $\rho = ${round(cov, 4)} / \sqrt{${round(px * (1 - px), 4)} \cdot ${round(py * (1 - py), 4)}} \approx ${answer}$` : ""}.`,
      wrong: String.raw`$\mathbb{E}X = ${round(px)}$, $\mathbb{E}Y = ${round(py)}$, $\mathbb{E}XY = ${p11}$; ковариация — $\mathbb{E}XY - \mathbb{E}X\, \mathbb{E}Y$.`,
    };
  },
};

/** Коэффициент перед переменной: 1 и −1 не пишут. */
const coef = (c: number) => (c === 1 ? "" : c === -1 ? "-" : String(c));

const pm = (m: number[][]) => String.raw`\begin{pmatrix} ${m.map((row) => row.join(" & ")).join(String.raw` \\ `)} \end{pmatrix}`;

/** Урок III.10: ковариация линейного преобразования — матрица AΣAᵀ или дисперсия aᵀX = aᵀΣa. */
export const covLinearGen: Generator = {
  id: "prob.cov-linear",
  version: 1,
  title: "Ковариация линейного преобразования",
  make(seed) {
    const r = rng(seed);
    const s1 = r.int(1, 4);
    const s2 = r.int(1, 4);
    // Σ ≻ 0: при s₁s₂ = 1 ковариация ±1 сделала бы Σ вырожденной
    const c = s1 * s2 > 1 ? r.pick([-1, 0, 1]) : 0;
    const S = [
      [s1, c],
      [c, s2],
    ];
    if (seed % 2 === 1) {
      const A = [
        [r.int(-2, 2), r.nonzero(-2, 2)],
        [r.nonzero(-2, 2), r.int(-2, 2)],
      ];
      const AS = [0, 1].map((i) => [0, 1].map((j) => A[i]![0]! * S[0]![j]! + A[i]![1]! * S[1]![j]!));
      const answer = [0, 1].map((i) => [0, 1].map((j) => AS[i]![0]! * A[j]![0]! + AS[i]![1]! * A[j]![1]!));
      return {
        kind: "matrix",
        prompt: String.raw`$\operatorname{Cov} X = \Sigma = ${pm(S)}$, $A = ${pm(A)}$, $b = (3, -1)^\top$. Найдите $\operatorname{Cov}(AX + b)$.`,
        label: String.raw`$\operatorname{Cov}(AX + b) =$`,
        answer,
        tol: 0.001,
        hints: [String.raw`$\operatorname{Cov}(AX + b) = A\Sigma A^\top$; сдвиг $b$ на ковариацию не влияет.`, String.raw`Сначала $A\Sigma = ${pm(AS)}$, потом умножьте справа на $A^\top$.`],
        right: String.raw`$A\Sigma A^\top = ${pm(answer)}$ — симметричная, как и положено ковариации.`,
        wrong: String.raw`Проверьте: ответ должен быть симметричным. $A\Sigma = ${pm(AS)}$ — ещё не ковариация, нужно умножить на $A^\top$ справа.`,
      };
    }
    const a = [r.nonzero(-3, 3), r.nonzero(-3, 3)];
    const answer = a[0]! ** 2 * s1 + 2 * a[0]! * a[1]! * c + a[1]! ** 2 * s2;
    return {
      kind: "numeric",
      prompt: String.raw`$\operatorname{Cov} X = \Sigma = ${pm(S)}$. Найдите $\operatorname{Var}(${coef(a[0]!)}X_1 ${a[1]! < 0 ? "-" : "+"} ${coef(Math.abs(a[1]!))}X_2)$.`,
      label: String.raw`$\operatorname{Var} =$`,
      answer,
      tol: 0.001,
      hints: [String.raw`$\operatorname{Var}(a^\top X) = a^\top \Sigma a$ при $a = (${a[0]}, ${a[1]})^\top$ — частный случай $A\Sigma A^\top$ с одной строкой.`],
      right: String.raw`$a^\top\Sigma a = ${par(a[0]!)}^2 \cdot ${s1} + 2 \cdot ${par(a[0]!)} \cdot ${par(a[1]!)} \cdot ${par(c)} + ${par(a[1]!)}^2 \cdot ${s2} = ${answer}$.`,
      wrong: String.raw`Не забудьте ковариацию: $\operatorname{Var}(a_1X_1 + a_2X_2) = a_1^2\Sigma_{11} + 2a_1a_2\Sigma_{12} + a_2^2\Sigma_{22}$.`,
    };
  },
};

/** Урок III.10: плотность Y = AX + b делится на |det A| — равномерное на квадрате или стандартное нормальное в центре. */
export const densityLinear: Generator = {
  id: "prob.density-linear",
  version: 1,
  title: "Плотность после линейного преобразования",
  make(seed) {
    const r = rng(seed);
    let A: number[][];
    do
      A = [
        [r.int(-3, 3), r.int(-2, 2)],
        [r.int(-2, 2), r.int(-3, 3)],
      ];
    while (A[0]![0]! * A[1]![1]! - A[0]![1]! * A[1]![0]! === 0);
    const d = A[0]![0]! * A[1]![1]! - A[0]![1]! * A[1]![0]!;
    const answer = round(1 / Math.abs(d), 4);
    return {
      kind: "numeric",
      prompt: String.raw`$X$ равномерен на квадрате $[0, 1]^2$: его плотность равна $1$ на квадрате. $Y = AX$, $A = ${pm(A)}$. Чему равна плотность $Y$ в точках параллелограмма $A[0, 1]^2$?`,
      label: String.raw`$p_Y =$`,
      answer,
      tol: 0.0005,
      hints: [String.raw`$p_Y(y) = p_X(A^{-1}y)\, \lvert \det A \rvert^{-1}$; площадь параллелограмма — $\lvert \det A \rvert$ (урок I.7).`],
      right: String.raw`$\det A = ${d}$, $p_Y = 1/${Math.abs(d)} \approx ${answer}$: площадь выросла в $${Math.abs(d)}$ раз, плотность упала во столько же.`,
      wrong: d < 0 ? String.raw`$\det A = ${d} < 0$, но плотность не бывает отрицательной: делить нужно на модуль, $\lvert \det A \rvert = ${-d}$.` : String.raw`Плотность делится на $\lvert \det A \rvert = ${d}$, а не умножается: вероятность квадрата растекается по площади $${d}$.`,
    };
  },
};

/** Урок III.11: квадрат расстояния Махаланобиса при диагональной Σ — сколько «сигм» от центра. */
export const mahalanobisGen: Generator = {
  id: "prob.mahalanobis",
  version: 1,
  title: "Расстояние Махаланобиса",
  make(seed) {
    const r = rng(seed);
    const s1 = r.pick([1, 2, 3, 5]);
    const s2 = r.pick([1, 2, 4]);
    const mu = [r.int(-2, 2), r.int(-2, 2)];
    const x = [mu[0]! + s1 * r.nonzero(-2, 2), mu[1]! + s2 * r.int(-2, 2)];
    const z = [(x[0]! - mu[0]!) / s1, (x[1]! - mu[1]!) / s2];
    const answer = z[0]! ** 2 + z[1]! ** 2;
    const eucl = (x[0]! - mu[0]!) ** 2 + (x[1]! - mu[1]!) ** 2;
    return {
      kind: "numeric",
      prompt: String.raw`$X \sim \mathcal{N}(\mu, \Sigma)$, $\mu = (${mu[0]}, ${mu[1]})^\top$, $\Sigma = ${pm([[s1 * s1, 0], [0, s2 * s2]])}$. Найдите квадрат расстояния Махаланобиса от точки $x = (${x[0]}, ${x[1]})^\top$ до $\mu$.`,
      label: String.raw`$(x - \mu)^\top \Sigma^{-1} (x - \mu) =$`,
      answer,
      tol: 0.001,
      hints: [String.raw`$\Sigma$ диагональна: $\Sigma^{-1} = \operatorname{diag}(1/${s1 * s1}, 1/${s2 * s2})$, и форма — сумма квадратов отклонений в «сигмах».`],
      right: String.raw`$\bigl(\tfrac{${x[0]! - mu[0]!}}{${s1}}\bigr)^2 + \bigl(\tfrac{${x[1]! - mu[1]!}}{${s2}}\bigr)^2 = ${answer}$.`,
      wrong: String.raw`Отклонения делятся на $\sigma$, а в квадрате — на дисперсии $${s1 * s1}$ и $${s2 * s2}$. Обычный квадрат расстояния — $${eucl}$ — не учитывает разброс.`,
    };
  },
};

/** Урок III.11: полуось эллипса уровня k по собственным числам Σ = [[a, b], [b, a]] (λ = a ± b). */
export const gaussAxes: Generator = {
  id: "prob.gauss-axes",
  version: 1,
  title: "Полуоси эллипса уровня",
  make(seed) {
    const r = rng(seed);
    const [l1, l2] = r.pick([[9, 1], [16, 4], [9, 4], [25, 9], [16, 1]] as const);
    const a = (l1 + l2) / 2;
    const b = r.pick([1, -1]) * ((l1 - l2) / 2);
    const k = r.pick([1, 2, 3]);
    const long = seed % 2 === 1;
    const answer = k * Math.sqrt(long ? l1 : l2);
    return {
      kind: "numeric",
      prompt: String.raw`$\Sigma = ${pm([[a, b], [b, a]])}$. Найдите длину ${long ? "длинной" : "короткой"} полуоси эллипса $(x - \mu)^\top \Sigma^{-1} (x - \mu) = ${k * k}$.`,
      label: String.raw`полуось $=$`,
      answer,
      tol: 0.001,
      hints: [String.raw`У $\begin{pmatrix} a & b \\ b & a \end{pmatrix}$ собственные векторы $(1, \pm 1)^\top$, числа $a \pm b$.`, String.raw`Полуось уровня $k$ вдоль $u_i$ — $k\sqrt{\lambda_i}$; здесь $k = ${k}$.`],
      right: String.raw`$\lambda = ${l1}, ${l2}$; ${long ? "длинная" : "короткая"} полуось — $${k}\sqrt{${long ? l1 : l2}} = ${answer}$.`,
      wrong: String.raw`Полуоси — $k\sqrt{\lambda_i}$, не $k/\sqrt{\lambda_i}$: в квадратичной форме стоит $\Sigma^{-1}$, и корни обращаются. И не забудьте, что уровень $${k * k}$ — это $k^2$, $k = ${k}$.`,
    };
  },
};

/** Урок III.12: смесь двух компонент — плотность в точке или ответственность по формуле Байеса. */
export const mixtureGen: Generator = {
  id: "prob.mixture",
  version: 1,
  title: "Плотность смеси и ответственность",
  make(seed) {
    const r = rng(seed);
    const phi = r.pick([0.2, 0.3, 0.4, 0.6, 0.7]);
    const p1 = r.pick([0.05, 0.1, 0.2, 0.3]);
    const p2 = r.pick([0.1, 0.15, 0.25, 0.4].filter((v) => v !== p1));
    const mix = phi * p1 + (1 - phi) * p2;
    const ctx = String.raw`Смесь двух компонент: $P(z = 1) = \phi = ${phi}$, $P(z = 2) = ${round(1 - phi)}$. В точке $x$ плотности компонент $p(x \mid z = 1) = ${p1}$, $p(x \mid z = 2) = ${p2}$.`;
    if (seed % 2 === 0) {
      const answer = round(mix);
      return {
        kind: "numeric",
        prompt: String.raw`${ctx} Найдите плотность смеси $p(x)$.`,
        label: String.raw`$p(x) =$`,
        answer,
        tol: 0.0005,
        hints: [String.raw`$p(x) = \sum_k P(z = k)\, p(x \mid z = k)$ — маргинализация по скрытой $z$.`],
        right: String.raw`$${phi} \cdot ${p1} + ${round(1 - phi)} \cdot ${p2} = ${answer}$.`,
        wrong: String.raw`Плотности компонент нужно взвесить вероятностями $\phi$ и $1 - \phi$, а не сложить и не усреднить поровну.`,
      };
    }
    const answer = round((phi * p1) / mix, 3);
    return {
      kind: "numeric",
      prompt: String.raw`${ctx} Найдите ответственность первой компоненты $P(z = 1 \mid x)$.`,
      label: String.raw`$P(z = 1 \mid x) =$`,
      answer,
      tol: 0.005,
      hints: [String.raw`Формула Байеса: числитель $\phi\, p(x \mid z = 1)$, знаменатель — плотность смеси $p(x)$.`],
      right: String.raw`$\dfrac{${phi} \cdot ${p1}}{${phi} \cdot ${p1} + ${round(1 - phi)} \cdot ${p2}} = \dfrac{${round(phi * p1)}}{${round(mix)}} \approx ${answer}$.`,
      wrong: String.raw`Не забудьте априорные веса: сравнивают не $${p1}$ и $${p2}$, а $\phi\, p(x \mid z = 1) = ${round(phi * p1)}$ и $(1 - \phi)\, p(x \mid z = 2) = ${round((1 - phi) * p2)}$.`,
    };
  },
};

/** Урок III.12: матожидание или дисперсия смеси двух нормальных — по полному матожиданию. */
export const mixtureMoments: Generator = {
  id: "prob.mixture-moments",
  version: 1,
  title: "Моменты смеси",
  make(seed) {
    const r = rng(seed);
    const phi = r.pick([0.25, 0.5, 0.75]);
    const mu1 = r.int(-3, 0);
    const mu2 = r.int(1, 4);
    const v1 = r.pick([1, 2, 4]);
    const v2 = r.pick([1, 2, 4]);
    const mean = phi * mu1 + (1 - phi) * mu2;
    const variance = phi * (v1 + mu1 * mu1) + (1 - phi) * (v2 + mu2 * mu2) - mean * mean;
    const wantVar = seed % 2 === 1;
    const answer = round(wantVar ? variance : mean, 4);
    return {
      kind: "numeric",
      prompt: String.raw`$X$ — смесь: с вероятностью $${phi}$ из $\mathcal{N}(${mu1}, ${v1})$, иначе из $\mathcal{N}(${mu2}, ${v2})$ (второй параметр — дисперсия). Найдите $${wantVar ? String.raw`\operatorname{Var} X` : String.raw`\mathbb{E}X`}$.`,
      label: wantVar ? String.raw`$\operatorname{Var} X =$` : String.raw`$\mathbb{E}X =$`,
      answer,
      tol: 0.005,
      hints: [
        String.raw`Закон полного матожидания: $\mathbb{E}X = \sum_k \phi_k\, \mathbb{E}[X \mid z = k]$.`,
        ...(wantVar ? [String.raw`$\mathbb{E}X^2 = \sum_k \phi_k (\sigma_k^2 + \mu_k^2)$, потом $\operatorname{Var} X = \mathbb{E}X^2 - (\mathbb{E}X)^2$.`] : []),
      ],
      right: wantVar ? String.raw`$\mathbb{E}X^2 = ${round(phi * (v1 + mu1 * mu1) + (1 - phi) * (v2 + mu2 * mu2), 4)}$, $\mathbb{E}X = ${round(mean, 4)}$, $\operatorname{Var} X = ${answer}$ — больше обеих дисперсий компонент, если их средние далеко.` : String.raw`$${phi} \cdot ${par(mu1)} + ${1 - phi} \cdot ${mu2} = ${answer}$.`,
      wrong: wantVar ? String.raw`Дисперсия смеси — не $\sum_k \phi_k \sigma_k^2$: к ней добавляется разброс самих средних, $\sum_k \phi_k (\mu_k - \mathbb{E}X)^2$. И это не сумма величин: $\phi^2\sigma_1^2 + (1 - \phi)^2\sigma_2^2$ — дисперсия взвешенной суммы.` : String.raw`Средние компонент нужно взвесить вероятностями: $\phi\mu_1 + (1 - \phi)\mu_2$.`,
    };
  },
};

/** Урок III.13: энтропия в битах для распределения с вероятностями — степенями двойки. */
export const entropyGen: Generator = {
  id: "prob.entropy",
  version: 1,
  title: "Энтропия",
  make(seed) {
    const r = rng(seed);
    const p = r.pick([
      [0.5, 0.5],
      [0.5, 0.25, 0.25],
      [0.25, 0.25, 0.25, 0.25],
      [0.5, 0.25, 0.125, 0.125],
      [0.125, 0.125, 0.125, 0.125, 0.5],
      [0.25, 0.25, 0.5],
    ] as const);
    const answer = -p.reduce((s, v) => s + v * Math.log2(v), 0);
    const terms = p.map((v) => String.raw`${v} \cdot ${-Math.log2(v)}`).join(" + ");
    return {
      kind: "numeric",
      prompt: String.raw`Случайная величина принимает ${p.length} значений с вероятностями $${p.join(", ")}$. Найдите её энтропию в битах: $H = -\sum_x p(x) \log_2 p(x)$.`,
      label: String.raw`$H =$`,
      answer,
      tol: 0.001,
      hints: [String.raw`$-\log_2 p$ — «неожиданность» исхода в битах: $-\log_2 0.5 = 1$, $-\log_2 0.25 = 2$, $-\log_2 0.125 = 3$.`],
      right: String.raw`$H = ${terms} = ${answer}$ бита: в среднем столько вопросов «да или нет» нужно, чтобы узнать исход.`,
      wrong: String.raw`Энтропия — среднее $-\log_2 p(x)$, взвешенное вероятностями: $${terms}$.`,
    };
  },
};

/** Урок III.13: KL-дивергенция двух распределений Бернулли в натах — и в какую сторону. */
export const klGen: Generator = {
  id: "prob.kl",
  version: 1,
  title: "KL-дивергенция",
  make(seed) {
    const r = rng(seed);
    const a = r.pick([0.5, 0.8, 0.9, 0.2]);
    const b = r.pick([0.5, 0.6, 0.25, 0.1].filter((v) => v !== a));
    const reverse = seed % 2 === 0;
    const [p, q] = reverse ? [b, a] : [a, b];
    const answer = round(p * Math.log(p / q) + (1 - p) * Math.log((1 - p) / (1 - q)), 4);
    const other = round(q * Math.log(q / p) + (1 - q) * Math.log((1 - q) / (1 - p)), 4);
    return {
      kind: "numeric",
      prompt: String.raw`$p$ — монета с вероятностью орла $${a}$, $q$ — с вероятностью $${b}$. Найдите $D_{KL}(${reverse ? "q" : "p"} \,\Vert\, ${reverse ? "p" : "q"})$ в натах (натуральный логарифм).`,
      label: String.raw`$D_{KL} =$`,
      answer,
      tol: 0.001,
      hints: [String.raw`$D_{KL}(u \,\Vert\, v) = \sum_x u(x) \log \frac{u(x)}{v(x)}$; усредняют по первому аргументу. Для монет — два слагаемых: орёл и решка.`],
      right: String.raw`$${p} \ln \frac{${p}}{${q}} + ${round(1 - p)} \ln \frac{${round(1 - p)}}{${round(1 - q)}} \approx ${answer}$. В обратную сторону было бы $${other}$: KL несимметрична.`,
      wrong: String.raw`Проверьте порядок: в $D_{KL}(u \,\Vert\, v)$ веса и числитель — у первого аргумента. В другую сторону получится $${other}$, а не $${answer}$.`,
    };
  },
};

/** Урок III.13: кросс-энтропия (log loss) по предсказанным вероятностям для нескольких объектов. */
export const logLoss: Generator = {
  id: "prob.log-loss",
  version: 1,
  title: "Кросс-энтропия как функция потерь",
  make(seed) {
    const r = rng(seed);
    const n = r.pick([2, 3]);
    const ys = Array.from({ length: n }, () => r.int(0, 1));
    const hs = Array.from({ length: n }, () => r.pick([0.9, 0.8, 0.6, 0.3, 0.1]));
    const terms = ys.map((y, i) => (y === 1 ? hs[i]! : round(1 - hs[i]!)));
    const answer = round(-terms.reduce((s, t) => s + Math.log(t), 0) / n, 4);
    const rows = ys.map((y, i) => String.raw`$y^{(${i + 1})} = ${y}$, $h^{(${i + 1})} = ${hs[i]}$`).join("; ");
    return {
      kind: "numeric",
      prompt: String.raw`Классификатор выдаёт вероятность класса $1$. Объекты: ${rows}. Найдите среднюю кросс-энтропию $-\frac1n \sum_i \bigl(y^{(i)} \ln h^{(i)} + (1 - y^{(i)}) \ln (1 - h^{(i)})\bigr)$.`,
      label: String.raw`$\text{log loss} =$`,
      answer,
      tol: 0.002,
      hints: [String.raw`Для каждого объекта берут логарифм вероятности, которую модель дала **верному** классу: $h$ при $y = 1$ и $1 - h$ при $y = 0$.`],
      right: String.raw`$-\frac{1}{${n}}\bigl(${terms.map((t) => String.raw`\ln ${t}`).join(" + ")}\bigr) \approx ${answer}$ — минус средний логарифм правдоподобия.`,
      wrong: String.raw`Вероятности верного класса здесь — $${terms.join(", ")}$; усредните $-\ln$ от них.`,
    };
  },
};
