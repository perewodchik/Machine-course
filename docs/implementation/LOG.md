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

### 2026-10-15 — S3.06 Размерности в реальном времени — готова
- **Сделано:** Анализ форм в Python — по AST кода ячейки в её же пространстве имён, только верхний уровень (в функциях имена значат другое) и без вызовов функций (побочные эффекты). Найдено: ast.Name без номеров строк не компилировался — fix_missing_locations; ошибки разбора Compute Engine приходят в обёртке {fn: …}.
- **Файлы:** src/lib/symbolic/shape.ts, src/client/formula-input.ts, src/python/{shapes,worker,runtime,protocol,cell}.ts, src/components/python/PyCell.astro, tests/e2e/{formula,python}.spec.ts
- **Проверка:** vitest 309; e2e 248 (90 пропущено); lint, check, validate — чисто
- **Следующий шаг:** S3.L0 — уроки модуля 0 (дальше L-0.1).
- **Вопросы пользователю:** —

### 2026-10-15 — S3.05 Диагноз ошибок по мутациям — готова
- **Сделано:** Мутация с ошибкой формы (XᵀΘᵀ) не вычисляется — сравнивается запись без скобок; иначе — значение на случайных матрицах. Подстановка символов в TeX — токенизатором: AB — два символа, буквы \\top — нет. Неверный градиент из теста S3.04 теперь называется прямо («знак»).
- **Файлы:** content/formulas/rules/*.yaml, code/mlf/formulas.py, code/tests/test_formulas.py, src/lib/content/rule-instance.ts, src/lib/symbolic/{check,derivation,equivalent}.ts, src/components/pedagogy/Exercise.astro, src/client/exercise.ts
- **Проверка:** pytest 63; vitest 306; e2e formula и v1 — 20; lint, validate, check_consistency — чисто
- **Следующий шаг:** S3.06 — размерности в реальном времени.
- **Вопросы пользователю:** —

### 2026-10-15 — S3.04 Проверка вывода ученика по шагам — готова
- **Сделано:** Парсер не знает \\nabla — вид строки определяется по тексту до разбора; «= 0» с матрицей слева — ноль-число как нулевая матрица; вырожденная обратная — ошибка формы (попытка засчитывается). Харнесс повторяет виды проверок code/mlf/formulas.py (same, gradient, stationary, solution) на тех же размерах.
- **Файлы:** src/lib/symbolic/derivation.ts, derivation.test.ts, src/client/exercise.ts, src/components/pedagogy/Exercise.astro, linear-regression.mdx, tests/e2e/formula.spec.ts
- **Проверка:** vitest 300; e2e formula, v1, layout — 117; lint, check, validate — чисто
- **Следующий шаг:** S3.05 — диагноз ошибок по мутациям.
- **Вопросы пользователю:** —

### 2026-10-15 — S3.03 Ввод формул и проверка символьных ответов — готова
- **Сделано:** Из Compute Engine взят только модуль latex-syntax (парсер в MathJSON, 415 КБ): вычислительное ядро (3.4 МБ) не нужно — значения считает свой вычислитель с матрицами (сложение, произведение, транспонирование, обратная, след, определитель, норма, log/exp/σ, x^{(i)}). Особенности парсера: \det A \det B = det(A det B); x^{(i)\top} читается как (i)·True — обработано. MathLive и парсер — отдельные чанки; npm audit — старые уязвимости braces в инструментах линтинга, не от новых пакетов.
- **Файлы:** src/lib/symbolic/{evaluate,equivalent,parse,check}.ts, src/client/formula-input.ts, src/client/exercise.ts, src/components/pedagogy/Exercise.astro, tests/e2e/formula.spec.ts
- **Проверка:** vitest 288; e2e formula, v1, hosting, pilot, know — 68; lint, check, validate, check_consistency — чисто
- **Следующий шаг:** S3.04 — проверка вывода ученика по шагам.
- **Вопросы пользователю:** —

### 2026-10-15 — S3.02 Карта курса, понятия, справка по опоре — готова
- **Сделано:** requires/cs229 перенесены из карточек в module.yaml скриптом и сверяются с карточками (V.2: «модули 0–IV» — пояснение, опора — V.1). Карта рисует рёбра клиентом по положению узлов; ниже 1100 px — списки. Путь «зачем это мне» — BFS вперёд по requires всех курсов до урока с cs229. Справка по опоре — первая опора без «знаю». axe поймал приглушение прозрачностью — заменено цветом.
- **Файлы:** content/courses/*/*/module.yaml, src/components/layout/CourseMap.astro, src/client/map.ts, src/lib/progress/graph.ts, src/pages/{map,concepts/index,concepts/[id]}.astro, src/components/pedagogy/PrereqHelp.astro, tests/e2e/map.spec.ts
- **Проверка:** vitest 280; e2e 236 (90 пропущено); pytest 61; lint, check, validate, check_consistency — чисто
- **Следующий шаг:** S3.03 — ввод формул и проверка символьных ответов.
- **Вопросы пользователю:** —

### 2026-10-15 — S3.01 Входная диагностика и урок 0.2 — готова
- **Сделано:** Диагностика по банку content/diagnostic.yaml в уроке 0.2 (написан целиком: L-0.2). Пропуск задач — только по прямым requires неверной задачи, без цепочки: иначе одна ошибка в 0.4 обрывала бы диагностику. Генераторы модуля 0 — basics.* (будущие итоговые проверки уроков 0.3–0.9). exercise:result теперь несёт attempt и hints. Проценты в генераторах вероятности — с неразрывным пробелом.
- **Файлы:** content/diagnostic.yaml, content/courses/foundations/start/how-the-course-works.mdx, src/components/pedagogy/Diagnostic.astro, src/client/diagnostic.ts, src/lib/diagnostic/plan.ts, src/lib/exercises/generators/basics.ts, tests/e2e/diagnostic.spec.ts
- **Проверка:** vitest 276; e2e: diagnostic, layout, know, hosting, pilot, iii3 — 131; lint, check, validate, check_consistency — чисто
- **Следующий шаг:** S3.02 — карта курса и навигация по графу.
- **Вопросы пользователю:** —

### 2026-10-15 — S2.12 Итог этапа 2 — готова
- **Сделано:** Срез готов: уроки V.1, I.4, III.3 с выводами, виджетами, Python и итоговыми проверками; игры «Матрица-пазл» и «Байес-детектив»; лабораторная с Colab; режим пилота с опросом и отчётом; ревью S2.11 закрыто. Пользователю отправлены скриншоты, задан вопрос о pull request этапа 2.
- **Файлы:** docs/implementation/PLAN.md (S2.14)
- **Проверка:** все проверки S2.11 зелёные
- **Отклонения от плана и решения:** Пилот — ворота этапа 2 в обзоре плана; пользователь велел продолжать без остановок, поэтому пилот вынесен в отдельную задачу S2.14 [u], а этап 3 начат. Итоги пилота превратятся в задачи правок.
- **Следующий шаг:** S3.01 — диагностика (урок 0.2).
- **Вопросы пользователю:** Открыть pull request этапа 2 (docs/course-analysis → main)?

### 2026-10-15 — S2.11 Ревью среза: формулы, KaTeX в слое, переносы, виджеты — готова
- **Сделано:** Субагент снял 144 экрана и прогнал axe (0 нарушений). Критичное: формула полной вероятности обрезана, сырой LaTeX в карточке Байеса — исправлено; валидатор ловит математику вне $…$ в полях формул (29 мест исправлено). Найдено: katex.min.css был вне слоёв и перебивал все наши правила для формул (1.06em, отступы) — теперь слой katex. Важное: ввод матрицы, подписи GridMap, таблица V.1 (карточки на телефоне), переносы (src/markdown/core/nobr.ts), шапка, легенда символов, спойлер в III.3, матрицы в вариантах — исправлено.
- **Файлы:** src/markdown/core/{nobr,inline,plugins}.ts, src/styles/{global,math,layout,pedagogy,kit}.css, src/components/pedagogy/{Formula,Derivation,SymbolLegend}.astro, src/widgets/_kit/{Axis,Plane,Vector}.tsx, src/widgets/prob/bayes-grid/*, src/lib/content/validate.ts, content/formulas/**, bayes.mdx
- **Проверка:** vitest 267; e2e 202 (74 пропущено); pytest 61; nbmake 1; lint, check, validate, check_consistency — чисто
- **Отклонения от плана и решения:** «Матрица-пазл» на 390: рисунок и матрица помещаются в один экран после одной прокрутки к рисунку (637 px из 787) — не менял. Мелочи не исправлены: квадратные скобки в игре, курсивное det в виджетах, нативный бегунок детектива, «Q-» в конце строки каталога, ссылки-названия в каталоге.
- **Следующий шаг:** S2.12 — итог этапа 2.
- **Вопросы пользователю:** —

### 2026-10-15 — S3.07 S3.07 — проверка кода свойствами — готова
- **Сделано:** Сделана параллельно с ревью среза: зависит только от S2.09.
- **Файлы:** code/mlf/check.py, code/tests/test_check_properties.py, code/pyproject.toml, notebooks/src/la/normal_equations.py
- **Проверка:** pytest 61, сборка лабораторных + nbmake
- **Отклонения от плана и решения:** Нет.
- **Следующий шаг:** S2.11 — ревью среза (в работе: визуальное ревью идёт).
- **Вопросы пользователю:** —

### 2026-10-15 — S2.10 S2.10 — пилот: журнал, опрос, отчёт — готова
- **Сделано:** Инструменты пилота без сервера: всё в браузере участника, результаты — файлом, сводка — скриптом.
- **Файлы:** src/lib/pilot/report.ts, scripts/pilot-report.ts, src/client/survey.ts, src/components/pedagogy/{LessonSurvey,Pilot}.astro, src/client/derivation.ts, docs/pilot/README.md, tests/e2e/pilot.spec.ts
- **Проверка:** lint, astro check, vitest 262, validate, check_consistency, build, e2e 170 passed (axe чисто)
- **Отклонения от плана и решения:** Пилот запускает пользователь: набрать 6–10 участников и разослать ссылку с ?pilot=1 (docs/pilot/README.md).
- **Следующий шаг:** S2.11 — ревью среза.
- **Вопросы пользователю:** —

### 2026-10-15 — S2.09 S2.09 — лабораторные в CI и кнопки открытия — готова
- **Сделано:** Единый источник кода урока и лабораторной; публикация для Colab — из этого же репозитория.
- **Файлы:** code/mlf/snippets.py, code/tests/test_snippets.py, scripts/build_notebooks.py, notebooks/src/la/normal_equations.py, notebooks/la/normal_equations.ipynb, tests/e2e/lesson-v1.spec.ts
- **Проверка:** pytest 55, сборка лабораторных + nbmake, git diff notebooks/ после сборки — только ожидаемые правки, check_consistency, build, e2e V.1 и Python 20 passed
- **Отклонения от плана и решения:** Решение пользователя «публичный репозиторий или отдельный» не понадобилось: репозиторий уже публичный. Ссылка — на main, а не на тег релиза: тегов пока нет; переключить в S2.12 после первого релиза.
- **Следующий шаг:** S2.10 — пилот: журнал, опрос, отчёт.
- **Вопросы пользователю:** —

### 2026-10-15 — S2.13 S2.13 — игра «Байес-детектив» — готова
- **Сделано:** Вторая игра среза; GameShell обобщён: счёт — `view.stats`, действия в журнал — `view.actions`. На телефоне текущая улика повторяется над бегунком.
- **Файлы:** src/games/bayes-detective/*, src/pages/games/bayes-detective.astro, src/games/_engine/GameShell.tsx, src/styles/games.css, tests/e2e/bayes-detective.spec.ts
- **Проверка:** lint, astro check, vitest 257, validate, build, e2e 164 passed (axe чисто); скриншоты 1440/390 — правки по ревью внесены
- **Отклонения от плана и решения:** Нет.
- **Следующий шаг:** S2.09 — лабораторные в CI и кнопки открытия.
- **Вопросы пользователю:** —

### 2026-10-15 — S2.08 S2.08 — уроки I.4 и III.3 — готова
- **Сделано:** Два урока с виджетами, формулами в реестре и параметрическими задачами; итоговые проверки ставят «знаю». Попутно: типограф видит абзац целиком (кавычки вокруг формул), матрицы в условиях генераторов — smallmatrix в строке, sample: simplex для проверки вероятностных формул.
- **Файлы:** content/courses/foundations/{linear-algebra/matrix-as-map,probability/bayes}.mdx, src/widgets/{la/grid-map,prob/bayes-grid}/*, content/formulas/{rules/matvec-columns,rules/matmul-composition,prob/bayes}.yaml, src/lib/exercises/generators/{la,prob}.ts, code/snippets/prob/bayes.py, tests/e2e/lesson-{i4,iii3}.spec.ts
- **Проверка:** lint, astro check, vitest 249, pytest 48, validate, check_consistency, build, e2e 160 passed (axe чисто); content-review — правки внесены; скриншоты 1440/390 без горизонтальной прокрутки
- **Отклонения от плана и решения:** Игра «Байес-детектив» из карточки III.3 — не в этой задаче (в плане её нет), записать в план отдельно. Длинный \\text в условии формулы ломал ширину на телефоне — условия в карточке пишем короткой формулой, слова — в why.
- **Следующий шаг:** S2.09 — лабораторные в CI и кнопки открытия.
- **Вопросы пользователю:** —

### 2026-10-15 — S2.07 S2.07 — игра «Матрица-пазл» — готова
- **Сделано:** Игра по контракту с чистой моделью и оболочкой GameShell; уровень проходится только с клавиатуры, axe чисто. Попутно: `_kit/Polygon`, `GameEvent` в журнале, общий `Rng` в контракте игр; S1.14 отмечена — этап 1 слит в main (PR #1).
- **Файлы:** src/games/_engine/GameShell.tsx, src/games/matrix-puzzle/*, src/pages/games/matrix-puzzle.astro, src/styles/games.css, src/widgets/_kit/Polygon.tsx, tests/e2e/matrix-puzzle.spec.ts
- **Проверка:** lint, astro check, vitest 235 (11 игры, fast-check), validate, build, e2e 146 passed (axe чисто); design-critique и accessibility-review по скриншотам — правки внесены
- **Отклонения от плана и решения:** Паузы в GameShell нет: ни одна игра пока не использует время (tick). В прототипе уровень «сжатие в линию» был недостижим шагом 1 — здесь шаг 0.5. Строка уровня поднята над полем по итогам ревью (мобильный).
- **Следующий шаг:** S2.08 — уроки I.4 и III.3.
- **Вопросы пользователю:** —

### 2026-10-15 — S2.06 S2.06 — урок V.1 — готова
- **Сделано:** Первый урок в MDX: 4 цикла с проверками, 3 формулы из реестра с выводами, ячейка Python (θ закреплено тестом), итоговая проверка ставит «знаю». Маршрут урока: `lead` и заметка CS229 из frontmatter, тексты через `lessonText` (без 113 предупреждений), таблицы в прокручиваемой обёртке, маркеры списков.
- **Файлы:** content/courses/foundations/bridge/linear-regression.mdx, content/formulas/{la/residual-orthogonality,stat/linreg-likelihood}.yaml, content/concepts/{prob,stat}.yaml, src/pages/[course]/[module]/[lesson].astro, src/lib/content/cs229.ts, tests/e2e/lesson-v1.spec.ts
- **Проверка:** validate, pytest (35), vitest 224, lint, astro check, build, e2e 140 passed (axe чисто), check_consistency; content-review — правки внесены; скриншоты 1440/390 без горизонтальной прокрутки
- **Отклонения от плана и решения:** Игра «Подгони прямую» — этап 3 (S3), в уроке пока не упоминается. Исправлено попутно: текст урока попадал в слот intro (выражение со slot), слипались ссылки-обоснования в шагах вывода, матрицы в условиях генераторов — выключными формулами (версии 2). sample: positive для скаляров в проверке формул.
- **Следующий шаг:** S2.07 — игра «Матрица-пазл».
- **Вопросы пользователю:** —

### 2026-10-15 — S2.05 S2.05 — Python в уроке — готова
- **Сделано:** Воркер, очередь и «Стоп» (`src/python/`), компоненты `components/python/`, регионы сниппетов (`lib/content/snippets.ts`) с проверкой в валидаторе, подсветка «карандашом» при сборке, COOP/COEP в dev и preview, кэш Pyodide в CI.
- **Файлы:** scripts/fetch-pyodide.ts, src/python/*, src/components/python/*, src/lib/content/snippets.ts, src/markdown/core/python.ts, src/styles/python.css, tests/e2e/python.spec.ts
- **Проверка:** lint, astro check, vitest 218, validate, build, e2e 130 passed (axe чисто), pytest code/, сборка лабораторных, check_consistency; design-critique и accessibility-review по скриншотам — правки внесены
- **Отклонения от плана и решения:** jsDelivr закрыт в этой сети — numpy извлекается из архива релиза на GitHub (fallback в скрипте). Кнопка JupyterLite скрыта до своей сборки (этап 3, notebooks/README.md). Сверх плана: правка кода в ячейке (PRIMM «измени»). Компоненты ячейки — .astro + скрипт, не React (src/README.md обновлён).
- **Следующий шаг:** S2.06 — урок V.1.
- **Вопросы пользователю:** —

### 2026-10-15 — S2.04 S2.04 — галочка «знаю» — готова
- **Сделано:** Логика в `lib/progress/marks.ts`, стор в `lib/state/marks.ts`, клиент `client/know.ts`, компонент `ProgressFile`; итоговая проверка демо-урока ставит отметку сама.
- **Файлы:** src/lib/progress/marks.ts, src/lib/state/marks.ts, src/client/know.ts, src/components/layout/ProgressFile.astro, tests/e2e/know.spec.ts, eslint.config.js
- **Проверка:** lint, astro check, vitest 199, validate, build 127 страниц, e2e 122 passed (axe чисто)
- **Отклонения от плана и решения:** Правило слоёв: клиенту разрешён `import type` из сборочных модулей (`dependency.kind: value`), фикстура `ok-type-import-build.ts`. Сообщение «Урок отмечен» — через `queueMicrotask`, чтобы его не затирал отзыв упражнения.
- **Следующий шаг:** S2.05 — Python в уроке (Pyodide в Web Worker, PyCell, PyCode, OpenIn).
- **Вопросы пользователю:** —

### 2026-10-15 — S2.03 движок упражнений — готова
- **Сделано:** src/lib/math/rng.ts (mulberry32), src/lib/exercises/{types,parse,check}.ts, generators/{la,index}.ts (det2, matmul2, slope3, shapes), src/markdown/core/inline.ts (renderInline, inlineText), src/components/pedagogy/{Exercise,ExerciseSet}.astro, src/client/exercise.ts, src/lib/state/journal.ts, стили в pedagogy.css, раздел «Упражнения» на /lab. Тесты: exercises.test.ts (разбор «0,5», «−3/4», «1e-3»; проверки; детерминизм генераторов), inline.test.ts, tests/e2e/exercise.spec.ts (все типы с клавиатуры, журнал, итоговая проверка).
- **Файлы:** src/lib/math/rng.ts, src/lib/exercises/*, src/markdown/core/inline.ts, src/components/pedagogy/{Exercise,ExerciseSet}.astro, src/client/exercise.ts, src/lib/state/journal.ts, src/styles/pedagogy.css, src/pages/lab.astro, tests/e2e/exercise.spec.ts
- **Проверка:** vitest 192, lint, astro check 0, build, e2e 114 (axe /lab в обеих темах)
- **Отклонения от плана и решения:** KaTeX не уходит в браузер: «Ещё задача» переключает заранее собранные варианты (по умолчанию 8), а не генерирует новые на клиенте — набор вариантов конечен. Варианты и поля, подпись которых — одна формула, получают aria-label из текста MathML (axe не читает MathML). Расхождения «знаю» ↔ итоговая проверка модуля — после S2.04.
- **Где остановился:** —
- **Следующий шаг:** S2.04.
- **Вопросы пользователю:** —

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
