# 0005. Хостинг: Cloudflare Workers со статическими ассетами

- Статус: принято
- Дата: 2026-10-14
- Заменяет: [0003](0003-hosting.md)

## Контекст

Требования из ADR 0003 не изменились: сайт статический, Pyodide нужны заголовки COOP/COEP, нужны превью веток. При подключении панель Cloudflare создала проект Workers (`machine-course`), а не Pages: новые проекты Cloudflare ведёт в Workers.

## Решение

Cloudflare Workers со статическими ассетами, сборка из GitHub (Workers Builds). `wrangler.jsonc` в корне отдаёт `dist/`; заголовки — тот же `public/_headers`, Workers читает его так же, как Pages. В настройках проекта: Build command `npm run build`, Deploy command `npx wrangler deploy`, продакшен — ветка `main`; остальные ветки собираются как превью-версии.

## Последствия

- `name` в `wrangler.jsonc` должен совпадать с именем Worker в Cloudflare, иначе сборка падает.
- Слеш в конце пути Workers обрабатывает сам (`html_handling: auto-trailing-slash` по умолчанию) — как ссылки сайта.
- Встраивать сторонние ресурсы без CORP нельзя из-за COEP (e2e `hosting.spec.ts`); ссылки на Colab — обычные ссылки.
- Бесплатного тарифа хватает: статика не тратит лимит запросов Workers; до 20 000 файлов и 25 МиБ на файл.

## Отвергнутые варианты

- Cloudflare Pages (ADR 0003): подходит, но проект уже создан как Workers.
- Vercel, Netlify, GitHub Pages — см. ADR 0003.
