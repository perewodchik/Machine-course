/// <reference lib="webworker" />
// Воркер Pyodide (ADR 0002): ядро и NumPy со своего домена (/py/<версия>/, scripts/fetch-pyodide.ts).
// Python работает синхронно и сообщений не принимает, поэтому «Стоп» приходит через общий буфер прерывания.
// Очередь запусков ведёт страница (runtime.ts): воркер всегда выполняет одну ячейку.
import type { loadPyodide as LoadPyodide, PyodideAPI } from "pyodide";
import { CELL_FILE, SETUP_FILE, type FromWorker, type ToWorker } from "./protocol";
import { SHAPES_PY, type ShapeItem } from "./shapes";
import { PY_PACKAGES, PYODIDE_BASE } from "./version";

declare const self: DedicatedWorkerGlobalScope;
const post = (message: FromWorker) => self.postMessage(message);
const quiet = { messageCallback: () => {}, errorCallback: () => {} };

let interrupt: Uint8Array | null = null;
let booting: Promise<PyodideAPI> | null = null;
let current = 0;
let shapesFn: ((src: string, ns: unknown, failed: boolean) => string) | null = null;

async function boot(): Promise<PyodideAPI> {
  const t0 = performance.now();
  // путь собирается во время выполнения: сборщик не должен тянуть Pyodide в бандл
  const url = `${PYODIDE_BASE}pyodide.mjs`;
  const { loadPyodide } = (await import(/* @vite-ignore */ url)) as { loadPyodide: typeof LoadPyodide };
  const py = await loadPyodide({ indexURL: PYODIDE_BASE });
  py.setStdout({ batched: (text) => post({ type: "out", id: current, stream: "stdout", text: `${text}\n` }) });
  py.setStderr({ batched: (text) => post({ type: "out", id: current, stream: "stderr", text: `${text}\n` }) });
  if (interrupt) py.setInterruptBuffer(interrupt);
  await py.loadPackage([...PY_PACKAGES], quiet);
  py.runPython(SHAPES_PY);
  shapesFn = py.globals.get("_mlf_shapes") as typeof shapesFn;
  post({ type: "ready", ms: performance.now() - t0 });
  return py;
}

async function run(id: number, setup: string, code: string): Promise<void> {
  let py: PyodideAPI;
  try {
    py = await (booting ??= boot());
  } catch (err) {
    booting = null;
    post({ type: "fatal", message: err instanceof Error ? err.message : String(err) });
    return;
  }
  current = id;
  if (interrupt) interrupt[0] = 0;
  const t0 = performance.now();
  // у каждой ячейки своё пространство имён: запуск повторяем, порядок ячеек не важен
  const globals = py.globals.get("dict")();
  try {
    await py.loadPackagesFromImports(`${setup}\n${code}`, quiet);
    if (setup) await py.runPythonAsync(setup, { globals, filename: SETUP_FILE });
    await py.runPythonAsync(code, { globals, filename: CELL_FILE });
    const ms = performance.now() - t0;
    shapes(id, code, globals, false);
    post({ type: "done", id, ms });
  } catch (err) {
    const type = (err as { type?: string }).type;
    if (type && type !== "KeyboardInterrupt") shapes(id, code, globals, true);
    const message = err instanceof Error ? err.message : String(err);
    const kind = type === "KeyboardInterrupt" ? "interrupted" : type === "ModuleNotFoundError" ? "package" : type ? "python" : "internal";
    post({ type: "error", id, ms: performance.now() - t0, kind, message });
  } finally {
    globals.destroy();
  }
}

/** Формы выражений ячейки (shapes.ts); сбой анализа не должен портить запуск. */
function shapes(id: number, code: string, globals: unknown, failed: boolean): void {
  if (!shapesFn) return;
  try {
    const items = JSON.parse(shapesFn(code, globals, failed)) as ShapeItem[];
    if (items.length) post({ type: "shapes", id, items });
  } catch {
    // анализ форм — подсказка, а не часть запуска
  }
}

self.onmessage = (event: MessageEvent<ToWorker>) => {
  const msg = event.data;
  if (msg.type === "init") {
    interrupt = msg.interrupt ? new Uint8Array(msg.interrupt) : null;
    booting ??= boot();
    booting.catch(() => {}); // ошибку загрузки сообщит первый запуск
  } else void run(msg.id, msg.setup, msg.code);
};
