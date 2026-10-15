// Хранилище галочек «знаю»: атом nanostores + localStorage (файл с schemaVersion), миграция при загрузке,
// просьба браузеру не стирать данные (storage.persist), каждая смена — в журнал событий.
import { atom } from "nanostores";
import type { LessonKey, LessonMark, LessonMarks } from "../content/types";
import { exportMarks, importMarks, mergeMarks, migrate, setMark, SCHEMA_VERSION } from "../progress/marks";
import { logEvent } from "./journal";

const KEY = "mlf:marks";

/** Переименования уроков (content/redirects.yaml): BaseLayout кладёт их в страницу. */
function redirects(): Record<string, string> {
  try {
    const el = typeof document === "undefined" ? null : document.getElementById("lesson-redirects");
    return el ? (JSON.parse(el.textContent ?? "{}") as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function load(): LessonMarks {
  try {
    if (typeof localStorage === "undefined") return {};
    const raw = localStorage.getItem(KEY);
    return raw ? migrate(JSON.parse(raw), redirects()).marks : {};
  } catch {
    return {}; // битая запись или приватный режим: начинаем с чистого листа, файл не трогаем
  }
}

export const $marks = atom<LessonMarks>(load());

let persistAsked = false;

function save(marks: LessonMarks): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ schemaVersion: SCHEMA_VERSION, marks }));
  } catch {
    /* приватный режим: отметки живут до перезагрузки */
  }
  // Safari стирает localStorage сайта через 7 дней без визитов, если не попросить сохранить данные
  if (!persistAsked && typeof navigator !== "undefined" && navigator.storage?.persist) {
    persistAsked = true;
    void navigator.storage.persist().catch(() => undefined);
  }
}

export function mark(key: LessonKey, known: boolean, by: LessonMark["by"] = "learner"): void {
  const at = new Date().toISOString();
  const next = setMark($marks.get(), key, known, by, at);
  $marks.set(next);
  save(next);
  logEvent({ type: "mark", lesson: key, known, by, at });
}

export function exportFile(): string {
  return exportMarks($marks.get());
}

/** Импорт файла: отметки сливаются с текущими (по каждому уроку — более поздняя). Ошибка формата — исключение с понятным текстом. */
export function importFile(text: string): number {
  const file = importMarks(text, redirects());
  const next = mergeMarks($marks.get(), file.marks);
  $marks.set(next);
  save(next);
  return Object.keys(file.marks).length;
}
