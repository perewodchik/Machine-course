// типы из сборочного модуля можно: import type стирается при сборке и в браузер не попадает
import type { Macros } from "../lib/katex/macros";
export const names = (m: Macros): string[] => Object.keys(m);
