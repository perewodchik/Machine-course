// Трассировки — настоящие, из Pyodide 314.0.7 (код выполнялся с filename «<ячейка>»).
import { describe, expect, it } from "vitest";
import { cellLine, cleanTraceback } from "./traceback";

const BASE = '  File "/lib/python314.zip/_pyodide/_base.py"';
const zeroDiv = [
  "Traceback (most recent call last):",
  `${BASE}, line 619, in eval_code_async`,
  "    await CodeRunner(",
  "    ...<10 lines>...",
  "    .run_async(globals, locals)",
  `${BASE}, line 420, in run_async`,
  "    coroutine = eval(self.code, globals, locals)",
  '  File "<ячейка>", line 4, in <module>',
  '  File "<ячейка>", line 2, in f',
  "ZeroDivisionError: division by zero",
  "",
].join("\n");
const syntax = [
  "Traceback (most recent call last):",
  `${BASE}, line 151, in _parse_and_compile_gen`,
  "    mod = compile(source, filename, mode, flags | ast.PyCF_ONLY_AST)",
  '  File "<ячейка>", line 1',
  "    x = (1,",
  "        ^",
  "SyntaxError: '(' was never closed",
].join("\n");
const missing = [
  "Traceback (most recent call last):",
  `${BASE}, line 420, in run_async`,
  "    coroutine = eval(self.code, globals, locals)",
  '  File "<ячейка>", line 1, in <module>',
  "ModuleNotFoundError: No module named 'scipy'",
  "The module 'scipy' is included in the Pyodide distribution, but it is not installed.",
  "You can install it by calling:",
  '  await micropip.install("scipy") in Python, or',
].join("\n");

describe("трассировка для ученика", () => {
  it("убирает кадры Pyodide и подставляет строки кода ячейки", () => {
    const code = "def f():\n    return 1 / 0\n\nf()";
    expect(cleanTraceback(zeroDiv, { "<ячейка>": code })).toBe(
      [
        "Traceback (most recent call last):",
        '  File "<ячейка>", line 4, in <module>',
        "    f()",
        '  File "<ячейка>", line 2, in f',
        "    return 1 / 0",
        "ZeroDivisionError: division by zero",
      ].join("\n"),
    );
    expect(cellLine(zeroDiv)).toBe(2);
  });

  it("SyntaxError: строку и каретку печатает сам Python — не дублируем", () => {
    const out = cleanTraceback(syntax, { "<ячейка>": "x = (1,\nprint(x)" });
    expect(out).toBe(['Traceback (most recent call last):', '  File "<ячейка>", line 1', "    x = (1,", "        ^", "SyntaxError: '(' was never closed"].join("\n"));
    expect(cellLine(syntax)).toBe(1);
  });

  it("советы Pyodide про micropip обрезаются", () => {
    const out = cleanTraceback(missing);
    expect(out).toMatch(/ModuleNotFoundError: No module named 'scipy'$/);
    expect(out).not.toContain("micropip");
  });

  it("без кадров кода остаётся только сообщение", () => {
    expect(cleanTraceback(`Traceback (most recent call last):\n${BASE}, line 1, in x\n    y\nKeyboardInterrupt`)).toBe("KeyboardInterrupt");
    expect(cellLine("KeyboardInterrupt")).toBeNull();
  });
});
