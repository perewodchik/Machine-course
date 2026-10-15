# CLAUDE.md

Интерактивные курсы на русском: «Математика для машинного обучения» (ЛА, анализ, вероятность, статистика, мост к Stanford CS229) — предисловие, и направление ML из восьми курсов по CS229 с проектами (`docs/program/catalog.md`, ADR 0004). Текущее состояние — блок «Сейчас» в `docs/implementation/PLAN.md`. Сайт — Astro в корне репозитория (`src/`), прототип — `prototype/`.

## Работа по плану реализации

Реализация идёт по `docs/implementation/PLAN.md`. Начало любой сессии реализации — скилл `continue-plan` (стартовые промпты — `docs/implementation/KICKOFF.md`):

1. `docs/implementation/context/00-project.md` (одна страница) → блок «Сейчас» в `PLAN.md` → верхняя запись `LOG.md`.
2. Задача: первая `[~]`, иначе первая `[ ]` с выполненными зависимостями.
3. Читать только пакеты из поля «Контекст» задачи.
4. После задачи: проверки, статус и «Итог» в `PLAN.md`, блок «Сейчас», запись в `LOG.md`, коммит с ID задачи, пуш в `impl/stage-N`.

## Карта контекста: что читать

| Делаешь | Читай | Не читай целиком |
|---|---|---|
| Каркас сайта, раскладка, деплой | `docs/implementation/context/site-foundation.md` | `docs/analysis.md` |
| Контент, YAML, формулы, KaTeX | `context/content-pipeline.md` | `docs/conventions/*` |
| Компоненты урока, упражнения | `context/pedagogy-components.md` | `docs/conventions/pedagogy.md` |
| Виджеты, игры | `context/widgets-games.md` | `prototype/*` (только нужный файл-эталон) |
| Python, лабораторные | `context/python-runtime.md` | — |
| Прогресс (галочка «знаю»), аналитика | `context/progress-learning.md` | — |
| Урок | `context/content-authoring.md` + карточка `### <номер>.` в `docs/program/` | `docs/program/*` целиком |
| Проверки, CI, скриншоты | `context/testing-ci.md` | — |
| Курсы ML (этапы 7–9) | `context/ml-courses.md` + программа курса `docs/program/<курс>/README.md` | `docs/program/catalog.md` целиком |
| ИИ-тьютор (этап 6) | `context/ai-tutor.md` | — |

## Где что лежит

- `docs/implementation/` — план реализации, журнал, пакеты контекста, стартовые промпты.
- `docs/analysis.md` — решения и открытые вопросы; `docs/program/` — программа курса математики, `docs/program/catalog.md` и `docs/program/<курс>/` — курсы ML; `docs/conventions/` — соглашения; `docs/ideas.md` — идеи. Читать по ссылкам из пакетов контекста, а не целиком.
- `src/design-system/` — токены и правила внешнего вида; `prototype/` — статичный прототип страниц.
- `content/` — курсы (`content/courses/<курс>/`), модули, понятия, формулы с выводами (YAML); `code/` — Python-пакет `mlf`, сниппеты, тесты; `notebooks/` — лабораторные (Jupytext → ipynb).
- `src/lib/content/types.ts` — модель контента; `src/games/_engine/types.ts` — контракт игры.

## Команды

Полный список и правила — `docs/implementation/context/testing-ci.md`.

```bash
npm ci                                                           # зависимости сайта (Node 22, см. .nvmrc)
npm run dev                                                      # сайт: http://localhost:4321
npm run build && npm run check                                   # сборка и типы Astro
npm test                                                         # Vitest
npm run test:e2e                                                 # Playwright + axe
npm run lint && npm run validate                                 # линтеры и валидатор контента (с S1.04 и S1.08)
npm run py:fetch                                                 # Pyodide в public/py (сам вызывается перед dev и build)
cd code && pip install -e ".[dev]" && pytest                     # формулы, выводы, сниппеты
python scripts/build_notebooks.py --solutions /tmp/nb            # сборка лабораторных
pytest --nbmake /tmp/nb                                          # лабораторные выполняются
python scripts/check_consistency.py                              # курсы, карточки, план, ссылки
npx http-server -p 8123 -c-1 .                                   # прототип: /prototype/
```

## Обязательные правила

1. **Контент на русском**, идентификаторы в коде — на английском, комментарии — на русском. Русская типографика: «ёлочки», длинное тире, неразрывные пробелы.
2. **Нотация как в CS229** (`docs/conventions/notation.md`): $n$ объектов, $d$ признаков, $x^{(i)}$, $\theta$, векторы-столбцы, градиент той же формы, что аргумент, десятичная точка.
3. **Формулы — данные.** Новая формула или вывод — YAML в `content/formulas/` с `check` у каждого шага; после правки запускать `pytest` в `code/`. Ошибка в выводе должна ронять тесты.
4. **Источники** — по иерархии из `docs/conventions/sources.md`. Материалы Stanford — ориентир программы, не источник текста и иллюстраций: не копировать.
5. **Внешний вид — только через токены** `src/design-system/tokens/tokens.css`. Ручки (синяя, красная, зелёная) не красят символы; цветных ролей символов три, вспомогательное — карандашом.
6. **Перед работой над интерфейсом** — скилл `frontend-design`; после — `design-critique` и `accessibility-review` по скриншотам (Playwright, Chromium уже установлен).
7. **Числа в уроке закреплены тестом:** если урок показывает результат кода, тот же результат проверяет тест в `code/tests/`.

## Скиллы проекта (`.claude/skills/`)

| Скилл | Когда |
|---|---|
| `new-lesson` | Создать урок по шаблону циклов |
| `new-formula` | Добавить формулу или правило с выводом и численной проверкой |
| `new-widget` | Создать интерактивный виджет (модель + представление + тест) |
| `new-game` | Создать мини-игру по контракту `GameSpec` |
| `new-notebook` | Создать лабораторную (Jupytext, решения, проверки) |
| `content-review` | Проверить урок по чек-листу педагогики, нотации и типографики |
| `continue-plan` | Продолжить реализацию по плану: следующая задача, контекст, проверки, журнал |
| `frontend-design`, `design-system`, `design-critique`, `accessibility-review`, `ux-copy` | Скиллы Anthropic (см. `THIRD_PARTY_NOTICES.md`) |
