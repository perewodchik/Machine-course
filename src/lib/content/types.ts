/**
 * Модель контента курса. Это контракт между content/ (YAML и MDX) и кодом сайта.
 * Схемы Zod повторяют эти типы: src/lib/content/schemas.ts (коллекции — src/content.config.ts). Здесь — без зависимостей.
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
  sample?: "normal" | "invertible" | "spd" | "positive" | "simplex"; // значение для численной проверки: positive — σ, шаг; simplex — распределение (сумма 1)
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
  /** Частный случай, который чаще всего нужен: «для симметричной A: ∇ xᵀAx = 2Ax». */
  corollary?: Localized;
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
  number: string; // «II» в курсе математики, «1» в курсах ML
  title: Localized;
  hours: [number, number];
  lessons: LessonRef[];
}

/** Frontmatter урока: content/courses/<курс>/<модуль>/<slug>.mdx (docs/conventions/authoring.md, «MDX»). */
export interface LessonFrontmatter {
  id: string; // slug, совпадает с именем файла и записью в module.yaml
  title: string;
  number: string;
  concepts: ConceptId[]; // понятия, которые урок вводит
  minutes: number;
  lead?: string; // вводный абзац «зачем» под заголовком, текст с $…$
  cs229?: CS229Ref[]; // показываются заметкой «В CS229» у заголовка
  symbols?: SymbolSpec[]; // символы с ролями для \sym в разовых формулах урока
}

/** Термин глоссария: content/glossary.yaml. */
export interface GlossaryEntry {
  id: string;
  ru: string;
  en: string;
  note?: Localized;
}

/** Переименования: content/redirects.yaml, «старое → новое». Записи не удаляются. */
export interface Redirects {
  concepts?: Record<string, ConceptId>;
  lessons?: Record<string, LessonKey>;
  formulas?: Record<string, RuleId | FormulaId>;
}

/** Курс: content/courses/<id>/course.yaml. Каталог курсов — docs/program/catalog.md. */
export interface Course {
  id: string; // «foundations», «ml-basics», …
  /** Номер в каталоге: 1–8 у курсов ML; у курса математики номера нет — он предисловие. */
  number?: number;
  title: Localized;
  summary: Localized;
  cs229Edition: string;
  /** Курсы, на уроки которых ссылаются строки «Опирается на». */
  requires?: string[];
  throughline?: string;
  modules: string[]; // ID модулей по порядку
}

/** Ключ урока во всех курсах: «<курс>/<модуль>/<slug>», например «ml-basics/linear-models/logistic-regression». */
export type LessonKey = `${string}/${string}/${string}`;

/**
 * Галочка «знаю» у урока — одна булева отметка (см. docs/conventions/pedagogy.md, «Прогресс: галочка „знаю“»).
 * Нет записи — урок не отмечен. Уроки с `optional` (★) в счётчики не входят.
 */
export interface LessonMark {
  known: boolean;
  /** Кто изменил отметку последним: ученик, итоговая проверка урока или диагностика (тест-аут). */
  by: "learner" | "lesson-check" | "diagnostic";
  /** Дата изменения, ISO 8601. */
  at: string;
}

/** Прогресс ученика: отметки по ключам уроков. Отметка общая для всех курсов: урок математики, отмеченный из курса ML, отмечен и в курсе математики. */
export type LessonMarks = Record<LessonKey, LessonMark>;
