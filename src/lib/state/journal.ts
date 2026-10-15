// Журнал событий обучения (без сервера): попытки упражнений и уровни игр. Хранится в localStorage, последние 2000 записей.
// Из него — отчёт ученика файлом и график калибровки уверенности (S4.01); смены галочки «знаю» — тоже здесь.
import { atom } from "nanostores";
import type { GameResult } from "../../games/_engine/types";
import type { AttemptEvent, MarkEvent } from "../exercises/types";

/** Результат уровня игры: практика, на галочку «знаю» не влияет. */
export type GameEvent = { type: "game" } & GameResult;
export type JournalEvent = AttemptEvent | MarkEvent | GameEvent;

const KEY = "mlf:journal:v1";
const LIMIT = 2000;

function load(): JournalEvent[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]") as unknown;
    return Array.isArray(raw) ? (raw as JournalEvent[]) : [];
  } catch {
    return []; // приватный режим или битая запись
  }
}

export const $journal = atom<JournalEvent[]>(load());

export function logEvent(event: JournalEvent): void {
  const next = [...$journal.get(), event].slice(-LIMIT);
  $journal.set(next);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* приватный режим или переполнение: журнал живёт до перезагрузки */
  }
}
