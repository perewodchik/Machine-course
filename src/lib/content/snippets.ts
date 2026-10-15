// Сниппеты кода (code/snippets/**/*.py): единый источник кода уроков и лабораторных (docs/conventions/python.md).
// Регион — строки между «# region имя» и «# endregion»; отступ региона снимается, так что регион можно держать
// внутри служебной функции (def _demo(): …), а в уроке показать как код верхнего уровня.
// Ссылка: «la/normal_equations.py#solve» или несколько регионов подряд: «…#data+solve+demo».
// Неразрешённая ссылка — ContentError: сборка падает с именем файла и списком регионов.
import { readFileSync } from "node:fs";
import path from "node:path";
import { ContentError } from "./files";

export const SNIPPETS_DIR = "code/snippets";

const START = /^\s*# region ([\w-]+)\s*$/;
const END = /^\s*# endregion\b/;

export interface Snippet {
  /** Путь от code/snippets: la/normal_equations.py */
  file: string;
  regions: string[];
  /** Код выбранных регионов, без отступа, через пустую строку */
  code: string;
  /** Весь файл: служебный код, который ячейка выполняет молча перед показанным */
  source: string;
}

function dedent(lines: string[]): string[] {
  const indents = lines.filter((l) => l.trim()).map((l) => /^ */.exec(l)![0].length);
  const cut = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(cut));
}

/** Регионы файла по именам. Ошибки разметки (вложенный, незакрытый, повтор) — с номером строки. */
export function parseRegions(text: string, file: string): Map<string, string> {
  const regions = new Map<string, string>();
  const problems: string[] = [];
  let open: { name: string; line: number; body: string[] } | null = null;
  for (const [i, line] of text.split("\n").entries()) {
    const start = START.exec(line);
    if (start) {
      if (open) problems.push(`${file}:${i + 1}: регион «${start[1]}» внутри незакрытого «${open.name}» (строка ${open.line})`);
      else if (regions.has(start[1])) problems.push(`${file}:${i + 1}: регион «${start[1]}» повторяется`);
      open = { name: start[1], line: i + 1, body: [] };
    } else if (END.test(line)) {
      if (!open) problems.push(`${file}:${i + 1}: # endregion без # region`);
      else {
        const body = dedent(open.body);
        while (body.length && !body[0].trim()) body.shift();
        while (body.length && !body.at(-1)!.trim()) body.pop();
        regions.set(open.name, body.join("\n"));
        open = null;
      }
    } else open?.body.push(line);
  }
  if (open) problems.push(`${file}:${open.line}: регион «${open.name}» не закрыт (# endregion)`);
  if (problems.length) throw new ContentError(problems);
  return regions;
}

/** Разрешает ссылку «путь#регион[+регион…]» относительно code/snippets в корне проекта. */
export function loadSnippet(ref: string, root = process.cwd()): Snippet {
  const [file, spec = ""] = ref.split("#");
  const where = `сниппет «${ref}»`;
  if (!file.endsWith(".py") || file.includes("..")) throw new ContentError([`${where}: ожидается путь к .py внутри ${SNIPPETS_DIR}`]);
  const names = spec.split("+").filter(Boolean);
  if (names.length === 0) throw new ContentError([`${where}: после # укажите регион: ${file}#имя`]);
  let source: string;
  try {
    source = readFileSync(path.join(root, SNIPPETS_DIR, file), "utf8");
  } catch {
    throw new ContentError([`${where}: файла ${SNIPPETS_DIR}/${file} нет`]);
  }
  const regions = parseRegions(source, `${SNIPPETS_DIR}/${file}`);
  const unknown = names.filter((n) => !regions.has(n));
  if (unknown.length) {
    throw new ContentError([`${where}: нет региона ${unknown.map((n) => `«${n}»`).join(", ")}; в файле есть: ${[...regions.keys()].join(", ") || "ни одного"}`]);
  }
  return { file, regions: names, code: names.map((n) => regions.get(n)!).join("\n\n"), source };
}
