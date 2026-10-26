// Банк входной диагностики для сборки: content/diagnostic.yaml — урок 0.2, content/diagnostic-<курс>.yaml — входная
// проверка курса ML (урок 1.1 «Основ ML»). Компонент <Diagnostic bank="…">.
import { join } from "node:path";
import { readYaml, validate } from "./files";
import * as s from "./schemas";
import type { Diagnostic } from "./types";

const FILE = "content/diagnostic.yaml";

export function loadDiagnostic(file = FILE, root = process.cwd()): Diagnostic {
  return validate(s.diagnostic, readYaml(join(root, file), file), file) as Diagnostic;
}
