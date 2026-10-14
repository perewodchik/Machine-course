/**
 * Модель контента курса. Это контракт между content/ (YAML и MDX) и кодом сайта.
 * На этапе 1 эти типы станут zod-схемами в src/content.config.ts; здесь — без зависимостей.
 */

/** Текст на нескольких языках. Строка — сокращение для { ru }. */
export type Localized = string | { ru: string; en?: string };

/** Стабильные идентификаторы. Переименование — только через content/redirects.yaml. */
export type ConceptId = `${"nota" | "la" | "calc" | "prob" | "stat" | "ml"}.${string}`;
export type RuleId = `rule.${string}`;
export type FormulaId = `f.${string}`;

/** Ссылка на конспект CS229: издание и название раздела, а не номер главы (номера меняются между изданиями). */
export interface CS229Ref {
  edition: string; // например "main-notes-2026-spring"
  section: string; // например "Linear regression / The normal equations"
}

export interface Concept {
  id: ConceptId;
  title: { ru: string; en: string };
  summary: Localized;
  lesson: string; // slug урока, где понятие вводится
  prerequisites: ConceptId[];
  core: boolean; // false — углубление, не блокирует прогресс
  cs229?: CS229Ref[];
}

/** Роль символа определяет цвет: data → sym-1, param → sym-2, target → sym-3, aux → карандаш. */
export type SymbolRole = "data" | "param" | "target" | "aux";

export interface SymbolSpec {
  name: string; // ключ для \sym{name}{…} и для проверок
  tex: string;
  meaning?: Localized;
  shape?: (string | number)[]; // ["n", "d"]; вектор-столбец — ["d", 1]
  role?: SymbolRole;
  sample?: "normal" | "invertible" | "spd"; // как генерировать значение для численной проверки
}

/** Численная проверка (выражения на NumPy, см. code/mlf/formulas.py). */
export type Check =
  | { kind: "identity"; lhs: string; rhs: string }
  | { kind: "gradient"; f: string; grad: string; wrt: string };

export type StepCheck =
  | { kind: "same"; py: string }
  | { kind: "gradient"; py: string; wrt: string }
  | { kind: "stationary"; lhs: string; rhs: string }
  | { kind: "solution"; py: string; wrt: string };

export interface DerivationStep {
  goal: number; // индекс подцели в plan
  tex: string; // \changed{…} подсвечивает изменившуюся часть
  by: (RuleId | ConceptId)[]; // обоснование шага
  note?: Localized; // короткое пояснение на полях
  why?: Localized; // развёрнутое «почему», раскрывается по клику
  check?: StepCheck;
}

interface FormulaBase {
  id: RuleId | FormulaId;
  title: { ru: string; en?: string };
  statement: string;
  symbols: SymbolSpec[];
  pitfall?: Localized;
}

export interface Rule extends FormulaBase {
  id: RuleId;
  kind: "rule";
  concept: ConceptId;
  checks: Check[];
}

export interface Formula extends FormulaBase {
  id: FormulaId;
  kind: "formula";
  dependsOn: { concepts: ConceptId[]; rules: RuleId[] };
  conditions?: { tex: string; why: Localized; concept?: ConceptId }[];
  derivation?: { plan: string[]; steps: DerivationStep[] };
  pitfalls?: Localized[];
  cs229?: CS229Ref[];
  usedIn?: string[];
}

export interface LessonRef {
  slug: string;
  number: string; // «II.3»
  title: string;
  optional?: boolean;
}

export interface Module {
  id: string;
  number: string;
  title: Localized;
  hours: [number, number];
  lessons: LessonRef[];
}

/** Статус урока (см. docs/conventions/pedagogy.md, «Прогресс: пройденные уроки»). */
export type LessonStatus = "not-started" | "in-progress" | "passed";
