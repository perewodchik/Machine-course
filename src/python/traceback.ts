// Трассировка Python для ученика: без кадров Pyodide (/lib/…/_pyodide/…), которые ученик не писал,
// со строками кода ячейки (Python не знает исходник «<ячейка>» и строку не печатает) и без советов про micropip.
import { CELL_FILE } from "./protocol";

const FRAME = /^ {2}File "([^"]+)", line (\d+)/;
const PYODIDE_HINT = /^The module '.*' is included in the Pyodide distribution/;

/**
 * Убирает внутренние кадры Pyodide; кадры кода урока и библиотек (numpy) остаются.
 * sources — исходники по имени «файла» («<ячейка>», «<сниппет>»): строка кода подставляется под кадр.
 */
export function cleanTraceback(message: string, sources: Readonly<Record<string, string>> = {}): string {
  const lines = message.replace(/\s+$/, "").split("\n");
  const out: string[] = [];
  let skip = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (PYODIDE_HINT.test(line)) break;
    const frame = FRAME.exec(line);
    if (frame) skip = /\/_?pyodide\//.test(frame[1]);
    else if (!line.startsWith("    ")) skip = false;
    if (skip) continue;
    out.push(line);
    const code = frame && sources[frame[1]]?.split("\n")[Number(frame[2]) - 1];
    if (code?.trim() && !lines[i + 1]?.startsWith("    ")) out.push(`    ${code.trim()}`);
  }
  // от трассировки остался только заголовок — он ничего не говорит
  if (out[0]?.startsWith("Traceback") && !out.some((l) => FRAME.test(l))) out.shift();
  return out.join("\n");
}

/** Строка кода ячейки, на которой упало выполнение (последний кадр «<ячейка>»): для статуса «ошибка в строке N». */
export function cellLine(message: string): number | null {
  let line: number | null = null;
  for (const m of message.matchAll(/^ {2}File "([^"]+)", line (\d+)/gm)) if (m[1] === CELL_FILE) line = Number(m[2]);
  return line;
}
