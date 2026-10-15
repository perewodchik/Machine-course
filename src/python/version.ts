// Версия Pyodide и пакеты, которые курс раздаёт со своего домена (ADR 0002).
// Версия совпадает с devDependency pyodide в package.json: оттуда scripts/fetch-pyodide.ts берёт ядро.
export const PYODIDE_VERSION = "314.0.7";
export const PYODIDE_BASE = `/py/${PYODIDE_VERSION}/`;
/** Пакеты Pyodide, доступные в ячейках урока; зависимости подтягиваются по pyodide-lock.json. */
export const PY_PACKAGES = ["numpy"] as const;
