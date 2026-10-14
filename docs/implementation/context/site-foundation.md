# Пакет: каркас сайта

Для задач S1.01–S1.04, S1.10, S1.11.

## Главное

- **Astro 7.3** (Node ≥ 22.12), интеграции: `@astrojs/react`, `@astrojs/mdx`. TypeScript `strict`. Менеджер пакетов — npm.
- **React 19 только в островах** (`client:visible`): виджеты, игры, Python. Шапка, оглавление, раскладка урока — `.astro` без React.
- **Tailwind CSS 4.3** через `@tailwindcss/vite`; подключить `src/design-system/tokens/theme.css` (он импортирует `tokens.css` и отключает дефолтные палитру, тени, скругления, шрифты). Проверка: класс `bg-indigo-500` не генерируется.
- **Шрифты** — Fontsource: `@fontsource-variable/literata`, `@fontsource/ibm-plex-sans` (400, 500, 600, 400-italic), `@fontsource/ibm-plex-mono` (400); подмножества латиница, кириллица, греческий.
- **Тема без мигания:** инлайн-скрипт в `<head>` ставит `data-theme` из `localStorage` до отрисовки; так же — `data-margins`.
- **Раскладка урока** повторяет прототип (`prototype/assets/proto.css`, разделы «Раскладка урока», «Режим „поля скрыты“», «Адаптивность»):
  - ≥ 1260 px: оглавление 17rem | текст `--measure` (40rem) | поля `--margin-width` (15rem), красная линия полей;
  - рисунки и карточки формул (`.wide`) не заходят за линию полей; при скрытых полях расширяются до `--wide-measure` (54rem) симметрично;
  - кнопка «Скрыть поля» (состояние в `localStorage`), заметки сворачиваются в строки с подписью;
  - 900–1260 px: заметки в тексте; < 900 px: оглавление — выдвижная панель.
- **Маршруты:** `/` (главная), `/[module]/[lesson]` (слаги из `module.yaml`, без номеров), `/concepts/[id]`, `/map`, `/lab`, `/games/[id]`.
- **Хостинг:** Cloudflare Pages; `public/_headers`:
  ```
  /*
    Cross-Origin-Opener-Policy: same-origin
    Cross-Origin-Embedder-Policy: require-corp
  /py/*
    Cache-Control: public, max-age=31536000, immutable
  ```

## Источники (только если нужно)

- `docs/adr/0001-site-stack.md`, `docs/adr/0003-hosting.md` — почему так.
- `src/README.md` — каталоги и правила зависимостей между слоями.
- `src/design-system/README.md` — раздел «Раскладка урока».

## Не делать

- React-провайдеры вокруг всей страницы; глобальный клиентский роутер.
- Сырые цвета и размеры в компонентах (только токены).
- Импорт `lib/content`, `lib/katex`, `src/markdown` из клиентского кода.
