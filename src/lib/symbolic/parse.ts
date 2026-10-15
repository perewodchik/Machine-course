// Разбор TeX в MathJSON — парсер Compute Engine (только модуль latex-syntax, без вычислительного ядра).
import { parse } from "@cortex-js/compute-engine/latex-syntax";
import type { Json } from "./evaluate";

/** MathJSON или null, если запись пустая. */
export function parseTex(tex: string): Json | null {
  const t = tex.trim();
  return t ? (parse(t) as Json | null) : null;
}
