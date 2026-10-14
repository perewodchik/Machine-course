// Чтение и проверка файлов content/ вне Astro: тесты схем, валидатор контента (S1.08), загрузчик понятий.
// Ошибка всегда называет файл, поле и причину: «content/concepts/la.yaml: [3].lesson: …».
import { readFileSync } from "node:fs";
import { parse, YAMLParseError } from "yaml";

interface Issue {
  readonly path: readonly PropertyKey[];
  readonly message: string;
}

interface Schema<T> {
  safeParse(data: unknown): { success: true; data: T } | { success: false; error: { issues: readonly Issue[] } };
}

export class ContentError extends Error {
  constructor(readonly problems: string[]) {
    super(problems.join("\n"));
    this.name = "ContentError";
  }
}

/** Путь поля: derivation.steps[2].goal; корень документа — «(корень)». */
export function formatPath(path: readonly PropertyKey[]): string {
  if (!path.length) return "(корень)";
  return path.map((p, i) => (typeof p === "number" ? `[${p}]` : `${i ? "." : ""}${String(p)}`)).join("");
}

export function formatIssues(file: string, issues: readonly Issue[], prefix: readonly PropertyKey[] = []): string[] {
  return issues.map((i) => `${file}: ${formatPath([...prefix, ...i.path])}: ${i.message}`);
}

/** Разбирает YAML; синтаксическая ошибка — с номером строки. */
export function parseYaml(text: string, file: string): unknown {
  try {
    return parse(text, { prettyErrors: true });
  } catch (e) {
    if (e instanceof YAMLParseError) {
      const line = e.linePos?.[0].line;
      throw new ContentError([`${file}${line ? `:${line}` : ""}: YAML не разбирается: ${e.message.split("\n")[0]}`]);
    }
    throw e;
  }
}

export function readYaml(file: string, displayName = file): unknown {
  return parseYaml(readFileSync(file, "utf8"), displayName);
}

/** Проверяет данные схемой; при ошибке бросает ContentError со всеми проблемами сразу. */
export function validate<T>(schema: Schema<T>, data: unknown, file: string, prefix: readonly PropertyKey[] = []): T {
  const r = schema.safeParse(data);
  if (!r.success) throw new ContentError(formatIssues(file, r.error.issues, prefix));
  return r.data;
}

/** Файл со списком записей (понятия, глоссарий): каждая запись проверяется отдельно, ID не повторяются. */
export function validateList<T extends { id: string }>(schema: Schema<T>, data: unknown, file: string): T[] {
  if (!Array.isArray(data)) throw new ContentError([`${file}: (корень): ожидался список записей`]);
  const problems: string[] = [];
  const items: T[] = [];
  const seen = new Set<string>();
  data.forEach((item, i) => {
    const r = schema.safeParse(item);
    if (!r.success) return problems.push(...formatIssues(file, r.error.issues, [i]));
    if (seen.has(r.data.id)) problems.push(`${file}: [${i}].id: ID «${r.data.id}» уже встречался в этом файле`);
    seen.add(r.data.id);
    items.push(r.data);
  });
  if (problems.length) throw new ContentError(problems);
  return items;
}
