// Ячейки Python на странице (PyCell.astro): «Запустить» ↔ «Стоп» на одной кнопке, правка кода, вывод.
// Состояние объявляет строка статуса (role="status"); сам вывод не озвучивается построчно.
import { CELL_FILE, SETUP_FILE } from "./protocol";
import { $pyState, runPython, type PyJob, type RunResult } from "./runtime";
import { cellLine, cleanTraceback } from "./traceback";

const MAX_OUTPUT = 20_000; // знаков: бесконечный print не должен повесить страницу
const IDLE = "выполняется в браузере";
const fmtSeconds = (ms: number) => `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)} с`;

function setup(cell: HTMLElement): void {
  const q = <T extends HTMLElement>(sel: string) => cell.querySelector<T>(sel)!;
  const runBtn = q<HTMLButtonElement>("[data-py-run]");
  const runLabel = q("[data-py-run-label]");
  const editBtn = q<HTMLButtonElement>("[data-py-edit]");
  const status = q("[data-py-status]");
  const view = q("[data-py-view]");
  const editor = q<HTMLTextAreaElement>("[data-py-editor]");
  const outBox = q("[data-py-out]");
  const output = q("[data-py-output]");
  const time = q("[data-py-time]");
  const shapesBox = q("[data-py-shapes]");
  const shapesList = q("[data-py-shapes-list]");
  const source = JSON.parse(q("[data-py-source]").textContent ?? "{}") as { code: string; setup: string };

  let job: PyJob | null = null;
  let editing = false;
  let code = source.code;
  let pending = "";
  let length = 0;
  let frame = 0;

  status.textContent = IDLE;

  const flush = () => {
    frame = 0;
    output.append(pending);
    pending = "";
  };
  const write = (text: string, cls?: string) => {
    if (length >= MAX_OUTPUT) return;
    const room = MAX_OUTPUT - length;
    const piece = text.length > room ? `${text.slice(0, room)}\n… вывод обрезан` : text;
    length += piece.length;
    if (cls) {
      flush();
      const span = document.createElement("span");
      span.className = cls;
      span.textContent = piece;
      output.append(span);
    } else {
      pending += piece;
      frame ||= requestAnimationFrame(flush);
    }
  };

  const setRunning = (running: boolean) => {
    cell.toggleAttribute("data-running", running);
    runLabel.textContent = running ? "Стоп" : "Запустить";
  };

  /** Статус для глаз и скринридера: вывод не озвучивается построчно, поэтому подсказываем, где он. */
  const say = (text: string, hint = "") => {
    status.textContent = text;
    if (hint) {
      const span = document.createElement("span");
      span.className = "visually-hidden";
      span.textContent = hint;
      status.append(span);
    }
  };

  const finish = (r: RunResult) => {
    job = null;
    setRunning(false);
    if (frame) cancelAnimationFrame(frame);
    flush();
    time.textContent = r.ms > 0 ? fmtSeconds(r.ms) : "";
    if (r.ok) {
      say("готово", ", вывод ниже");
      if (length === 0) write("(ничего не напечатано)", "code-cell__muted");
    } else if (r.kind === "interrupted") {
      status.textContent = "остановлено";
      write(`${length ? "\n" : ""}Выполнение остановлено.`, "code-cell__muted");
    } else if (r.kind === "internal") {
      status.textContent = "Python не запустился";
      write(`Не удалось запустить Python: ${r.message}\nОбновите страницу или откройте лабораторную.`, "code-cell__error");
    } else {
      const line = cellLine(r.message);
      say(line ? `ошибка в строке ${line}` : "ошибка", ", подробности ниже");
      // кадры — обычным цветом, красной ручкой только само исключение (строки после последнего кадра)
      const lines = cleanTraceback(r.message, { [CELL_FILE]: code, [SETUP_FILE]: source.setup }).split("\n");
      const cut = lines.findLastIndex((l) => l.startsWith(" ")) + 1;
      if (cut > 0) write(`${lines.slice(0, cut).join("\n")}\n`, "code-cell__trace");
      write(lines.slice(cut).join("\n"), "code-cell__error");
      if (r.kind === "package") {
        write("\nВ ячейках урока доступны стандартная библиотека Python и NumPy; остальное — в лабораторной.", "code-cell__muted");
      }
    }
  };

  const run = () => {
    if (job) return job.stop();
    output.textContent = "";
    shapesList.textContent = "";
    shapesBox.hidden = true;
    pending = "";
    length = 0;
    time.textContent = "";
    outBox.hidden = false;
    setRunning(true);
    status.textContent = "в очереди…";
    code = editing ? editor.value : source.code;
    job = runPython(source.setup, code, {
      onStart: () => {
        status.textContent = $pyState.get() === "ready" ? "выполняется…" : "загружаем Python и NumPy (≈ 16 MB, один раз)…";
      },
      onOut: (text, stream) => write(text, stream === "stderr" ? "code-cell__error" : undefined),
      onShapes: (items) => {
        for (const it of items) {
          const li = document.createElement("li");
          li.className = it.bad ? "is-bad" : "";
          const code = document.createElement("code");
          code.textContent = it.expr;
          li.append(code, ` ${it.shape}`);
          shapesList.append(li);
        }
        shapesBox.hidden = false;
      },
    });
    // загрузка закончилась, ячейка начала выполняться
    const unbind = $pyState.listen((state) => {
      if (state === "ready" && job) status.textContent = "выполняется…";
    });
    void job.result.then((r) => {
      unbind();
      finish(r);
    });
  };

  const fit = () => {
    editor.rows = Math.max(3, editor.value.split("\n").length);
  };

  const toggleEdit = () => {
    editing = !editing;
    view.hidden = editing;
    editor.hidden = !editing;
    editBtn.textContent = editing ? "Вернуть как было" : "Изменить";
    if (editing) {
      editor.value = source.code;
      fit();
      // каретка в начало: иначе поле прокручено к концу последней строки
      editor.setSelectionRange(0, 0);
      editor.focus();
      editor.scrollLeft = 0;
    } else editBtn.focus();
  };

  runBtn.addEventListener("click", run);
  editBtn.addEventListener("click", toggleEdit);
  editor.addEventListener("input", fit);
  editor.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      run();
    }
  });
}

document.querySelectorAll<HTMLElement>("[data-py-cell]").forEach(setup);
