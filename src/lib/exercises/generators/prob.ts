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
