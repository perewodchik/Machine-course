// клиентский код не тянет сборочные модули (KaTeX, граф понятий)
import { macros } from "../lib/katex/macros";
export const count = Object.keys(macros).length;
