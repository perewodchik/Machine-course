# Пакет: Python в курсе

Для задач S1.11, S2.05, S2.09, S3.06, S3.07 и лабораторных.

## Главное

- **Единый источник кода** — `code/snippets/**/*.py` с регионами `# region name` … `# endregion`. Урок вставляет регион при сборке (`<PyCode src="la/normal_equations.py#solve" run />`), ноутбук — директивой `# snippet: путь#регион`. Неразрешённая ссылка ломает сборку.
- **Числа в уроке закреплены тестом** в `code/tests/` (пример: `test_values_shown_in_lesson`).
- **Ячейка в уроке:** Pyodide 314 (Python 3.14, NumPy 2.4) в Web Worker; один воркер на страницу, создаётся по «Запустить»; ядро и пакеты со своего домена `/py/314.0.7/` с вечным кэшем; COOP/COEP включены → `SharedArrayBuffer` → кнопка «Стоп» прерывает выполнение. Графики рисует курс (Python возвращает массивы).
- **Лабораторные:** исходник Jupytext `notebooks/src/**/*.py`, решения между `# BEGIN SOLUTION` и `# END SOLUTION`; `scripts/build_notebooks.py` собирает ученические `.ipynb` (с `raise NotImplementedError`) и версии с решениями; CI — `pytest --nbmake`. Проверки — `mlf.check` (сообщения для ученика).
- **Где открывать:** «Открыть в Colab» (основная кнопка; ссылка на тег релиза публичного репозитория), «Открыть в браузере» (JupyterLite, без аккаунта).
- **CI:** `pytest code/` на CPython и в Pyodide; nbmake по ноутбукам с решениями; еженедельно — на свежих версиях пакетов.

## Источники (только если нужно)

- `docs/conventions/python.md`, `docs/adr/0002-python-runtime.md`.
- `notebooks/src/la/normal_equations.py` — эталон лабораторной; `.claude/skills/new-notebook/SKILL.md`.

## Не делать

- matplotlib в браузере; загрузку данных из интернета в ноутбуках.
- Код урока, который расходится с кодом лабораторной (только через сниппеты).
