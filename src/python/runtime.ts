// Python на странице: один воркер Pyodide, создаётся при первом «Запустить»; ячейки выполняются по очереди.
// «Стоп»: при COOP/COEP (crossOriginIsolated) — сигнал SIGINT через SharedArrayBuffer, Python жив и готов дальше;
// без изоляции — запасной путь: воркер завершается, следующий запуск загрузит Python заново.
import { atom } from "nanostores";
import type { FromWorker, ToWorker } from "./protocol";
import type { ShapeItem } from "./shapes";

export type PyState = "idle" | "loading" | "ready";
export const $pyState = atom<PyState>("idle");

export type RunResult =
  | { ok: true; ms: number }
  | { ok: false; ms: number; kind: "python" | "interrupted" | "package" | "internal"; message: string };

export interface RunHandlers {
  /** Ячейку отправили в воркер (до этого она ждёт в очереди) */
  onStart?: () => void;
  onOut?: (text: string, stream: "stdout" | "stderr") => void;
  /** Формы промежуточных выражений (S3.06) — до конца запуска. */
  onShapes?: (items: ShapeItem[]) => void;
}

export interface PyJob {
  readonly result: Promise<RunResult>;
  stop(): void;
}

interface Job {
  id: number;
  setup: string;
  code: string;
  handlers: RunHandlers;
  resolve: (r: RunResult) => void;
}

let worker: Worker | null = null;
let interrupt: Uint8Array | null = null;
let active: Job | null = null;
const queue: Job[] = [];
let nextId = 1;

function send(message: ToWorker): void {
  worker?.postMessage(message);
}

function start(): Worker {
  const w = new Worker(new URL("./worker.ts", import.meta.url), { type: "module", name: "python" });
  const shared = globalThis.crossOriginIsolated ? new SharedArrayBuffer(1) : null;
  interrupt = shared ? new Uint8Array(shared) : null;
  w.onmessage = (event: MessageEvent<FromWorker>) => receive(event.data);
  w.onerror = (event) => {
    event.preventDefault();
    fail(event.message || "воркер Python остановился");
  };
  worker = w;
  $pyState.set("loading");
  send({ type: "init", interrupt: shared });
  return w;
}

function finish(result: RunResult): void {
  const job = active;
  active = null;
  job?.resolve(result);
  pump();
}

function receive(msg: FromWorker): void {
  if (msg.type === "ready") return $pyState.set("ready");
  if (msg.type === "fatal") return fail(msg.message);
  if (!active || msg.id !== active.id) return; // хвост прерванного запуска
  if (msg.type === "out") active.handlers.onOut?.(msg.text, msg.stream);
  else if (msg.type === "shapes") active.handlers.onShapes?.(msg.items);
  else if (msg.type === "done") finish({ ok: true, ms: msg.ms });
  else finish({ ok: false, ms: msg.ms, kind: msg.kind, message: msg.message });
}

/** Воркер больше не годится: всем, кто ждёт, — ошибка; следующий запуск создаст новый. */
function fail(message: string): void {
  worker?.terminate();
  worker = null;
  $pyState.set("idle");
  const waiting = [...(active ? [active] : []), ...queue.splice(0)];
  active = null;
  for (const job of waiting) job.resolve({ ok: false, ms: 0, kind: "internal", message });
}

function pump(): void {
  if (active || queue.length === 0) return;
  active = queue.shift()!;
  if (!worker) start();
  active.handlers.onStart?.();
  send({ type: "run", id: active.id, setup: active.setup, code: active.code });
}

function stop(job: Job): void {
  const queued = queue.indexOf(job);
  if (queued >= 0) {
    queue.splice(queued, 1);
    job.resolve({ ok: false, ms: 0, kind: "interrupted", message: "" });
  } else if (job === active) {
    if (interrupt && $pyState.get() === "ready") {
      interrupt[0] = 2; // SIGINT → KeyboardInterrupt в Python
    } else {
      // без SharedArrayBuffer (или во время загрузки) остановить Python можно только вместе с воркером
      worker?.terminate();
      worker = null;
      $pyState.set("idle");
      finish({ ok: false, ms: 0, kind: "interrupted", message: "" });
    }
  }
}

/** Ставит код в очередь. setup выполняется молча перед code в том же пространстве имён. */
export function runPython(setup: string, code: string, handlers: RunHandlers = {}): PyJob {
  let resolve!: (r: RunResult) => void;
  const result = new Promise<RunResult>((r) => (resolve = r));
  const job: Job = { id: nextId++, setup, code, handlers, resolve };
  queue.push(job);
  pump();
  return { result, stop: () => stop(job) };
}
