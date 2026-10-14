# Математика для машинного обучения

Интерактивный курс на русском языке: линейная алгебра, анализ, вероятность и статистика в объёме, нужном для Stanford CS229, и мост к самому ML. Каждая формула показывает, на что опирается и как выводится; шаги выводов проверяются численно.

**Статус:** проектирование. Есть план, программа, дизайн-система, прототип страниц, пример лабораторной и численная проверка формул. Сайт ещё не собран.

| Что | Где |
|---|---|
| Анализ, решения, вопросы на ревью | [`docs/analysis.md`](docs/analysis.md) |
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
