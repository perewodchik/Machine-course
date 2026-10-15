# Журнал реализации

Новые записи — **сверху**. Агент в начале работы читает только верхнюю запись. Запись — не длиннее 12 строк; подробности — в коммитах.

## Шаблон записи

```markdown
### ГГГГ-ММ-ДД — S1.03 Токены, Tailwind, шрифты — готова | в работе | заблокирована
- **Сделано:** что именно, одной-тремя строками.
- **Файлы:** главные изменённые файлы.
- **Проверка:** команда → результат (например, `npm run build` → ok; `pytest` → 24 passed).
- **Отклонения от плана и решения:** что сделано не так, как написано в задаче, и почему.
- **Где остановился:** для задачи «в работе» — что осталось.
- **Следующий шаг:** ID следующей задачи.
- **Вопросы пользователю:** — или список.
```

---

### 2026-10-15 — S2.02 виджет «Подгонка прямой» — готова
- **Сделано:** src/widgets/la/fit-line/{model.ts,model.test.ts,FitLine.tsx,index.ts,README.md,data.json}, src/components/widgets/FitLine.astro, scripts/export_widget_data.py (data.json виджетов сайта), code/tests/test_normal_equations.py::test_widget_export_matches_generator, tests/e2e/fit-line.spec.ts; FitLine в lessonComponents; демо-урок использует виджет вместо заглушки.
- **Файлы:** src/widgets/la/fit-line/*, src/components/widgets/FitLine.astro, src/components/pedagogy/index.ts, scripts/export_widget_data.py, code/tests/test_normal_equations.py, tests/e2e/fit-line.spec.ts, src/pages/demo/lesson.astro
- **Проверка:** vitest 163 (θ* = (0.798, 0.548), J(2.5, 0.25) = 5.23, J(θ*) = 1.466), pytest 28, lint, astro check 0, build, e2e 100 (крайние значения ползунков — всё внутри области графика, подписи не ниже оси; минимум; сброс; подсветка из формулы)
- **Отклонения от плана и решения:** Нижний предел подписей на рисунке поднят до 12 px от оси: индекс опускается ниже базовой линии и вылезал на 1.5 px. Ползунки показывают три знака (θ* в тексте урока — с тремя).
- **Где остановился:** —
- **Следующий шаг:** S2.03.
- **Вопросы пользователю:** —

### 2026-10-15 — S2.01 набор widgets/_kit — готова
- **Сделано:** src/widgets/_kit/* (логика layout/clip/format/scrub + 10 элементов + KitDemo, README), src/styles/kit.css, раздел «Набор для рисунков» на /lab (остров client:visible). Тесты: kit.test.ts (шкалы, клетка совпадает с делениями при 300–1200 px, обрезка Лианга — Барски, подписи, клавиатура), render.test.tsx (SSR: viewBox, clipPath, подписи, ARIA), e2e: стрелки и Shift+стрелка, End, прямая вне графика без подписи, подсветка X из рисунка в формулах. Зависимости: d3-scale 4.0.2, @nanostores/react 2.0.1.
- **Файлы:** src/widgets/_kit/*, src/styles/kit.css, src/pages/lab.astro, tests/e2e/lab.spec.ts
- **Проверка:** lint, astro check 0, vitest 156, build, e2e 93
- **Отклонения от плана и решения:** Подпись прямой сдвигается вниз с учётом наклона и ширины подписи — иначе на узком рисунке налезает на линию (в прототипе отступ был постоянный). Ellipse рисуется матрицей преобразования единичной окружности (разные масштабы осей) с vector-effect: non-scaling-stroke.
- **Где остановился:** —
- **Следующий шаг:** S2.02.
- **Вопросы пользователю:** —

### 2026-10-14 — S1.13 Подключение Cloudflare — ждёт пользователя
- **Сделано:** пользователь создал проект Workers `machine-course` (не Pages), продакшен — `main`. ADR 0005 (Workers со статическими ассетами) заменяет 0003. `wrangler.jsonc` отдаёт `dist/`, `public/_headers` без изменений. В `main` положена заглушка (`placeholder/`, коммит 5321d89); ветка слила `main` и убрала заглушку, так что слияние ветки в `main` пройдёт без конфликтов.
- **Файлы:** wrangler.jsonc, docs/adr/0005-hosting-workers.md, README.md (раздел «Хостинг»), docs/implementation/context/{site-foundation,00-project}.md
- **Проверка:** npm run build, `npx wrangler deploy --dry-run`, `wrangler dev` + curl -I (COOP/COEP, кэш /_astro/*), npm test, lint, astro check
- **Отклонения от плана и решения:** Pages → Workers (так создала проект панель Cloudflare). Build command `npm run build` общий для веток: сборки `main` падают до слияния (в заглушке нет package.json) — пользователь согласен.
- **Где остановился:** заголовки на живом сайте не проверены — сеть среды не пускает к *.workers.dev.
- **Следующий шаг:** S2.01 (S1.14 ждёт согласия на pull request).
- **Вопросы пользователю:** прислать адрес сайта или скриншот сборки ветки, если упадёт.

### 2026-10-14 — S1.14 итог этапа 1 — нужен пользователь
- **Сделано:** Этап 1 (S1.01–S1.12, кроме S1.13): Astro 7 + React-острова, Tailwind 4 из токенов, линтеры со слоями и токенами, раскладка урока с полями и оглавлением с галочками «знаю», коллекции и Zod-схемы всего content/, KaTeX-конвейер с ролями символов и типографом, валидатор контента, педагогические компоненты (Note, Block, Prereqs, Formula, Derivation), витрина /lab, CI (ci.yml, visual.yml, weekly.yml), заголовки Cloudflare Pages. Проверки: 135 юнит-тестов, 88 e2e с axe в обеих темах на 1440 и 390 px, валидатор, pytest, лабораторные. Скриншоты — docs/implementation/screens/stage1-*.png.
- **Файлы:** docs/implementation/screens/stage1-lab-light.png, docs/implementation/screens/stage1-lesson-light.png
- **Проверка:** все команды CI локально, код выхода 0
- **Отклонения от плана и решения:** Ветка — docs/course-analysis, а не impl/stage-1: среда разрешает пуш только в неё. Открыто: S1.13 (подключить Cloudflare Pages — пользователь), эталоны визуальной регрессии (первый прогон visual.yml с update=true), версии GitHub Actions не сверены.
- **Где остановился:** ждёт ответа о pull request; агент продолжает этап 2 (S2.01)
- **Следующий шаг:** S2.01.
- **Вопросы пользователю:** Открыть pull request docs/course-analysis → main с этапом 1? Подключите Cloudflare Pages по README («Хостинг»), если ещё не подключили.

### 2026-10-14 — S1.11 CI — готова
- **Сделано:** .github/workflows/ci.yml, .github/workflows/weekly.yml; раздел «CI» в context/testing-ci.md. Локально теми же командами: npm ci, lint, check, test (135), validate, build, CI=true test:e2e (88), pytest (27), build_notebooks + git diff notebooks/ + nbmake, check_consistency.
- **Файлы:** .github/workflows/{ci,weekly}.yml, docs/implementation/context/testing-ci.md
- **Проверка:** все команды workflow выполнены локально, код выхода 0
- **Отклонения от плана и решения:** Workflow ещё ни разу не запускались на GitHub: ветка не main, а workflow_dispatch виден только из main — первый прогон будет на pull request. Версии actions (checkout@v4, setup-node@v4, setup-python@v5, upload-artifact@v4) не сверены с последними релизами: доступ к чужим репозиториям в этой сессии закрыт. S1.12 уже сделана другой сессией; S1.13 ждёт пользователя — следующей агентской задачей идёт S1.14 (итог этапа) или этап 2.
- **Где остановился:** —
- **Следующий шаг:** S1.14 (S1.13 ждёт пользователя).
- **Вопросы пользователю:** —

### 2026-10-14 — S1.10 страница /lab и визуальные тесты — готова
- **Сделано:** src/pages/lab.astro, src/styles/lab.css, src/design-system/tokens/read.ts (значения тем, контраст WCAG), tests/unit/tokens.test.ts (текст ≥ 4.5:1, рамки ≥ 3:1 в обеих темах, два блока тёмной темы совпадают), tests/e2e/lab.spec.ts, tests/visual/lab.spec.ts (VISUAL=1), playwright.config: testDir tests, snapshotPathTemplate, updateSnapshots none в CI; .github/workflows/visual.yml.
- **Файлы:** src/pages/lab.astro, src/styles/lab.css, src/design-system/tokens/read.ts, tests/unit/tokens.test.ts, tests/e2e/lab.spec.ts, tests/visual/lab.spec.ts, playwright.config.ts, .github/workflows/visual.yml
- **Проверка:** lint, astro check 0, vitest 135, build, e2e 88 (axe /lab в обеих темах, 1440 и 390 px)
- **Отклонения от плана и решения:** Эталонов скриншотов в репозитории ещё нет: их снимает workflow visual.yml с update=true (артефакт visual-baselines) — после первого прогона CI их нужно закоммитить; до этого job только предупреждает. Ловушка: маленький CSS страницы Astro встраивает <style> раньше общей таблицы — без строки порядка слоёв base (сброс Tailwind) перекрывал компоненты.
- **Где остановился:** —
- **Следующий шаг:** S1.11.
- **Вопросы пользователю:** —

### 2026-10-14 — S1.09 педагогические компоненты — готова
- **Сделано:** src/components/pedagogy/* (Note, Block, Prereqs, Formula, Derivation, SymbolLegend — теперь фраза «где X — …» с кнопками, Tex, index.ts), src/lib/content/registry.ts, src/client/{tabs,derivation}.ts, src/styles/pedagogy.css, класс .js в <head>; маршрут урока рендерит MDX из коллекции lessons; f.normal-equations: \sym во всех шагах и условии; texToText для aria-label легенды; tests/e2e/pedagogy.spec.ts.
- **Файлы:** src/components/pedagogy/*, src/lib/content/registry.ts, src/client/{tabs,derivation,scrollable}.ts, src/styles/{pedagogy,math}.css, src/pages/demo/lesson.astro, src/pages/[course]/[module]/[lesson].astro, content/formulas/calc/normal-equations.yaml, tests/e2e/pedagogy.spec.ts
- **Проверка:** lint, astro check 0, vitest 107, validate, pytest 27, build, e2e 66 (вкладки стрелками, шаги вывода, раскрытие правила, axe в обеих темах на 1440 и 390 px); скриншоты сверены с прототипом
- **Отклонения от плана и решения:** Ловушки: в атрибуте tex="…" .astro обрабатывает escape-последовательности (\t → табуляция) — только String.raw; aria-label на div без роли запрещён axe — у прокручиваемой формулы role="group" (это и сбой axe на /demo/math, найденный в S1.12). Скрытие шагов и вкладок — под классом .js (без JS видно всё). package-lock: нормализация флагов dev после npm install в хуке старта.
- **Где остановился:** —
- **Следующий шаг:** S1.10.
- **Вопросы пользователю:** —

### 2026-10-14 — S1.12 Деплой: подготовка — готова
- **Сделано:** public/_headers (COOP/COEP, immutable для /_astro/* и /py/*), e2e hosting.spec.ts (все запросы на свой origin, 5 страниц × 2 проекта), юнит headers.test.ts, инструкция подключения Cloudflare Pages в README. Пробовали Vercel — пользователь вернул Cloudflare, ADR 0003 в силе.
- **Файлы:** public/_headers, tests/e2e/hosting.spec.ts, tests/unit/headers.test.ts, README.md
- **Проверка:** npm test, lint, astro check, build + test -f dist/_headers, e2e hosting
- **Отклонения от плана и решения:** сделана до S1.11 (CI) по просьбе пользователя. Создать проект из облачной сессии нельзя: сеть среды блокирует api.cloudflare.com и *.pages.dev, токена нет. Найдено, не исправлено: axe «math» на mobile падает и до этих изменений — aria-prohibited-attr на .katex-display (S1.07, scrollable.ts).
- **Где остановился:** —
- **Следующий шаг:** S1.13 — пользователь подключает Cloudflare Pages; агенту — S1.09.
- **Вопросы пользователю:** подключить репозиторий в Cloudflare Pages по README.

### 2026-10-14 — S1.08 валидатор контента — готова
- **Сделано:** src/lib/content/validate.ts (validateContent(root) → проблемы «файл: где: что»), scripts/validate-content.ts, npm run validate = tsx; тесты validate.test.ts: текущий content/, база и 13 случаев tests/fixtures/validate/cases/*. Граф понятий дополнен (nota.yaml, calc.yaml, ml.yaml, la.yaml: +15), иначе формулы ссылались на несуществующие ID. Зависимости: tsx 4.23.15, remark-mdx 3.1.1.
- **Файлы:** src/lib/content/validate.ts, scripts/validate-content.ts, src/lib/content/validate.test.ts, tests/fixtures/validate/**, content/concepts/*.yaml, package.json
- **Проверка:** npm run validate (26 TeX, ошибок нет), vitest 106, lint, astro check 0, build
- **Отклонения от плана и решения:** «≤ 3 цветных ролей» гарантирует схема (цветных ролей ровно три: data, param, target), фикстуру на это сделать нельзя — вместо неё проверка «одно имя — одна роль» (role-conflict). Голые символы проверяются только в формулах, где уже есть \sym: в формулах без ролей подсветки нет и голые символы допустимы.
- **Где остановился:** —
- **Следующий шаг:** S1.09.
- **Вопросы пользователю:** —

### 2026-10-14 — S1.07 Markdown-конвейер, KaTeX, подсветка символов — готова
- **Сделано:** src/markdown/core/{katex,typograf,plugins}.ts: assignRoles (\sym{name} → \symr{name}{слот} по symbols), renderTex для компонентов, remarkSymbolRoles (меняет и data.hChildren — иначе mdast-util-math рисует исходный TeX), rehypeFailOnMathErrors, rehypeTypograf. astro.config: markdown.processor = unified(), smartypants выключен. KaTeX 0.19 один на проект (overrides). src/lib/state/highlight.ts, src/client/symbols.ts, src/client/scrollable.ts (tabindex у прокручиваемых формул), SymbolLegend.astro, src/styles/math.css, демо /demo/math/.
- **Файлы:** src/markdown/core/*, astro.config.mjs, src/lib/state/highlight.ts, src/client/{symbols,scrollable}.ts, src/components/pedagogy/SymbolLegend.astro, src/styles/math.css, src/pages/demo/{math.astro,_math.mdx}, tests/e2e/math.spec.ts, docs/adr/0001-site-stack.md
- **Проверка:** vitest 86 (14 — конвейер: роли, блокировка \href/\url/\htmlStyle/\htmlId/\includegraphics, ошибки TeX, типограф), lint, astro check 0, build, e2e 54 (подсветка мышью и с легенды, axe; mobile-axe прогнан 4 раза подряд), pytest 27
- **Отклонения от плана и решения:** Недоверенные команды KaTeX не роняют рендер, а показываются красным текстом без ссылок и стилей; запрет их в контенте — задача валидатора S1.08. Stylelint: разрешено подчёркивание inset 0 -Npx currentColor (подсветка символа цветом роли). Флейк axe scrollable-region на 390 px: формула шире блока на 1 px из-за округления — порог без допуска. План и журнал записаны отдельным коммитом (скрипт плана упал на обратном слеше).
- **Где остановился:** —
- **Следующий шаг:** S1.08.
- **Вопросы пользователю:** —

### 2026-10-14 — S1.06 коллекции контента и схемы — готова
- **Сделано:** src/lib/content/schemas.ts (вкл. запрет управляющих символов в TeX — ловушка двойных кавычек YAML, проверку подцелей и check у шагов вывода), src/lib/content/files.ts (readYaml/validate/validateList с ошибкой «файл: поле: причина»), src/content.config.ts (свои загрузчики понятий и переименований), schemas.test.ts, tests/fixtures/content/*. Типы: Rule.corollary (уже было в YAML), LessonFrontmatter, GlossaryEntry, Redirects. @types/node 22, yaml 2.9.1.
- **Файлы:** src/lib/content/{schemas,files,types}.ts, src/content.config.ts, src/lib/content/schemas.test.ts, tests/fixtures/content/*, docs/implementation/context/content-pipeline.md
- **Проверка:** vitest 72 passed, astro check 0, lint, build (битый контент роняет сборку с файлом и полем — проверено вручную), e2e 45, pytest 27, check_consistency
- **Отклонения от плана и решения:** Уроков MDX пока нет: сборка предупреждает «No files found matching */*/*.mdx» — уйдёт с первым уроком (S2).
- **Где остановился:** —
- **Следующий шаг:** S1.07.
- **Вопросы пользователю:** —

### 2026-10-14 — S1.05 раскладка: шапка, оглавление, урок с полями — готова
- **Сделано:** Коллекции courses и modules (src/content.config.ts, раньше S1.06), дерево курса src/lib/content/catalog.ts с тестами; номер курса в каталоге — поле number в course.yaml. Компоненты layout (шапка, оглавление, Know, иконки), src/client/layout.ts, src/styles/layout.css, токен --header-height. Страницы: каталог, курс, урок-заглушка, демо-урок. playwright.config.ts, tests/e2e (layout, axe, помощник скриншотов screens.spec.ts → test-screens/).
- **Файлы:** src/content.config.ts, src/lib/content/{catalog,collections}.ts, src/components/layout/*, src/layouts/*, src/client/layout.ts, src/styles/layout.css, src/pages/**, playwright.config.ts, tests/e2e/*
- **Проверка:** lint, vitest 20, astro check 0, build 125 страниц, e2e 45 passed (axe чистый в обеих темах), pytest 27, check_consistency без ошибок
- **Отклонения от плана и решения:** Отступления от прототипа: .wide без clear (заметка стоит рядом, а не сдвигает блок); линия полей и фон колонки оглавления — элементы, не псевдоэлементы и не градиент (axe проверяет контраст); без scrollIntoView в оглавлении (сдвигал стартовую точку Tab); при открытом оглавлении на 390 px текст inert, фокус на текущем уроке; scroll-padding под шапку. Astro 7 под агентом уводит preview в фон — в webServer флаг --ignore-lock. Галочки пока не сохраняются — S2.04.
- **Где остановился:** —
- **Следующий шаг:** S1.06.
- **Вопросы пользователю:** —

### 2026-10-14 — S1.04 Линтеры — готова
- **Сделано:** eslint.config.js и stylelint.config.js; npm run lint = eslint + stylelint; 16 фикстур в tests/fixtures/lint/src (нарушения и разрешённые случаи); tests/unit/lint.test.ts — 10 проверок.
- **Файлы:** eslint.config.js, stylelint.config.js, tests/unit/lint.test.ts, tests/fixtures/lint/**, src/styles/base.css
- **Проверка:** npm run lint → exit 0; npm test → 12 passed
- **Отклонения от плана и решения:** eslint-plugin-jsx-a11y не поддерживает ESLint 10 — не ставили (доступность проверяет axe в e2e). handlebars поднят до 4.7.10 через overrides; у braces/micromatch (dev-зависимости линтеров) исправленной версии нет — риск принят: шаблоны задаём мы сами. Модель виджета для игр выделена путём файла (model.ts), а не категорией: в boundaries 7 категории в политиках не сработали.
- **Следующий шаг:** S1.05.
- **Вопросы пользователю:** —

### 2026-10-14 — S1.03 Токены, Tailwind, шрифты, базовые стили — готова
- **Сделано:** src/styles/global.css (шрифты, theme.css, base.css); base.css — стили прототипа до «Шапки»; vitest.config.ts (тесты рядом с кодом и в tests/unit); тест tests/unit/tailwind-theme.test.ts компилирует фикстуру с bg-indigo-500 и bg-paper.
- **Файлы:** astro.config.mjs, vitest.config.ts, src/styles/*.css, tests/unit/tailwind-theme.test.ts, tests/fixtures/tailwind/sample.html
- **Проверка:** npm test → 2 passed; npm run build ok (43 woff2 локально, в CSS нет indigo); astro check → 0 ошибок
- **Отклонения от плана и решения:** Тесты Vitest — рядом с кодом (*.test.ts) и в tests/unit; e2e Playwright — в tests/e2e (*.spec.ts), Vitest их не подхватывает.
- **Следующий шаг:** S1.04.
- **Вопросы пользователю:** —

### 2026-10-14 — S1.02 Хук старта облачной сессии — готова
- **Сделано:** Синхронный хук .claude/hooks/session-start.sh (только при CLAUDE_CODE_REMOTE=true): npm install, venv .venv с pip install -e code[dev], PATH через CLAUDE_ENV_FILE; зарегистрирован в .claude/settings.json.
- **Файлы:** .claude/hooks/session-start.sh, .claude/settings.json, context/testing-ci.md
- **Проверка:** чистый клон ветки → хук (34 с, exit 0) → npm run build ok, cd code && pytest → 27 passed, npm run lint ok
- **Отклонения от плана и решения:** npm install вместо npm ci в хуке — по рекомендации скилла (кэш контейнера); lockfile не меняется.
- **Следующий шаг:** S1.03.
- **Вопросы пользователю:** —

### 2026-10-14 — S1.01 Проект Astro — готова
- **Сделано:** Astro 7.3.8 с интеграциями React и MDX в корне; tsconfig strict; скрипты dev/build/preview/check/lint/test/test:e2e/validate (lint и validate — заглушки до S1.04 и S1.08); .nvmrc 22; команды в CLAUDE.md и 00-project.md.
- **Файлы:** package.json, package-lock.json, astro.config.mjs, tsconfig.json, src/pages/index.astro, .gitignore
- **Проверка:** npm ci && npm run build && npx astro check && npm test && npm run test:e2e && npm run validate && npm run lint → exit 0; astro check — 0 ошибок
- **Отклонения от плана и решения:** Работаю в ветке docs/course-analysis, а не impl/stage-1: в этой облачной сессии разрешён пуш только в неё.
- **Следующий шаг:** S1.02.
- **Вопросы пользователю:** —

### 2026-10-14 — Каталог курсов: математика — предисловие, ML — восемь курсов
- **Сделано:** ADR 0004; `docs/program/catalog.md`; восемь курсов ML в `content/courses/*` (60 уроков, 55 обязательных) с программами `docs/program/<курс>/README.md`; полные карточки «Основ ML» (11 уроков) и проекты P1–P2; модуль V математики — 2 урока, редиректы старых уроков; этапы 7–9 плана; пакет `context/ml-courses.md`; нотация курсов ML; `scripts/check_consistency.py`. Прототип: каталог `courses.html`, урок ML `ml-lesson.html` с виджетом «Порог классификатора», шапка с текущим курсом.
- **Проверка:** `python scripts/check_consistency.py` → ok; `cd code && pytest` → 27 passed (числа урока ML закреплены `test_threshold.py`); прототип без ошибок в консоли, без горизонтальной прокрутки на 390 px.
- **Следующий шаг:** S1.01.
- **Вопросы пользователю:** порядок разработки курсов ML после «Основ» (по умолчанию: табличные данные, глубокое обучение, практикум, затем LLM, без учителя, RL, классические методы); лицензии наборов California Housing и др. — проверяются в задачах этапов.

### 2026-10-14 — Галочка «знаю» и каталог интерактивов
- **Сделано:** прогресс — одна булева галочка «знаю» на урок (`LessonMark` в `src/lib/content/types.ts`): ставит и снимает ученик, курс ставит её после итоговой проверки и диагностики; статус «начат» убран; уроки ★ не входят в счётчики (59 обязательных). Прототип: чекбоксы в оглавлении, на главной, в «Опирается на», «Знаю эту тему» в уроке, синхронизация и счётчики. Каталог `docs/program/interactives.md`; практика для V.2, V.3, V.4, V.6; игра «Почини backprop».
- **Проверка:** согласованность плана → ok; `pytest` → 24 passed; `nbmake` → 1 passed; axe (4 страницы × 2 темы × 1440/390) → 0 нарушений; на 390 px нет горизонтальной прокрутки.
- **Отклонения от плана и решения:** по замечаниям ревью исправлены старые нарушения доступности прототипа (имена кнопок символов, подпись поля, заметки `role="note"`, фокус прокручиваемых формул).
- **Следующий шаг:** S1.01.
- **Вопросы пользователю:** добавить ли игры-кандидаты для I.7 и III.10 (`docs/program/interactives.md`, «Пробелы»).

### 2026-10-14 — План пересмотрен: без поиска и повторений, галочки пройденных уроков
- **Сделано:** решение заказчика: поиска по сайту, интервальных повторений и уровней усвоения нет; прогресс — по урокам, пройденный урок — зелёная галочка в оглавлении слева, на главной и в «Опирается на». Этап 1 перенумерован (14 задач: линтеры, раздельный деплой, PR этапа), этап 2 — 12 задач; S3.08 «Поиск» удалена; у каждого модуля — итоговая проверка. Учтены замечания «холодного старта»: команды grep в `continue-plan`, точные версии пакетов, Playwright 1.56.1, COEP.
- **Проверка:** согласованность плана (61 урок, 48 задач, зависимости, пакеты, ссылки) → ok; `cd code && pytest` → 24 passed; `pytest --nbmake` → 1 passed; прототип: без ошибок в консоли, без горизонтальной прокрутки на 390 px.
- **Следующий шаг:** S1.01.
- **Вопросы пользователю:** влить `docs/course-analysis` в `main` до начала этапа 1 (рекомендуется).

### 2026-10-14 — План создан
- **Сделано:** проектирование завершено: программа (61 урок), соглашения, дизайн-система и прототип, формулы как данные с численной проверкой, пример лабораторной, план реализации, пакеты контекста, скилл `continue-plan`.
- **Проверка:** `cd code && pytest` → 24 passed; `pytest --nbmake` → 1 passed; прототип без ошибок в консоли, без горизонтальной прокрутки на 390 px.
- **Следующий шаг:** S1.01.
- **Вопросы пользователю:** открытые вопросы — `docs/analysis.md` §9 (не блокируют этап 1).
