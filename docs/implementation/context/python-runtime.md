# Пакет: Python в курсе

Для задач S1.11, S2.05, S2.09, S3.06, S3.07 и лабораторных.

## Главное

- **Единый источник кода** — `code/snippets/**/*.py` с регионами `# region name` … `# endregion`. Урок вставляет регион при сборке (`<PyCode src="la/normal_equations.py#solve" run />`), ноутбук — директивой `# snippet: путь#регион`. Неразрешённая ссылка ломает сборку.
- **Числа в уроке закреплены тестом** в `code/tests/` (пример: `test_values_shown_in_lesson`).
- **Ячейка в уроке:** Pyodide 314 (Python 3.14, NumPy 2.4) в Web Worker; один воркер на страницу, создаётся по «Запустить»; ядро и пакеты со своего домена `/py/314.0.7/` с вечным кэшем; COOP/COEP включены → `SharedArrayBuffer` → кнопка «Стоп» прерывает выполнение. Графики рисует курс (Python возвращает массивы).
- **Лабораторные:** исходник Jupytext `notebooks/src/**/*.py`, решения между `# BEGIN SOLUTION` и `# END SOLUTION`; `scripts/build_notebooks.py` собирает ученические `.ipynb` (с `raise NotImplementedError`) и версии с решениями; CI — `pytest --nbmake`. Проверки — `mlf.check` (сообщения для ученика).
- **Где открывать:** «Открыть в Colab» (основная кнопка; ссылка на тег релиза публичного репозитория), «Открыть в браузере» (JupyterLite, без аккаунта).
- **CI:** `pytest code/` на CPython и в Pyodide; nbmake по ноутбукам с решениями; еженедельно — на свежих версиях пакетов.

## Где в коде (S2.05)

- `scripts/fetch-pyodide.ts` (`npm run py:fetch`, перед `dev` и `build`): ядро из npm-пакета `pyodide` (версия = `src/python/version.ts`), NumPy — с CDN или из архива релиза, sha256 по `pyodide-lock.json`. `public/py/` в `.gitignore`; в CI — кэш.
- `src/python/`: `worker.ts` (Pyodide, stdout/stderr, `setInterruptBuffer`), `runtime.ts` (один воркер, очередь, `runPython(setup, code)` → `{result, stop}`, `$pyState`; без `crossOriginIsolated` «Стоп» завершает воркер), `traceback.ts` (без кадров Pyodide, строки кода ячейки), `cell.ts` (кнопка «Запустить ↔ Стоп», «Изменить», вывод до 20 000 знаков), `links.ts` (Colab; JupyterLite — `JUPYTERLITE_BASE`, пока `null`).
- `src/lib/content/snippets.ts`: `loadSnippet("путь#a+b")` — регионы без отступа (регион можно держать внутри служебной функции: `def _lesson_cell():` → тест сверяет вывод). Валидатор проверяет `PyCode src`, `lab` и `OpenIn notebook` в MDX.
- `src/components/python/`: `PyCell`, `PyCode`, `OpenIn`; стили — `src/styles/python.css`; подсветка при сборке — `src/markdown/core/python.ts`.
- COOP/COEP: в проде — `public/_headers`, в `astro dev`/`preview` — `server.headers` в `astro.config.mjs`.
- Тесты: `tests/e2e/python.spec.ts` (θ из сниппета, «Стоп» без перезагрузки Python, правка, без JS), юнит — `snippets`, `python`, `traceback`.

## Лабораторные (S2.09)

- `scripts/build_notebooks.py` раскрывает `# snippet: путь#регион` через `code/mlf/snippets.py` (те же правила регионов, что `src/lib/content/snippets.ts`; общая фикстура `tests/fixtures/snippets`). Над кодом региона — комментарий, откуда он; неразрешённая ссылка роняет сборку.
- `mlf.check.matches(func, reference, inputs=…)` (S3.07): Hypothesis с `derandomize=True`, по умолчанию данные регрессии X (n × d), y; сообщение — минимальный контрпример. Пример — задание 5 лабораторной V.1.
- Репозиторий публичный: Colab открывает ученическую версию из `main` (`NOTEBOOKS.ref` в `src/python/links.ts`); после первого релиза — переключить на тег.

## Источники (только если нужно)

- `docs/conventions/python.md`, `docs/adr/0002-python-runtime.md`.
- `notebooks/src/la/normal_equations.py` — эталон лабораторной; `.claude/skills/new-notebook/SKILL.md`.

## Не делать

- matplotlib в браузере; загрузку данных из интернета в ноутбуках.
- Код урока, который расходится с кодом лабораторной (только через сниппеты).

## Формы в ячейке (S3.06, идея A6)

- `src/python/shapes.ts` — Python-функция `_mlf_shapes`, её определяет воркер при загрузке. После запуска ячейки — формы каждого `A @ B` верхнего уровня без вызовов функций («`X.T @ X (2, 12) @ (12, 2) → (2, 2)`») и присвоенных массивов; если ячейка упала — только произведения с несовпавшими внутренними размерами (красным). Внутрь функций и классов анализ не заходит.
- Сообщение воркера `shapes` приходит перед `done`/`error`; ячейка показывает список «Формы» под результатом (`[data-py-shapes]`).

