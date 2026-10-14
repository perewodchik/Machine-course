# Пакет: проверки и CI

Для всех задач — раздел «Проверка» в задаче берётся отсюда.

## Команды (после S1.01)

| Что | Команда |
|---|---|
| Типы Astro и TS | `npx astro check` |
| Линтеры | `npm run lint` (ESLint с boundaries и better-tailwindcss, stylelint) |
| Юнит-тесты | `npm test` (Vitest) |
| Валидатор контента | `npm run validate` |
| Сборка | `npm run build` |
| E2E и доступность | `npm run test:e2e` (Playwright + axe) |
| Формулы и Python | `cd code && pytest` |
| Лабораторные | `python scripts/build_notebooks.py --solutions /tmp/nb && pytest --nbmake /tmp/nb` |

Без тестов команды завершаются с кодом 0: `vitest run --passWithNoTests`, `playwright test --pass-with-no-tests`. Код выхода проверять (`; echo $?`), а не только вывод.

## Playwright

- `@playwright/test` **ровно 1.56.1**: его Chromium (chromium-1194) уже лежит в `/opt/pw-browsers`. Другая версия ищет другой браузер; тогда — `launchOptions.executablePath: '/opt/pw-browsers/chromium'`. `playwright install` не запускать.
- `playwright.config.ts`: `webServer` — `npm run preview`; проекты 1440 и 390 px; `@axe-core/playwright` для доступности.
- **Визуальные эталоны** снимаются только в CI, в образе `mcr.microsoft.com/playwright:v1.56.1-noble`: локальные шрифты и сглаживание дают другие пиксели. Локально — функциональные проверки и axe.

## Правила

- **Перед коммитом** — все команды, относящиеся к изменённым частям; большие выводы обрезать (`| tail -20`).
- **Интерфейс:** скриншоты Playwright (1440 и 390 px, светлая и тёмная темы, поля показаны и скрыты), затем скиллы `design-critique` и `accessibility-review` по скриншотам. Chromium уже установлен (`/opt/pw-browsers`), `playwright install` не запускать.
- **Визуальная регрессия:** эталонные скриншоты `/lab` в `tests/visual/`, снятые в CI; обновлять осознанно (артефакт workflow), с пометкой в журнале.
- **Нет горизонтальной прокрутки** на 390 px (проверка `document.documentElement.scrollWidth`).
- **Флейки** не «чинить» повтором: найти причину.

## Источники (только если нужно)

- `docs/conventions/code.md` — тесты, ветки и коммиты.
