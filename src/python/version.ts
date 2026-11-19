// Версия Pyodide и пакеты, которые курс раздаёт со своего домена (ADR 0002).
// Версия совпадает с devDependency pyodide в package.json: оттуда scripts/fetch-pyodide.ts берёт ядро.
export const PYODIDE_VERSION = "314.0.7";
export const PYODIDE_BASE = `/py/${PYODIDE_VERSION}/`;
/** Пакеты, которые воркер грузит при старте; зависимости подтягиваются по pyodide-lock.json. */
export const PY_PACKAGES = ["numpy"] as const;
/**
 * Пакеты, которые лежат на своём домене, но грузятся только ячейкой, где они импортируются (S7.12): scikit-learn
 * со scipy — около 30 МБ, им незачем ехать на каждую страницу. scripts/fetch-pyodide.ts кладёт их в public/py.
 */
export const PY_LAZY_PACKAGES = ["scikit-learn"] as const;
