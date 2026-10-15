# Пакет: виджеты и игры

Для задач S2.01, S2.02, S2.07 и игр этапов 3–5.

## Главное

- **Виджет = чистая модель + тонкое представление** (`src/widgets/<раздел>/<имя>/`: `model.ts`, `model.test.ts`, `<Имя>.tsx`, `index.ts` с `meta`, `README.md`). Пропсы: `initial`, `lock`, `show`, `seed` — только сериализуемые.
- **`widgets/_kit`** (готов, S2.01; таблица элементов — `src/widgets/_kit/README.md`, стили — `src/styles/kit.css`) — свой SVG-слой на `d3-scale`: `Plane` (клетка совпадает с делениями осей), `Axis`, `Point`, `Line` и `Ellipse` с `clipPath` по области графика, `Vector`, `ParamSlider` (бегунок цвета роли), `Readout`, `Scrub` (живое число в тексте). `viewBox` пересчитывается по ширине (ResizeObserver).
- **Виджет в уроке:** обёртка `src/components/widgets/<Имя>.astro` (рисунок `figure.wide` с номером и подписью, остров `client:visible`) регистрируется в `lessonComponents` (`src/components/pedagogy/index.ts`): в MDX нет импортов, а директиву `client:*` можно поставить только в `.astro`. Образец — `FitLine`.
- **Данные виджета** — экспорт сниппета урока: `python scripts/export_widget_data.py` пишет `src/widgets/<раздел>/<имя>/data.json`; pytest сверяет экспорт с генератором (`test_widget_export_matches_generator`).
- **Подписи на рисунке** — шрифт формул (`--font-math`) с подложкой цвета фона; индексы 0.7em; подпись у видимого конца линии, если линия вне графика — скрыта.
- **Цвета** — роли урока (`--sym-1…3`), вспомогательное — карандаш `--ink-3` пунктиром.
- **Детерминизм и SSR:** состояние из `seed`, без `Math.random` и `Date`.
- **Доступность:** стрелки и числовые поля вместо перетаскивания (WCAG 2.5.7); описание состояния в `aria-live` с задержкой; видимый фокус.
- **Игра** — по контракту `src/games/_engine/types.ts` (`GameSpec`): чистый редьюсер `step`, `score` — метрика понятия, `describe` для скринридера, `generate(rng, difficulty)`; партия = seed + журнал действий. Оболочка `GameShell`: уровни, пауза, сброс, подсказки, справка по клавишам; без таймера. В журнал событий — `GameResult` (практика, на статус урока не влияет).
- **Тесты:** Vitest для моделей; fast-check — детерминизм и решаемость уровней; Playwright с `?seed=` — уровень проходится с клавиатуры, axe без ошибок.
- **Эталоны:** рисунок регрессии — `prototype/assets/proto.js` (`initRegression`); игра — `prototype/assets/game.js`.

## Готовые виджеты (S2.02, S2.08)

- `la/fit-line` (V.1), `la/grid-map` (I.4: деформация сетки, режим `compose` для порядка отображений), `prob/bayes-grid` (III.3: 1000 человек, две раскладки SVG с постоянным `viewBox` — выбор CSS по ширине, без сдвига вёрстки при гидратации). Обёртки — `src/components/widgets/*.astro`, регистрация — `lessonComponents`.
- e2e с островами `client:visible`: прокрутить к виджету и дождаться, пока у `astro-island` пропадёт `ssr` (`widget.locator("xpath=ancestor::astro-island[1]")`), иначе клик уйдёт в статичную разметку.

## Где в коде (игры, S2.07)

- Контракт — `src/games/_engine/types.ts` (`GameSpec`, `GameResult`; `Rng` — общий ГПСЧ `src/lib/math/rng.ts`). Оболочка — `src/games/_engine/GameShell.tsx`: игра передаёт `spec` и `view` (`board`, `controls`, `feedback`, `optimal`, `debrief`, `keys`). Уровень k строится из `rng(seed · 1000 + k)`, партия по ссылке — `?seed=&level=`. Строка уровня над полем (на телефоне матрица сразу под рисунком), описание для скринридера — `describe` с задержкой 400 мс, после решения фокус на «Следующий уровень», результат — `GameEvent` в журнале.
- Эталон игры — `src/games/matrix-puzzle/` (`model.ts`, `model.test.ts` с fast-check, `MatrixPuzzle.tsx`, `README.md`), страница `src/pages/games/matrix-puzzle.astro`, стили `src/styles/games.css`, e2e `tests/e2e/matrix-puzzle.spec.ts`.
- `_kit/Polygon` — фигура: `tone="aux"` (цель пунктиром) или `tone="pen"` (то, что строит ученик).

## Источники (только если нужно)

- `docs/program/interactives.md` — какие виджеты, игры и лабораторные у каждого урока; читать только раздел своего модуля.
- `.claude/skills/new-widget/SKILL.md`, `.claude/skills/new-game/SKILL.md`.
- `docs/conventions/games.md` — когда игра учит, список игр.
- `src/README.md` — правила зависимостей (виджеты не импортируют друг друга; игры берут только модели виджетов).

## Не делать

- Прямые зависимости виджета от Mafs или d3 вне `_kit`.
- Очки за скорость, таймеры, бейджи.
