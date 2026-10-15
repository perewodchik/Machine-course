// Банк входной диагностики (content/diagnostic.yaml) для сборки: компонент <Diagnostic> урока 0.2.
import { join } from "node:path";
import { readYaml, validate } from "./files";
import * as s from "./schemas";
import type { Diagnostic } from "./types";

const FILE = "content/diagnostic.yaml";

export function loadDiagnostic(root = process.cwd()): Diagnostic {
  return validate(s.diagnostic, readYaml(join(root, FILE), FILE), FILE) as Diagnostic;
}
