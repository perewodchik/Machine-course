// Галочки «знаю»: чистые функции над LessonMarks (src/lib/content/types.ts). Хранилище — src/lib/state/marks.ts.
// Формат файла версионирован (schemaVersion); старые версии и переименованные уроки мигрируют при загрузке.
import type { LessonKey, LessonMark, LessonMarks } from "../content/types";

export const SCHEMA_VERSION = 2;

/** Файл прогресса: так он лежит в localStorage и так выгружается учеником. */
export interface MarksFile {
  schemaVersion: number;
  marks: LessonMarks;
}

export interface LessonInfo {
  key: string;
  optional?: boolean;
}

export function setMark(marks: LessonMarks, key: LessonKey, known: boolean, by: LessonMark["by"], at: string): LessonMarks {
  return { ...marks, [key]: { known, by, at } };
}

export const isKnown = (marks: LessonMarks, key: string): boolean => marks[key as LessonKey]?.known === true;

/** Сколько обязательных уроков отмечено: уроки ★ (optional) в счётчик не входят. */
export function countKnown(marks: LessonMarks, lessons: readonly LessonInfo[]): { known: number; total: number } {
  const required = lessons.filter((l) => !l.optional);
  return { known: required.filter((l) => isKnown(marks, l.key)).length, total: required.length };
}

const MARK_BY = new Set(["learner", "lesson-check", "diagnostic"]);
const isMark = (v: unknown): v is LessonMark =>
  typeof v === "object" && v !== null && typeof (v as LessonMark).known === "boolean" && MARK_BY.has((v as LessonMark).by) && typeof (v as LessonMark).at === "string";

export class MarksFormatError extends Error {}

/**
 * Приводит сохранённые данные к текущей версии.
 * v1 — прототип курса математики: ключи «<модуль>/<slug>» без курса → «foundations/<модуль>/<slug>».
 * Затем переименования уроков из content/redirects.yaml (старый ключ → новый, цепочки тоже).
 */
export function migrate(raw: unknown, redirects: Readonly<Record<string, string>> = {}): MarksFile {
  if (typeof raw !== "object" || raw === null) throw new MarksFormatError("это не файл прогресса: ожидался объект с полями schemaVersion и marks");
  const { schemaVersion, marks } = raw as { schemaVersion?: unknown; marks?: unknown };
  if (typeof schemaVersion !== "number") throw new MarksFormatError("в файле нет schemaVersion");
  if (schemaVersion > SCHEMA_VERSION) throw new MarksFormatError(`файл из более новой версии курса (${schemaVersion}); обновите страницу`);
  if (typeof marks !== "object" || marks === null) throw new MarksFormatError("в файле нет отметок (marks)");
  let entries = Object.entries(marks as Record<string, unknown>).filter((e): e is [string, LessonMark] => isMark(e[1]));
  if (schemaVersion < 2) entries = entries.map(([k, v]) => [k.split("/").length === 2 ? `foundations/${k}` : k, v]);
  const out: LessonMarks = {};
  for (const [key, mark] of entries) {
    let k = key;
    for (let guard = 0; redirects[k] && guard < 10; guard++) k = redirects[k]!;
    // два старых ключа слились в один — побеждает более поздняя отметка
    const prev = out[k as LessonKey];
    if (!prev || prev.at < mark.at) out[k as LessonKey] = mark;
  }
  return { schemaVersion: SCHEMA_VERSION, marks: out };
}

/** Объединение при импорте: по каждому уроку — более поздняя отметка. */
export function mergeMarks(a: LessonMarks, b: LessonMarks): LessonMarks {
  const out: LessonMarks = { ...a };
  for (const [k, m] of Object.entries(b) as [LessonKey, LessonMark][]) {
    const prev = out[k];
    if (!prev || prev.at <= m.at) out[k] = m;
  }
  return out;
}

export function exportMarks(marks: LessonMarks): string {
  return JSON.stringify({ schemaVersion: SCHEMA_VERSION, marks } satisfies MarksFile, null, 2);
}

export function importMarks(text: string, redirects?: Readonly<Record<string, string>>): MarksFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new MarksFormatError("файл не читается как JSON — выберите файл, сохранённый кнопкой «Сохранить прогресс»");
  }
  return migrate(raw, redirects);
}
