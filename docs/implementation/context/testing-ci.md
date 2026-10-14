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

## Правила

- **Перед коммитом** — все команды, относящиеся к изменённым частям; большие выводы обрезать (`| tail -20`).
- **Интерфейс:** скриншоты Playwright (1440 и 390 px, светлая и тёмная темы, поля показаны и скрыты), затем скиллы `design-critique` и `accessibility-review` по скриншотам. Chromium уже установлен (`/opt/pw-browsers`), `playwright install` не запускать.
- **Визуальная регрессия:** эталонные скриншоты `/lab` в `tests/visual/`; обновлять осознанно, с пометкой в журнале.
- **Нет горизонтальной прокрутки** на 390 px (проверка `document.documentElement.scrollWidth`).
- **Флейки** не «чинить» повтором: найти причину.

## Источники (только если нужно)

- `docs/conventions/code.md` — тесты, ветки и коммиты.
