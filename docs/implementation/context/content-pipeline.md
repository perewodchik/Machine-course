# Пакет: контент и формулы

Для задач S1.06–S1.08, S3.03–S3.05, S5.03, S5.04 и любых правок `content/`.

## Главное

- **Модель контента** — `src/lib/content/types.ts` (источник истины для схем). Схемы Zod 4 — `src/lib/content/schemas.ts` (сообщения по-русски), коллекции — `src/content.config.ts`: `glob()` из `content/`, свои загрузчики для понятий (списки в нескольких файлах) и переименований. Чтение и проверка вне Astro — `src/lib/content/files.ts` (`readYaml`, `validate`, `validateList`; ошибка «файл: поле: причина»); битые примеры — `tests/fixtures/content/`.
- **ID записей коллекций:** курс — `foundations`; модуль — `<курс>/<модуль>`; урок — `LessonKey`; понятие, правило, формула, термин — свой `id`. Дерево курса для страниц — `loadCatalog()` (`src/lib/content/collections.ts`).
- **Коллекции:** курсы (`content/courses/*/course.yaml`: математика `foundations` и курсы ML — `docs/program/catalog.md`), модули (`<курс>/<модуль>/module.yaml`, порядок уроков здесь), уроки (`<курс>/<модуль>/<slug>.mdx`; ключ урока — `<курс>/<модуль>/<slug>`, тип `LessonKey`), понятия (`content/concepts/*.yaml`), правила и формулы (`content/formulas/**`), глоссарий, переименования (`content/redirects.yaml`).
- **YAML:** только блочный стиль; TeX в `'…'` или `|`. В `"…"` обратный слеш портит TeX (`"\theta"` → табуляция + `heta`). Текст с «: » — в кавычках.
- **Символы с ролями** в TeX — макрос `\sym{name}{tex}`; `name` объявлен в `symbols` формулы (или в frontmatter урока). Роли: `data` → `s1` бирюза, `param` → `s2` оранжевый, `target` → `s3` пурпур, `aux` → `s4` карандаш. Не больше трёх цветных ролей.
- **KaTeX 0.19 при сборке.** Общий модуль `src/markdown/core` с настройками: макросы курса; `trust: (ctx) => ['\\htmlData','\\htmlClass'].includes(ctx.command)`; `strict: (code) => code === 'htmlExtension' ? 'ignore' : 'warn'`. Один и тот же модуль используют MDX и компонент `<Formula>`.
- **Конвейер Markdown:** на срезе — явный `unified()` (`@astrojs/markdown-remark`) с `remark-math` и `rehype-katex`; логика не зависит от процессора (Astro 7 по умолчанию использует Sätteri).
- **Typograf** — только для текста, не для формул и кода; числа с десятичной точкой не трогать.
- **Проверка выводов:** у шага `check.kind` = `same | gradient | stationary | solution`, у правил — `identity | gradient`. Харнесс — `code/mlf/formulas.py`; размеры: n=7, d=3, m=4, k=5, p=2; вектор-столбец `[d, 1]` — одномерный массив.
- **Валидатор контента** (`npm run validate`): граф понятий без циклов; все ID существуют (пререквизиты, `by`, `lesson`, `usedIn`); каждый TeX компилируется KaTeX; все символы с ролями — через `\sym` и объявлены; ≤ 3 цветных ролей; у каждой заметки урока есть подпись.

## Источники (только если нужно)

- `docs/conventions/formulas.md` — формат формул целиком.
- `content/formulas/calc/normal-equations.yaml` — эталонная формула с выводом.
- `.claude/skills/new-formula/SKILL.md` — пошагово, как добавить формулу.

## Не делать

- Формулы с выводом прямо в MDX (только через реестр).
- Номера уроков в ID и URL.
- Переименование ID без записи в `content/redirects.yaml`.
