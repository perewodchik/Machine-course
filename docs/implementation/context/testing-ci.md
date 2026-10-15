# Пакет: проверки и CI

Для всех задач — раздел «Проверка» в задаче берётся отсюда.

## Команды (после S1.01)

В облачной сессии зависимости ставит хук `.claude/hooks/session-start.sh` (S1.02): `npm install` и `.venv` с `mlf[dev]`; `.venv/bin` — первым в `PATH`. Локально: `npm ci`, `python3 -m venv .venv && .venv/bin/pip install -e "code[dev]"`.

| Что | Команда |
|---|---|
| Типы Astro и TS | `npx astro check` |
| Линтеры | `npm run lint` (ESLint с boundaries и better-tailwindcss, stylelint) |
| Юнит-тесты | `npm test` (Vitest) |
| Валидатор контента | `npm run validate` |
| Сборка | `npm run build` |
| E2E и доступность | `npm run build && npm run test:e2e` (Playwright + axe; сервер — `astro preview`) |
| Скриншоты для ревью | `SCREENSHOTS=1 npx playwright test screens` → `test-screens/` (страницы × 1440/390 × темы × поля) |
| Pyodide для ячеек Python | `npm run py:fetch` — кладёт ядро и NumPy в `public/py/<версия>/` (в git не хранится); сам вызывается перед `dev` и `build`. Если CDN закрыт, берёт NumPy из архива релиза на GitHub (~340 MB потоком, один раз) |
| Формулы и Python | `cd code && pytest` |
| Лабораторные | `python scripts/build_notebooks.py --solutions /tmp/nb && pytest --nbmake /tmp/nb` |
| Согласованность курсов, программы и плана | `python scripts/check_consistency.py` (работает и до S1.01) |

Без тестов команды завершаются с кодом 0: `vitest run --passWithNoTests`, `playwright test --pass-with-no-tests`. Код выхода проверять (`; echo $?`), а не только вывод.

## CI (`.github/workflows/`)

| Workflow | Когда | Что |
|---|---|---|
| `ci.yml` | push в `main`, pull request, вручную | `site`: `npm ci`, lint, check, Vitest, validate, build; `e2e`: Playwright + axe в образе `mcr.microsoft.com/playwright:v1.56.1-noble`, отчёт артефактом при падении; `python`: pytest `code/`, сборка лабораторных, ученические ноутбуки совпадают с исходниками (`git diff --exit-code notebooks/`), nbmake, `check_consistency.py` |
| `visual.yml` | push в `main`, pull request, вручную (`update`) | визуальная регрессия `/lab` в том же образе |
| `weekly.yml` | понедельник 04:17 UTC, вручную | зависимости поднимаются до последних минорных (`npm-check-updates --target minor`, `pip install --upgrade`) и прогоняются проверки; упал — задача в план |

Workflow с `workflow_dispatch` видны в Actions только после попадания в `main`.

## Playwright

- `@playwright/test` **ровно 1.56.1**: его Chromium (chromium-1194) уже лежит в `/opt/pw-browsers`. Другая версия ищет другой браузер; тогда — `launchOptions.executablePath: '/opt/pw-browsers/chromium'`. `playwright install` не запускать.
- `playwright.config.ts`: `webServer` — `astro preview --ignore-lock` (без флага Astro 7 под ИИ-агентом уходит в фон, и Playwright теряет сервер; фоновый сервер — `npx astro preview --background`, остановка — `npx astro preview stop`); проекты `desktop` 1440 px и `mobile` 390 px с сенсором; `@axe-core/playwright` для доступности (помощники — `tests/e2e/support.ts`).
- axe не проверяет контраст текста под псевдоэлементами (`::before`/`::after` поверх колонки) — такие линии и фоны делать элементами с `aria-hidden`.
- **Визуальные эталоны** снимаются только в CI, в образе `mcr.microsoft.com/playwright:v1.56.1-noble`: локальные шрифты и сглаживание дают другие пиксели. Локально — функциональные проверки и axe.

## Правила

- **Перед коммитом** — все команды, относящиеся к изменённым частям; большие выводы обрезать (`| tail -20`).
- **Интерфейс:** скриншоты Playwright (1440 и 390 px, светлая и тёмная темы, поля показаны и скрыты), затем скиллы `design-critique` и `accessibility-review` по скриншотам. Chromium уже установлен (`/opt/pw-browsers`), `playwright install` не запускать.
- **Визуальная регрессия:** `tests/visual/lab.spec.ts` (только при `VISUAL=1`), эталоны — `tests/visual/__screenshots__/<проект>/`, снимаются в CI: `.github/workflows/visual.yml` в образе `mcr.microsoft.com/playwright:v1.56.1-noble`. Обновлять осознанно: запуск workflow с `update = true` → артефакт `visual-baselines` → коммит с пометкой в журнале. В CI отсутствующий эталон — ошибка (`updateSnapshots: "none"`); пока папки эталонов нет, job только предупреждает.
- **CSS отдельной страницы** (как `src/styles/lab.css`) начинается строкой `@layer properties, theme, base, components, utilities;`: Astro встраивает маленький файл `<style>` раньше общей таблицы, и без порядка слоёв сброс Tailwind (`base`) перекроет компоненты.
- **Нет горизонтальной прокрутки** на 390 px (проверка `document.documentElement.scrollWidth`).
- **Флейки** не «чинить» повтором: найти причину.

## Источники (только если нужно)

- `docs/conventions/code.md` — тесты, ветки и коммиты.
