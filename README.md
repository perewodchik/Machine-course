# Математика для машинного обучения

Интерактивный курс на русском языке: линейная алгебра, анализ, вероятность и статистика в объёме, нужном для Stanford CS229, и мост к самому ML. Каждая формула показывает, на что опирается и как выводится; шаги выводов проверяются численно.

**Статус:** проектирование завершено, реализация — по плану [`docs/implementation/PLAN.md`](docs/implementation/PLAN.md). Есть программа, дизайн-система, прототип страниц, пример лабораторной и численная проверка формул. Сайт ещё не собран.

| Что | Где |
|---|---|
| План реализации, журнал, стартовые промпты для агентов | [`docs/implementation/`](docs/implementation/README.md) |
| Анализ, решения, открытые вопросы | [`docs/analysis.md`](docs/analysis.md) |
| Идеи: что даёт компьютерное обучение | [`docs/ideas.md`](docs/ideas.md) |
| Программа курса (хэндбук понятий) | [`docs/program/`](docs/program/README.md) |
| Соглашения для авторов и разработчиков | [`docs/conventions/`](docs/conventions/README.md) |
| Дизайн-система | [`src/design-system/README.md`](src/design-system/README.md) |
| Скриншоты прототипа | [`docs/design/screenshots/`](docs/design/screenshots) |
| Прототип страниц | [`prototype/`](prototype/README.md) |
| Контент (YAML, MDX) | [`content/`](content/README.md) |
| Python: сниппеты, проверки, тесты формул | [`code/`](code/README.md) |
| Лабораторные | [`notebooks/`](notebooks/README.md) |
| Скиллы Claude Code | [`.claude/skills/`](.claude/skills) |

## Быстрый старт

```bash
# прототип
npx http-server -p 8123 -c-1 .   # http://localhost:8123/prototype/

# проверка формул, выводов и кода
cd code && pip install -e ".[dev]" && pytest

# лабораторные
python scripts/build_notebooks.py --solutions /tmp/nb && pytest --nbmake /tmp/nb
```

## Хостинг: Cloudflare Workers

Сайт статический (Astro → `dist/`), его отдаёт Worker `machine-course` со статическими ассетами: [`wrangler.jsonc`](wrangler.jsonc), заголовки COOP/COEP и кэш — [`public/_headers`](public/_headers) ([ADR 0005](docs/adr/0005-hosting-workers.md)). Бесплатного тарифа хватает.

Проект подключён к репозиторию (Workers & Pages → `machine-course` → Settings → Builds):

| Поле | Значение |
|---|---|
| Production branch | `main` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |

Пуш в `main` публикует сайт, пуш в другую ветку — превью-версию. `name` в `wrangler.jsonc` должен совпадать с именем Worker. Проверка заголовков: `curl -sI https://machine-course.<аккаунт>.workers.dev/ | grep -i cross-origin` → `same-origin` и `require-corp`.
