// Сообщения между страницей и воркером Pyodide. Один воркер на страницу, запуски идут по очереди.
import type { ShapeItem } from "./shapes";

/** Страница → воркер. */
export type ToWorker =
  /** Первое сообщение: общий буфер прерывания (если страница изолирована COOP/COEP) */
  | { type: "init"; interrupt: SharedArrayBuffer | null }
  /** setup выполняется молча (служебный код сниппета), затем code — то, что видит ученик */
  | { type: "run"; id: number; setup: string; code: string };

/** Воркер → страница. */
export type FromWorker =
  | { type: "ready"; ms: number }
  | { type: "out"; id: number; stream: "stdout" | "stderr"; text: string }
  /** Формы промежуточных выражений ячейки (S3.06): приходят перед done или error. */
  | { type: "shapes"; id: number; items: ShapeItem[] }
  | { type: "done"; id: number; ms: number }
  | { type: "error"; id: number; ms: number; kind: "python" | "interrupted" | "package" | "internal"; message: string }
  | { type: "fatal"; message: string };

/** Имена «файлов» в трассировке: по ним traceback.ts отличает код урока от внутренностей Pyodide. */
export const CELL_FILE = "<ячейка>";
export const SETUP_FILE = "<сниппет>";
