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

### 2026-10-26 — L-III.10 L-III.10 — случайные векторы и линейные преобразования — готов
- **Сделано:** урок random-vectors (три цикла: среднее и Σ ⪰ 0, Cov(AX + b) = AΣAᵀ, плотность и |det A|), виджет «Линейное преобразование облака», формула f.covariance-linear, генераторы prob.cov-linear (матрица и aᵀΣa) и prob.density-linear, сниппет random_vectors.py с тестом; e2e: axe ждёт конца переходов (reducedMotion) — гонка на кнопке «Следующий уровень» в CI PR #27
- **Файлы:** content/courses/foundations/probability/random-vectors.mdx, src/widgets/prob/cloud-transform/, content/formulas/prob/covariance-linear.yaml, code/snippets/prob/random_vectors.py, tests/e2e/support.ts
- **Проверка:** validate, lint, build, check, vitest 573, pytest, check_consistency, e2e III.10 и раскладка iii10 (axe), игры min-max-saddle и dist-zoo ×3
- **Отклонения от плана и решения:** нет
- **Следующий шаг:** L-III.11 — многомерное нормальное распределение.
- **Вопросы пользователю:** —

### 2026-10-26 — L-III.9 L-III.9 — совместные распределения и ковариация — готов
- **Сделано:** урок joint-distributions (три цикла: совместное/маргинальное/условное, ковариация и корреляция, условное матожидание), виджет «Облако точек», игра «Угадай корреляцию» (/games/guess-correlation/), модель src/lib/math/correlation.ts, формула f.total-expectation, генераторы prob.joint-marginal и prob.covariance, сниппет covariance.py с тестом
- **Файлы:** content/courses/foundations/probability/joint-distributions.mdx, src/widgets/prob/scatter-cloud/, src/games/guess-correlation/, src/lib/math/correlation.ts, content/formulas/prob/total-expectation.yaml, code/snippets/prob/covariance.py
- **Проверка:** validate, lint, build, check, vitest 568, pytest, check_consistency, e2e III.9 и игры, раскладка iii9 и corrgame (axe)
- **Отклонения от плана и решения:** «перетаскивание» точки в виджете сделано бегунками x₀, y₀ выброса: доступно с клавиатуры, в наборе виджетов нет перетаскивания точек
- **Следующий шаг:** L-III.10 — случайные векторы и линейные преобразования.
- **Вопросы пользователю:** —

### 2026-10-26 — L-III.8 L-III.8 — предельные теоремы и метод Монте-Карло — готов
- **Сделано:** урок limit-theorems (четыре цикла: ЗБЧ, Монте-Карло, ЦПТ, оценка объединения и ★ Хёффдинг), виджеты «Бегущее среднее» и «Гистограмма суммы», лабораторная prob/clt_simulations, формула f.sample-mean-variance, генераторы prob.mc-error и prob.union-bound, сниппет limits.py с тестом
- **Файлы:** content/courses/foundations/probability/limit-theorems.mdx, src/widgets/prob/limit-theorems/, notebooks/src/prob/clt_simulations.py, content/formulas/prob/sample-mean-variance.yaml, code/snippets/prob/limits.py
- **Проверка:** validate, lint, build, check, vitest 558, pytest, nbmake, check_consistency, e2e III.8 и раскладка iii8 (axe)
- **Отклонения от плана и решения:** нет
- **Следующий шаг:** L-III.9 — совместные распределения и ковариация.
- **Вопросы пользователю:** —

### 2026-10-26 — L-III.7 L-III.7: непрерывные распределения — готов
- **Сделано:** урок continuous-distributions (четыре цикла: равномерное и показательное, нормальное и стандартизация, Лапласа и логистическое, бета и ★ Дирихле), виджет «Обозреватель непрерывных распределений», модель src/lib/math/continuous.ts (erf, lgamma), формула f.standardization, генераторы prob.normal-rule и prob.cont-moments, сниппет prob/continuous.py с тестом
- **Файлы:** content/courses/foundations/probability/continuous-distributions.mdx, src/widgets/prob/cont-explorer/, src/lib/math/continuous.ts, content/formulas/prob/standardization.yaml, code/snippets/prob/continuous.py
- **Проверка:** validate, lint, build, check, vitest 551, pytest, check_consistency, e2e урока и layout iii7 (axe)
- **Отклонения от плана и решения:** нет
- **Следующий шаг:** L-III.8 — предельные теоремы и метод Монте-Карло.
- **Вопросы пользователю:** —

### 2026-10-26 — L-III.6 L-III.6: дискретные распределения и игра «Зоопарк распределений» — готов
- **Сделано:** урок discrete-distributions (три цикла: Бернулли, биномиальное, геометрическое; Пуассон; категориальное и мультиномиальное), виджет «Обозреватель распределений», игра «Зоопарк распределений» (5 уровней), общая модель src/lib/math/distributions.ts, формула f.binomial-mean, генераторы prob.family-moments и prob.point-prob, сниппет prob/discrete.py с тестом
- **Файлы:** content/courses/foundations/probability/discrete-distributions.mdx, src/widgets/prob/dist-explorer/, src/games/dist-zoo/, src/lib/math/distributions.ts, content/formulas/prob/binomial-mean.yaml, code/snippets/prob/discrete.py
- **Проверка:** validate, lint, build, check, vitest, pytest, check_consistency, e2e урока, игры и layout iii6/zoogame (axe)
- **Отклонения от плана и решения:** нет
- **Следующий шаг:** L-III.7 — непрерывные распределения.
- **Вопросы пользователю:** —

### 2026-10-26 — L-III.5 L-III.5: матожидание, дисперсия, неравенство Йенсена — готов
- **Сделано:** урок expectation-variance (три цикла: центр масс и LOTUS, дисперсия и Var(aX + b), Йенсен и EM), виджет «Матожидание как центр масс» (fast-check: Var-тождество, Йенсен), формула f.variance-identity, генераторы prob.ev-var, prob.var-linear, prob.jensen, сниппет prob/moments.py с тестом, понятие prob.expectation
- **Файлы:** content/courses/foundations/probability/expectation-variance.mdx, src/widgets/prob/center-mass/, content/formulas/prob/variance-identity.yaml, src/lib/exercises/generators/prob.ts, code/snippets/prob/moments.py
- **Проверка:** validate, lint, build, check, vitest 529, pytest, check_consistency, e2e урока и layout iii5 (axe)
- **Отклонения от плана и решения:** выпуклость уже введена в II.5 — урок ссылается на неё, а не вводит заново
- **Следующий шаг:** L-III.6 — дискретные распределения.
- **Вопросы пользователю:** —

### 2026-10-26 — L-III.4 L-III.4: случайные величины — PMF, PDF, CDF — готов
- **Сделано:** урок random-variables (четыре цикла: PMF и индикатор, плотность и CDF, плотность g(X), i.i.d.), виджет «Плотность и CDF при перетаскивании порога», формула f.density-transform, генераторы prob.pmf-cdf, prob.interval-prob, prob.linear-density, сниппет prob/density.py с тестом, понятие prob.random-variable
- **Файлы:** content/courses/foundations/probability/random-variables.mdx, src/widgets/prob/density-cdf/, content/formulas/prob/density-transform.yaml, src/lib/exercises/generators/prob.ts, code/snippets/prob/density.py
- **Проверка:** validate, lint, build, check, vitest 525, pytest, check_consistency, e2e урока и layout iii4 (axe)
- **Отклонения от плана и решения:** нет
- **Следующий шаг:** L-III.5 — матожидание, дисперсия, неравенство Йенсена.
- **Вопросы пользователю:** —

### 2026-10-26 — L-III.3 L-III.3: проверка урока «Байес» по определению готовности — готов
- **Сделано:** урок bayes (S2.08) сверен с определением готовности: цели карточки (полная вероятность, Байес, базовая частота, последовательное обновление) проверяются заданиями, формулы в реестре, термины в глоссарии, PyCode и игра «Байес-детектив»; время урока приведено к карточке (120 минут)
- **Файлы:** content/courses/foundations/probability/bayes.mdx
- **Проверка:** validate, e2e lesson-iii3
- **Отклонения от плана и решения:** нет
- **Следующий шаг:** L-III.4 — случайные величины: PMF, PDF, CDF.
- **Вопросы пользователю:** —

### 2026-10-26 — L-III.2 L-III.2: условная вероятность и независимость — готов
- **Сделано:** урок conditional-independence (три цикла: условие сужает мир, формула умножения, независимость и условная независимость), режим «A | B» и проверка независимости в виджете «События как области», формула f.chain-rule-probability, генераторы prob.cond-dice и prob.independence-check, сниппет prob/conditional.py (две монеты) с тестом
- **Файлы:** content/courses/foundations/probability/conditional-independence.mdx, src/widgets/prob/events/, content/formulas/prob/chain-rule-probability.yaml, src/lib/exercises/generators/prob.ts, code/snippets/prob/conditional.py
- **Проверка:** validate, lint, build, check, vitest 516, pytest, check_consistency, e2e урока и layout iii2 (axe)
- **Отклонения от плана и решения:** виджет III.1 расширен, а не новый: практика карточки «условие сужает мир» — режим A | B на той же сетке
- **Следующий шаг:** L-III.3 — проверить урок «Байес» по определению готовности.
- **Вопросы пользователю:** —

### 2026-10-26 — L-III.1 L-III.1: вероятностное пространство — готов
- **Сделано:** урок probability-space (три цикла: исходы и события, аксиомы и включения-исключения, ★ подсчёт и число мономов), виджет «События как области», формула f.inclusion-exclusion, генераторы prob.dice-event и prob.monomials, сниппет prob/events.py с тестом
- **Файлы:** content/courses/foundations/probability/probability-space.mdx, src/widgets/prob/events/, content/formulas/prob/inclusion-exclusion.yaml, src/lib/exercises/generators/prob.ts, code/snippets/prob/events.py
- **Проверка:** validate, lint, build, vitest, pytest, e2e урока и layout iii1 (axe)
- **Отклонения от плана и решения:** нет
- **Следующий шаг:** L-III.2 — условная вероятность и независимость.
- **Вопросы пользователю:** —

### 2026-10-25 — S4.L2 уроки модуля II и итоговая проверка — готова
- **Сделано:** итоговая проверка модуля II: ExerciseSet из девяти задач (II.1–II.8, II.10) в конце урока II.10, e2e проверяет 9 из 9
- **Файлы:** content/courses/foundations/calculus/multiple-integrals.mdx, tests/e2e/lesson-calc.spec.ts
- **Проверка:** validate, build, e2e модуля II
- **Следующий шаг:** S4.L3.
- **Вопросы пользователю:** —

### 2026-10-25 — L-II.10 L-II.10: кратные интегралы и замена переменных — готов
- **Сделано:** урок multiple-integrals (три цикла: Фубини, замена переменных и полярные координаты, гауссов интеграл), виджет «Как растягивается площадь», формула f.gaussian-integral (шаги проверены квадратурой), генераторы calc.double-integral, calc.area-scale, calc.polar-integral, сниппет integrals.py с тестом
- **Файлы:** content/courses/foundations/calculus/multiple-integrals.mdx, src/widgets/calc/area-stretch/, content/formulas/calc/gaussian-integral.yaml, src/lib/exercises/generators/calc.ts, code/snippets/calculus/integrals.py
- **Проверка:** validate, lint, build, check, vitest, pytest, check_consistency, e2e урока и layout ii10 (axe)
- **Отклонения от плана и решения:** нет
- **Следующий шаг:** итоговая проверка модуля II.
- **Вопросы пользователю:** —

### 2026-10-25 — L-II.9 L-II.9 ★: двойственность и условия KKT — готов
- **Сделано:** урок duality-kkt (два цикла: KKT и дополняющая нежёсткость, двойственная задача и SVM), виджет «Активное и неактивное ограничение», формула f.dual-projection, генератор calc.kkt-alpha, понятие calc.kkt (core: false)
- **Файлы:** content/courses/foundations/calculus/duality-kkt.mdx, src/widgets/calc/kkt/, content/formulas/calc/dual-projection.yaml, src/lib/exercises/generators/calc.ts
- **Проверка:** validate, lint, build, check, vitest 502, pytest, check_consistency, e2e урока и layout ii9 (axe)
- **Отклонения от плана и решения:** урок-углубление без ячейки Python: численная проверка двойственности — в model.test.ts виджета (fast-check)
- **Следующий шаг:** L-II.10 — кратные интегралы.
- **Вопросы пользователю:** —

### 2026-10-25 — L-II.8 L-II.8: множители Лагранжа; починка «Подгони прямую» — готов
- **Сделано:** урок lagrange (три цикла: касание и лагранжиан, PCA — собственный вектор и λ, MLE категориального распределения), виджет «Касание линии уровня и ограничения», формула f.categorical-mle, генераторы calc.lagrange-line, calc.lagrange-eig, calc.categorical-mle, сниппет lagrange.py с тестом; в «Подгони прямую» уровень «выброс» иногда имел оптимум за бегунком — генератор перетягивает выборку
- **Файлы:** content/courses/foundations/calculus/lagrange.mdx, src/widgets/calc/lagrange/, content/formulas/calc/categorical-mle.yaml, src/lib/exercises/generators/calc.ts, code/snippets/calculus/lagrange.py, src/games/fit-line/model.ts
- **Проверка:** validate, lint, build, check, vitest 497, pytest, check_consistency, e2e урока и layout ii8 (axe), e2e «Подгони прямую»
- **Отклонения от плана и решения:** найдена и исправлена ошибка в игре S2.07: property-тест падал на 8 seed из 10 000
- **Следующий шаг:** L-II.9 — двойственность и KKT (★).
- **Вопросы пользователю:** —

### 2026-10-25 — L-II.7 L-II.7: метод Ньютона — готов
- **Сделано:** урок newton (три цикла: касательная к f′, многомерный шаг и XᵀDX, сравнение с GD и контроль шага), виджет «Касательные Ньютона», формула f.newton-step, генераторы calc.newton-1d и calc.newton-logistic, сниппет newton.py с тестом (6 шагов Ньютона против 403 шагов спуска)
- **Файлы:** content/courses/foundations/calculus/newton.mdx, src/widgets/calc/newton/, content/formulas/calc/newton-step.yaml, src/lib/exercises/generators/calc.ts, code/snippets/calculus/newton.py
- **Проверка:** validate, lint, build, check, vitest 491, pytest, check_consistency, e2e урока и layout ii7 (axe)
- **Отклонения от плана и решения:** нет
- **Следующий шаг:** L-II.8 — множители Лагранжа.
- **Вопросы пользователю:** —

### 2026-10-25 — L-II.6 L-II.6: градиентный спуск и SGD, игры и лабораторная — готов
- **Сделано:** урок gradient-descent (четыре цикла: спуск и подъём, порог 2/λ_max и обусловленность, SGD и мини-батч, покоординатный спуск), игры «Порог расходимости» и «Спуск в тумане», лабораторная calc/apartments_gd (капстоун модуля II), формула f.gd-quadratic, генераторы calc.gd-step и calc.lr-threshold, сниппет gd.py с тестами
- **Файлы:** content/courses/foundations/calculus/gradient-descent.mdx, src/games/divergence/, src/games/foggy-descent/, notebooks/src/calc/apartments_gd.py, content/formulas/calc/gd-quadratic.yaml, code/snippets/calculus/gd.py
- **Проверка:** validate, lint, build, check, vitest 481, pytest, nbmake 4 ноутбука, check_consistency, e2e урока, обеих игр и layout (axe)
- **Отклонения от плана и решения:** в «Спуске в тумане» добавлен короткий шаг 0.2: с одним шагом 0.5 спуск по стрелке на вытянутой чаше зацикливался
- **Следующий шаг:** L-II.7 — метод Ньютона.
- **Вопросы пользователю:** —

### 2026-10-25 — L-II.5 L-II.5: выпуклость — готов
- **Сделано:** урок convexity (четыре цикла: хорда, критерии, локальный минимум глобален с планом доказательства, операции и логистическая потеря), виджет «Хорда над графиком», формула f.logistic-loss-hessian, вид проверки hessian в харнессе (с тестом на сломанный гессиан), генераторы calc.convex-form и calc.convex-ops, сниппет convexity.py с тестом
- **Файлы:** content/courses/foundations/calculus/convexity.mdx, src/widgets/calc/chord/, content/formulas/calc/logistic-loss-hessian.yaml, code/mlf/formulas.py, src/lib/exercises/generators/calc.ts, code/snippets/calculus/convexity.py
- **Проверка:** validate, lint, build, check, vitest 471, pytest, check_consistency, e2e урока и layout ii5 (axe)
- **Отклонения от плана и решения:** в харнесс добавлен вид шага hessian (якобиан градиента), схема и типы обновлены
- **Следующий шаг:** L-II.6 — градиентный спуск.
- **Вопросы пользователю:** —

### 2026-10-25 — L-II.4 L-II.4: гессиан, ряд Тейлора, критические точки — готов
- **Сделано:** урок hessian-taylor (три цикла, предсказание, ошибка «∇f = 0 — минимум»), формула f.taylor-second-order, игра «Минимум, максимум или седло» (5 уровней), генераторы calc.hessian и calc.classify, сниппет hessian.py с тестом, понятие calc.hessian
- **Файлы:** content/courses/foundations/calculus/hessian-taylor.mdx, content/formulas/calc/taylor-second-order.yaml, src/games/min-max-saddle/, src/lib/exercises/generators/calc.ts, code/snippets/calculus/hessian.py
- **Проверка:** validate, lint, build, check, vitest 455, pytest, check_consistency, e2e урока, игры и layout ii4/saddlegame (axe)
- **Отклонения от плана и решения:** нет
- **Следующий шаг:** L-II.5 — выпуклость.
- **Вопросы пользователю:** —

### 2026-10-25 — L-II.3 Матричное дифференцирование — готов
- **Сделано:** Урок II.3: четыре цикла (градиент по вектору — ∇bᵀx, ∇xᵀAx = (A + Aᵀ)x; проверка размерностями и конечными разностями, ссылка на «Тетрис размерностей», ячейка Python; градиент по матрице — ∇tr(AB) = Bᵀ, ∇log|det A| = A⁻ᵀ, GDA; нормальные уравнения через градиент — формула f.normal-equations, вывод по шагам, «найди ошибку»). Правило rule.grad-trace; генератор calc.matrix-grad; ячейка calculus/matrix_grad.py закреплена тестом.
- **Файлы:** content/courses/foundations/calculus/matrix-calculus.mdx, content/formulas/rules/grad-trace.yaml, src/lib/exercises/generators/calc.ts, code/snippets/calculus/matrix_grad.py
- **Проверка:** vitest, pytest, validate, lint, check, check_consistency — чисто; e2e урока и layout ii3 — 14 passed; формулы на 390 px — чисто
- **Отклонения от плана и решения:** Игра «Тетрис размерностей» уже есть (I.3) — в II.3 на неё ссылка, отдельного режима не делал.
- **Следующий шаг:** L-II.4 — гессиан, ряд Тейлора, критические точки.
- **Вопросы пользователю:** —

### 2026-10-25 — L-II.2 Многомерное правило цепочки и якобиан — готов
- **Сделано:** Урок II.2: три цикла (якобиан и дифференциал; правило цепочки J_{g∘f} = J_g J_f и формула f.chain-rule-jacobian ∇(g∘f) = J_fᵀ∇g; вычислительный граф, прямой и обратный проход, обратное распространение ошибки). Виджет «Вычислительный граф» (calc/comp-graph) для L = (θᵀx − y)²; генераторы calc.jacobian, calc.jacobian-order, calc.backprop с численной сверкой; ячейка calculus/chain.py закреплена тестом; термины глоссария.
- **Файлы:** content/courses/foundations/calculus/chain-rule-jacobian.mdx, src/widgets/calc/comp-graph/*, content/formulas/calc/chain-rule-jacobian.yaml, src/lib/exercises/generators/calc.ts, code/snippets/calculus/chain.py
- **Проверка:** vitest, pytest, validate, lint, check, check_consistency — чисто; e2e уроков II.1–II.2 и layout — 16 passed; формулы на 390 px — чисто
- **Следующий шаг:** L-II.3 — матричное дифференцирование.
- **Вопросы пользователю:** —

### 2026-10-25 — L-II.1 Частные производные и градиент — готов
- **Сделано:** Урок II.1: четыре цикла (частные производные; градиент-столбец, линейное приближение, градиент потерь МНК и правило LMS, ячейка на «Квартирах»; производная по направлению — формула f.directional-derivative, Коши — Буняковский, перпендикулярность линиям уровня; критические точки, седло, нормальные уравнения). Виджет «Поле градиентов над линиями уровня» (calc/gradient-field); математика коник вынесена в lib/math/conics.ts. Генераторы calc.partial, calc.gradient-point, calc.directional, calc.critical-point с численной сверкой; ячейка calculus/gradient.py закреплена тестом; термины глоссария.
- **Файлы:** content/courses/foundations/calculus/gradient.mdx, src/widgets/calc/gradient-field/*, src/lib/math/conics.ts, src/lib/exercises/generators/calc.ts, content/formulas/calc/directional-derivative.yaml, code/snippets/calculus/gradient.py, tests/e2e/lesson-calc.spec.ts
- **Проверка:** vitest, pytest, validate, lint, check, check_consistency — чисто; e2e урока и layout ii1 — 8 passed; формулы на 390 px — чисто
- **Следующий шаг:** L-II.2 — многомерное правило цепочки и якобиан.
- **Вопросы пользователю:** —

### 2026-10-25 — S4.01 Отчёт о калибровке уверенности — готова
- **Сделано:** Логика src/lib/progress/calibration.ts (первые попытки с отметкой, повтор задачи один раз; уровни «угадываю / скорее да / уверен» с ожидаемыми 40 / 70 / 95 %; уроки, где «уверен» верен реже 70 % при двух и более ответах) с тестами; страница /progress/ (src/pages/progress.astro, src/client/calibration.ts): таблица, SVG-график, вывод, список уроков; отметка уверенности по умолчанию у final-упражнений и в ExerciseSet; id final-check у итоговой проверки; ссылка из ProgressFile.
- **Файлы:** src/lib/progress/calibration.ts, src/client/calibration.ts, src/pages/progress.astro, src/components/pedagogy/Exercise.astro, src/components/pedagogy/ExerciseSet.astro, src/components/layout/ProgressFile.astro, src/styles/layout.css, tests/e2e/progress.spec.ts
- **Проверка:** vitest 438; e2e progress и layout progress — 10 passed; полный e2e — 518 passed (2 падения — устаревшее ожидание текста в новом тесте, исправлено); lint, check — чисто
- **Отклонения от плана и решения:** Отдельной страницы прогресса не было — создана /progress/. Уровни уверенности качественные, поэтому ожидаемые доли (40 / 70 / 95 %) заданы в LEVELS и показаны в таблице.
- **Следующий шаг:** S4.L2.
- **Вопросы пользователю:** —

### 2026-10-16 — L-I.12 Капстоун: МНК как проекция; итоговая проверка модуля I — готов
- **Сделано:** Капстоун I.12 на «Квартирах» из урока 0.1: четыре цикла (пространство столбцов и нормальные уравнения, θ̂ = (0.852, 0.129) и цена 75 м²; геометрия остатка — центр масс, P² = P, tr P = d, Пифагор; зависимые признаки — площадь в футах, ранг 2, решение наименьшей нормы; чего не хватает — градиент, гребневая регрессия, обусловленность). Лабораторная «МНК как проекция» (notebooks/src/la/least_squares_projection.py, шесть заданий). Генератор la.normal-eq; ячейки la/least_squares.py закреплены тестом, копия генератора «Квартир» сверена с mlf.datasets. Итоговая проверка модуля I — ExerciseSet из двенадцати задач по урокам I.1–I.12. Модуль I и этап 3 закончены.
- **Файлы:** content/courses/foundations/linear-algebra/capstone-least-squares.mdx, notebooks/src/la/least_squares_projection.py, notebooks/la/least_squares_projection.ipynb, code/snippets/la/least_squares.py, code/tests/test_least_squares.py, src/lib/exercises/generators/la.ts
- **Проверка:** vitest 434; pytest; лабораторные nbmake — 3 passed; e2e капстоуна и layout i12 — 8 passed (все 12 задач модуля решаются, axe чисто); lint, check, validate, check_consistency — чисто; формулы на 390 px — чисто
- **Отклонения от плана и решения:** Капстоун без нового виджета: картинка урока — ячейки Python и лабораторная, как в карточке. Проверка Cloudflare «Workers Builds» красная на PR с #17 и падает мгновенно, не начав сборку; репозиторий не менялся, логи — только в панели Cloudflare (S1.13 [u]); комментарий в PR #20.
- **Следующий шаг:** S4.01 — отчёт о калибровке уверенности.
- **Вопросы пользователю:** Проверка «Workers Builds: machine-course» в Cloudflare падает на каждом коммите, не начав сборку. Посмотрите, пожалуйста, причину в панели Cloudflare: Workers → machine-course → Builds.

### 2026-10-16 — L-I.11 Сингулярное разложение и псевдообратная — готов
- **Сделано:** Урок I.11: четыре цикла (геометрия A = USVᵀ — окружность в эллипс, Avᵢ = σᵢuᵢ, отражения в U и V; σᵢ через AᵀA, формула f.svd-gram, ранг; малоранговое приближение, теорема Эккарта — Янга, главные компоненты; псевдообратная и решение наименьшей нормы, переобученная регрессия). Виджеты «Окружность → эллипс по шагам» (svd-steps) и «Сжать картинку SVD» (low-rank, Якоби в браузере). Понятия la.svd, la.pseudoinverse; правила rule.pinv-svd, rule.eckart-young; генераторы la.singular-values, la.min-norm, la.lowrank-error; ячейка la/svd.py закреплена тестом; термины глоссария.
- **Файлы:** content/courses/foundations/linear-algebra/svd-pseudoinverse.mdx, src/widgets/la/{svd-steps,low-rank}/*, content/formulas/la/svd-gram.yaml, content/formulas/rules/{pinv-svd,eckart-young}.yaml, content/concepts/la.yaml, src/lib/exercises/generators/la.ts, code/snippets/la/svd.py
- **Проверка:** vitest 432; pytest; e2e уроков модуля I и layout — 260 passed, после перевода картинок на canvas тесты I.11 — 8 passed; lint (код выхода), check, validate, check_consistency — чисто; формулы на 390 px — чисто
- **Отклонения от плана и решения:** SVD 2 × 2 в виджете: σ₂ = |det A| / σ₁, а u₂ — поворот u₁ со знаком det A, без деления на малое σ₂ (fast-check нашёл почти вырожденную матрицу, у которой u₂ = Av₂/σ₂ выходил неединичным; добавлен регрессионный тест). Картинки — canvas в цветах токенов --ink и --paper: 4 600 прямоугольников SVG не давали axe уложиться в 30 с; таймаут axe-тестов раскладки поднят до 60 с — длинные уроки модуля I идут 20–30 с. Исправлена модель линий уровня I.10: меньшее по модулю λ считается через определитель — CI на main после PR #19 упал на контрпримере fast-check с λ ≈ 10⁻⁹ (регрессионный тест добавлен).
- **Следующий шаг:** L-I.12 — капстоун: МНК как проекция.
- **Вопросы пользователю:** —

### 2026-10-16 — L-I.10 Квадратичные формы и знакоопределённость — готов
- **Сделано:** Урок I.10: пять циклов (квадратичная форма и запись через элементы; знакоопределённость, формула f.quadratic-eigen и критерий по собственным значениям, ловушка с несимметричной матрицей; линии уровня — эллипсы, полосы, гиперболы, гауссиана; отношение Рэлея и главные компоненты; матрица Грама, корень из матрицы, ★ Холецкий). Виджет «Линии уровня xᵀAx» (src/widgets/la/level-sets, кривые в собственных осях проверены fast-check) и элемент набора Polyline. Правила rule.gram-psd, rule.sqrt-psd; генераторы la.psd-check, la.rayleigh; ячейка la/quadratic.py закреплена тестом; термины глоссария.
- **Файлы:** content/courses/foundations/linear-algebra/quadratic-forms.mdx, src/widgets/la/level-sets/*, src/widgets/_kit/Polyline.tsx, content/formulas/la/quadratic-eigen.yaml, content/formulas/rules/{gram-psd,sqrt-psd}.yaml, src/lib/exercises/generators/la.ts, code/snippets/la/quadratic.py
- **Проверка:** vitest 419; pytest; e2e уроков модуля I и layout — 255 passed; lint (код выхода), check, validate, check_consistency — чисто; формулы на 390 px — чисто
- **Отклонения от плана и решения:** Цвета виджета: линии уровня — цвет данных (это множества точек x), отрицательные уровни отличаются пунктиром, собственные оси — карандашом. Тесту «все тексты задач разбираются KaTeX» поднят таймаут до 30 с: под нагрузкой e2e он перестал укладываться в 5 с.
- **Следующий шаг:** L-I.11 — сингулярное разложение и псевдообратная.
- **Вопросы пользователю:** —

### 2026-10-16 — L-I.9 Собственные значения и векторы — готов
- **Сделано:** Урок I.9: четыре цикла (собственные векторы — Av = λv, λ < 0 и λ = 0, с точностью до множителя; характеристическое уравнение, след и определитель, поворот без вещественных λ; диагонализация A = VΛV⁻¹ и степени, недиагонализуемый сдвиг; спектральная теорема A = QΛQᵀ и главные компоненты). Игра «Охота на собственные векторы» (/games/eigen-hunt, шесть уровней от диагональной матрицы до поворота: поймать Av ∥ v и выбрать λ). Правила rule.char-poly-2x2, rule.diagonal-power, rule.spectral; генераторы la.eigvals2, la.eigvec-check, la.eigen-power; ячейка la/eigen.py закреплена тестом.
- **Файлы:** content/courses/foundations/linear-algebra/eigen.mdx, src/games/eigen-hunt/*, src/pages/games/eigen-hunt.astro, content/formulas/rules/{char-poly-2x2,diagonal-power,spectral}.yaml, src/lib/exercises/generators/la.ts, code/snippets/la/eigen.py
- **Проверка:** vitest 411; pytest; e2e уроков модуля I, layout и игры — 251 passed; lint (код выхода), check, validate, check_consistency — чисто; формулы на 390 px — чисто
- **Отклонения от плана и решения:** Поимка засчитывается по направлению (v в пределах 1.5° от собственного), а не по углу между v и Av: при целых градусах угол между прямыми у вытянутых матриц не падает ниже 2°. Поле игры подстраивается под норму A, чтобы образ единичной окружности помещался.
- **Следующий шаг:** L-I.10 — квадратичные формы и знакоопределённость.
- **Вопросы пользователю:** —

### 2026-10-16 — L-I.8 Ортогональность и проекции — готов
- **Сделано:** Урок I.8: четыре цикла (ортонормированный базис и ортогональные матрицы; проекция на пространство столбцов — формула f.residual-orthogonality из V.1, матрица P = X(XᵀX)⁻¹Xᵀ, МНК как проекция; расстояние до гиперплоскости и отступ SVM; ★ Грам — Шмидт и QR). Виджет «Проекция y на плоскость столбцов» (src/widgets/la/plane-projection): трёхмерная сцена ортографической камерой на Plane bare. Формула f.hyperplane-distance с выводом, правило rule.projection-idempotent; генераторы la.orthogonal-matrix, la.hyperplane-distance, la.project-orthogonal; ячейка la/projections.py закреплена тестом (ŷ совпадает с рисунком). Кит: опция Plane bare.
- **Файлы:** content/courses/foundations/linear-algebra/orthogonality-projections.mdx, src/widgets/la/plane-projection/*, src/widgets/_kit/Plane.tsx, content/formulas/la/hyperplane-distance.yaml, content/formulas/rules/projection-idempotent.yaml, src/lib/exercises/generators/la.ts, code/snippets/la/projections.py
- **Проверка:** vitest 402; pytest; e2e полный — 456 passed, 170 skipped; lint (код выхода), check, validate, check_consistency — чисто; формулы на 390 px — чисто
- **Отклонения от плана и решения:** Трёхмерный виджет сделан без 3D-библиотеки: ортографическая проекция в китовом SVG, камера — бегунок φ. Между уроками исправлен баг игры «Переводчик сумм» (PR #16): числа уровня изредка уравнивали неверную цепочку с ответом — CI на main ловил это случайным seed fast-check.
- **Следующий шаг:** L-I.9 — собственные значения и векторы.
- **Вопросы пользователю:** —

### 2026-10-16 — L-I.7 Обратная матрица и определитель — готов
- **Сделано:** Урок I.7: три цикла (обратная матрица — определение, связь с рангом и системами, формула 2 × 2, (AB)⁻¹ = B⁻¹A⁻¹; определитель как площадь со знаком — рисунок «деформация сетки» из I.4, ориентация, det = 0; свойства и ML — det(AB), det(A⁻¹), det(cA), плотность гауссианы и ICA, solve вместо inv). Понятие la.determinant; правила rule.inverse-product, rule.det-product, rule.inverse-2x2; генераторы la.inverse2 (det = ±1, целый ответ), la.det-area, la.det-rules; ячейка la/inverse.py закреплена тестом. Радиокнопки «деформации сетки» на сенсорных экранах — 24 px (axe target-size после гидратации); тесты уроков модуля I получили лимит 90 с.
- **Файлы:** content/courses/foundations/linear-algebra/inverse-determinant.mdx, content/formulas/rules/{inverse-product,det-product,inverse-2x2}.yaml, content/concepts/la.yaml, src/lib/exercises/generators/la.ts, code/snippets/la/inverse.py, src/styles/kit.css
- **Проверка:** vitest 395; pytest; e2e полный — 446 passed, 166 skipped; lint (код выхода), check, validate, check_consistency — чисто; формулы на 390 px — чисто
- **Отклонения от плана и решения:** Новый виджет не нужен: «деформация сетки» уже показывает параллелограмм и det A со знаком, композиция — det(AB). Предсказание знака по картинке — предсказание с рисунком 1 и вопросы о площади образа.
- **Следующий шаг:** L-I.8 — ортогональность и проекции.
- **Вопросы пользователю:** —

### 2026-10-16 — L-I.6 Системы уравнений и ранг — готов
- **Сделано:** Урок I.6: три цикла (сколько решений — прямые на плоскости и ранги A, [A | b]; пространство столбцов и ранг, игра «Попади в точку» на уровнях 4–5; ядро, все решения — частное плюс ядро, теорема о ранге и дефекте, зависимые признаки в регрессии). Виджет «Ax = b: нет решений, одно, бесконечно много» (src/widgets/la/system-lines). Понятие la.null-space, правило rule.solution-structure, генераторы la.solutions-count, la.kernel-vector, la.rank-nullity (тесты сверяют их с рангом по Гауссу); ячейка la/systems.py закреплена тестом. Кит: rank прямым шрифтом в подписях.
- **Файлы:** content/courses/foundations/linear-algebra/systems-rank.mdx, src/widgets/la/system-lines/*, content/formulas/rules/solution-structure.yaml, src/lib/exercises/generators/la.ts, code/snippets/la/systems.py
- **Проверка:** vitest 391; pytest; e2e уроков модуля I, layout и «Попади в точку» — 221 passed; lint (по коду выхода), check, validate, check_consistency — чисто; формулы на 390 px — чисто
- **Отклонения от плана и решения:** В I.5 в main ушла ошибка линтера prefer-const (вывод линтера обрезался до последней строки) — исправлена отдельным PR #13; теперь линтер проверяется по коду выхода. Игра «Попади в точку» используется как есть: уровни 4–5 и есть «недостижимая цель».
- **Следующий шаг:** L-I.7 — обратная матрица и определитель.
- **Вопросы пользователю:** —

### 2026-10-16 — L-I.5 Транспонирование, симметрия, след — готов
- **Сделано:** Урок I.5: три цикла (транспонирование и (AB)ᵀ = BᵀAᵀ, число равно своему транспонированию; симметричные матрицы, разложение на симметричную и кососимметричную части; след, tr(AB) = tr(BA), циклические перестановки, xᵀAx = tr(Axxᵀ)). Понятие la.trace; правила rule.trace-cyclic и rule.trace-quadratic; формула f.quadratic-symmetric-part с выводом; генераторы la.transpose-chain, la.sym-part, la.trace-swap; тренажёр — упражнение-формула (Xθ − y)ᵀ с формой под полем; «найди ошибку» — выбор строки вывода; ячейка la/trace.py закреплена тестом. Длинные выключные формулы в уроках модулей 0 и I разбиты на строки: на 390 px ни одна не выходит за колонку.
- **Файлы:** content/courses/foundations/linear-algebra/transpose-trace.mdx, content/formulas/la/quadratic-symmetric-part.yaml, content/formulas/rules/{trace-cyclic,trace-quadratic}.yaml, content/concepts/la.yaml, src/lib/exercises/generators/la.ts, code/snippets/la/trace.py, уроки 0.1, 0.5, 0.6, 0.7, I.1–I.3 (формулы)
- **Проверка:** vitest 389; pytest; e2e полный — 426 passed, 158 skipped; после последней правки — урок I.5 и layout; lint, check, validate, check_consistency — чисто; скрипт переполнения формул на 390 px — чисто по всем урокам
- **Отклонения от плана и решения:** Игры у I.5 нет (так в каталоге интерактивов). След MathLive сам не набирает, поэтому след проверяется выбором и числом, а упражнение-формула — на транспонирование. Итоговая проверка — la.sym-part.
- **Следующий шаг:** L-I.6 — системы уравнений и ранг.
- **Вопросы пользователю:** —

### 2026-10-16 — L-I.4 Матрица как линейное отображение — проверка по определению готовности — готов
- **Сделано:** Урок I.4 (сделан в S2.08) сверен с определением готовности. Добавлены единичная и диагональная матрицы из карточки (с английскими терминами и глоссарием), раздел CS229 «Deep learning» — два линейных слоя без нелинейности дают один; время урока 90 минут вместо 40.
- **Файлы:** content/courses/foundations/linear-algebra/matrix-as-map.mdx, content/glossary.yaml
- **Проверка:** validate, build; e2e lesson-i4 — 8 passed
- **Отклонения от плана и решения:** Остальные пункты определения готовности выполнены ещё в S2.08: три цикла с проверками, la.from-images и la.compose-order, правила rule.matvec-columns и rule.matmul-composition, итоговая проверка.
- **Следующий шаг:** L-I.5 — транспонирование, симметрия, след.
- **Вопросы пользователю:** —

### 2026-10-16 — L-I.3 Умножение матриц: четыре взгляда — готов
- **Сделано:** Урок I.3: четыре цикла (строка на столбец и правило форм; столбцы и строки, AB ≠ BA; сумма внешних произведений, XᵀX — сумма по объектам; блоки, адамарово произведение, * и @ в NumPy, векторизация). Виджет «Четыре взгляда на AB» (src/widgets/la/matmul-views, три рисунка с разными взглядами). Игра «Тетрис размерностей» (/games/dim-tetris, шесть уровней от Av до XᵀXθ, блоки клетками цвета роли, транспонирование). Правила rule.matmul-outer и rule.gram-sum, генераторы la.matmul-column (столбец или строка), la.outer, la.shape-product; ячейки la/matmul.py закреплены тестом. Код в обратных кавычках в текстах упражнений (renderInline); GameShell передаёт dispatch полю игры.
- **Файлы:** content/courses/foundations/linear-algebra/matrix-multiplication.mdx, src/widgets/la/matmul-views/*, src/games/dim-tetris/*, src/pages/games/dim-tetris.astro, content/formulas/rules/{matmul-outer,gram-sum}.yaml, src/lib/exercises/generators/la.ts, src/markdown/core/inline.ts, code/snippets/la/matmul.py
- **Проверка:** vitest 381; pytest; e2e полный — 416 passed, 154 skipped; после правок — уроки модуля I, I.4, карта и layout — чисто; lint, check, validate, check_consistency — чисто; скриншоты 1440 светлая и 390 тёмная
- **Отклонения от плана и решения:** Цель «четыре способа» проверяется всеми: la.matmul2 (элемент), la.matmul-column (столбец на нечётных вариантах, строка на чётных), la.outer и rule.matmul-outer. Итоговая проверка — la.matmul-column, вариант 31 (столбец).
- **Следующий шаг:** L-I.4 — проверить урок «Матрица как отображение» по определению готовности.
- **Вопросы пользователю:** —

### 2026-10-16 — L-I.2 Скалярное произведение и нормы — готов
- **Сделано:** Урок I.2: четыре цикла (скалярное произведение и длина; нормы ℓ1, ℓ2, ℓ∞ и Фробениуса; проекция на вектор; неравенство Коши — Буняковского и угол в ℝ^d). Виджеты «Единичные шары норм» (src/widgets/la/norm-balls) и «Проекция с подвижным углом» (src/widgets/la/projection). Формулы f.vector-projection (минимум квадрата расстояния по t) и f.cauchy-schwarz (через остаток проекции). Генераторы la.norms, la.projection, la.angle; две ячейки la/norms.py (нормы в NumPy, средний |cos| случайных векторов падает с размерностью), вывод закреплён тестом. Кит: опция Plane equal (одинаковый масштаб осей), имена функций в подписях прямым шрифтом.
- **Файлы:** content/courses/foundations/linear-algebra/dot-product-norms.mdx, content/formulas/la/{vector-projection,cauchy-schwarz}.yaml, src/widgets/la/{norm-balls,projection}/*, src/widgets/_kit/{layout,format}.ts, src/lib/exercises/generators/la.ts, code/snippets/la/norms.py
- **Проверка:** vitest 365; pytest; e2e полный — 394 passed, 146 skipped; lint, check, validate, check_consistency — чисто; скриншоты 1440 светлая и 390 тёмная
- **Отклонения от плана и решения:** Плоскости кита растягивали оси по-разному: круг выходил эллипсом. Добавлена опция equal, её получили шары норм, проекция, и «Оболочка» из I.1. Итоговая проверка — la.projection. Угол вводится после неравенства Коши — Буняковского, как требует карточка.
- **Следующий шаг:** L-I.3 — умножение матриц: четыре взгляда.
- **Вопросы пользователю:** —

### 2026-10-15 — L-I.1 Векторы, линейные комбинации, оболочка — готов
- **Сделано:** Урок I.1: четыре цикла (векторы; комбинации и оболочка; линейная независимость; базис, размерность, подпространство). Виджет «Оболочка двух векторов» (src/widgets/la/span: бегунки c₁, c₂, заготовки — не параллельны, параллельны, b = 0; оболочка — решётка целых комбинаций или прямая). Игра «Попади в точку» (/games/span-hit, шесть уровней, граничные — параллельные векторы и цель вне прямой, кнопка «Невозможно»). Генераторы la.in-span и la.independence, понятие la.basis, ячейка la/span.py (ранг зависимого и независимого наборов, вывод закреплён тестом).
- **Файлы:** content/courses/foundations/linear-algebra/vectors-span.mdx, src/widgets/la/span/*, src/games/span-hit/*, src/pages/games/span-hit.astro, src/lib/exercises/generators/la.ts, code/snippets/la/span.py
- **Проверка:** vitest 356; pytest; e2e layout, урок I.1 и игра — 183; lint, check, validate, check_consistency — чисто; скриншоты 1440/390
- **Отклонения от плана и решения:** Урок рассчитан на 2 часа вместе с игрой и виджетом; итоговая проверка — la.lincomb, как задача диагностики. Игра пойдёт и в урок I.6 (уровни с недостижимой целью уже есть).
- **Следующий шаг:** L-I.2 — скалярное произведение и нормы.
- **Вопросы пользователю:** —

### 2026-10-15 — L-0.9 Обозначения курса и CS229; итоговая проверка модуля 0 — готов
- **Сделано:** Урок 0.9: два цикла (нотация CS229 — сводная таблица; переводчик — русские учебники и конфликты символов Σ, |Σ|, σ, λ, ℓ, J). Генератор basics.cs229-reading: пять фрагментов CS229 (h_θ, J, шаг спуска :=, ℓ(θ) с «;», |Σ|) в обе стороны, неверные прочтения — конфликты и путаницы. Понятие nota.cs229. Итоговая проверка модуля «Старт» — ExerciseSet из восьми задач уроков 0.1, 0.3–0.9 в конце урока 0.9. Блок S3.L0 закрыт: девять уроков, три игры, виджет, лабораторная.
- **Файлы:** content/courses/foundations/start/notation.mdx, src/lib/exercises/generators/basics.ts, content/concepts/nota.yaml, tests/e2e/lesson-start.spec.ts
- **Проверка:** vitest 347; pytest; e2e урок 0.9 и проверка модуля (8 из 8) — 2; полный e2e — в журнале PR; lint, check, validate, check_consistency — чисто
- **Отклонения от плана и решения:** Итоговая проверка модуля 0 стоит в конце урока 0.9: отдельного урока-капстоуна у модуля нет (у модуля I это I.12). Задачи набора — с другими seed, чем итоговые проверки уроков.
- **Следующий шаг:** L-I.1 — векторы, линейные комбинации, оболочка и игра «Попади в точку».
- **Вопросы пользователю:** —

### 2026-10-15 — L-0.8 Минимум NumPy: массивы, формы, векторизация — готов
- **Сделано:** Урок 0.8: три цикла (массивы и формы; @, транспонирование, broadcasting, оси; векторизация) и лабораторная «NumPy за час» (notebooks/src/start/numpy_minimum.py: шесть заданий — формы, векторизация J, стандартизация, баг с (n, 1), счёт классов индикатором, время). Сниппет start/numpy_minimum.py (данные, цикл, векторно) общий для урока и лабораторной; вывод ячейки закреплён тестом. Понятие nota.arrays. mlf.check.regression_data — публичный генератор данных для matches, с весами θ. Блоки ```python в уроках подсвечиваются токенами курса (Shiki выключен), короткий код в строке не рвётся; валидатор запрещает код в лиде.
- **Файлы:** content/courses/foundations/start/numpy-minimum.mdx, notebooks/src/start/numpy_minimum.py, notebooks/start/numpy_minimum.ipynb, code/snippets/start/numpy_minimum.py, code/mlf/check.py, src/markdown/core/plugins.ts, astro.config.mjs
- **Проверка:** vitest 347; pytest; лабораторные pytest --nbmake — 2; e2e уроки модуля 0, layout, math — 180; lint, check, validate, check_consistency — чисто
- **Отклонения от плана и решения:** Первый блок ```python в уроке упал на axe: цвета Shiki не проходят контраст на фоне блока «Типичная ошибка». Подсветка переведена на собственные токены, как у ячеек. В лиде код в обратных кавычках не отображался, а « - » типограф делал тире — теперь это ошибка валидатора.
- **Следующий шаг:** L-0.9 — обозначения курса и CS229.
- **Вопросы пользователю:** —

### 2026-10-15 — L-0.7 Интеграл — готов
- **Сделано:** Урок 0.7: три цикла (площадь как сумма; первообразная и замена переменной; несобственный интеграл). Виджет «Сумма прямоугольников → площадь» (src/widgets/calc/riemann: x², e⁻ˣ, e^(−x²/2); левые, средние, правые точки; n до 64), рисунки 1–2. Формула f.exponential-normalization с выводом, правило rule.gaussian-integral (без вывода, вывод — II.10), понятие calc.integral. Ячейка Монте-Карло start/monte_carlo.py, вывод закреплён в code/tests/test_monte_carlo.py.
- **Файлы:** content/courses/foundations/start/integral.mdx, src/widgets/calc/riemann/*, src/components/widgets/Riemann.astro, content/formulas/calc/exponential-normalization.yaml, content/formulas/rules/gaussian-integral.yaml, code/snippets/start/monte_carlo.py
- **Проверка:** vitest, pytest, e2e урока 0.7 — 2; lint, check, validate, check_consistency — чисто; скриншоты 1440/390
- **Отклонения от плана и решения:** Интегралы в проверках формул — суммы по средним точкам на широком отрезке (без np.trapezoid: его нет в NumPy 1.x). У правила гауссова интеграла символов нет — проверка работает и с пустым списком. Ошибка меньше 10⁻⁴ в виджете пишется словами, иначе показание «0.0000» выглядело бы точным ответом.
- **Следующий шаг:** L-0.8 — минимум NumPy и лабораторная «NumPy за час».
- **Вопросы пользователю:** —

### 2026-10-15 — L-0.6 Производная и правило цепочки — готов
- **Сделано:** Урок 0.6: три цикла (производная; правило цепочки; численная проверка). Формула f.log-sigmoid-derivative (d/dz log g = 1 − g, четыре шага с проверкой градиента), понятия calc.derivative и calc.chain-rule, генератор basics.derivative (многочлен или произведение скобок в точке). Ячейка Python start/numdiff.py: прямая и центральная разности для x³ при h от 0.1 до 10⁻¹²; вывод закреплён в code/tests/test_numdiff.py.
- **Файлы:** content/courses/foundations/start/derivative-refresher.mdx, content/formulas/calc/log-sigmoid-derivative.yaml, code/snippets/start/numdiff.py, code/tests/test_numdiff.py, src/lib/exercises/generators/basics.ts
- **Проверка:** vitest, pytest, e2e урока 0.6 — 2; lint, check, validate, check_consistency — чисто; скриншоты 1440/390
- **Отклонения от плана и решения:** Функция в ячейке — x · x · x, а не x**3: только сложения и умножения, поэтому округления одинаковы в Pyodide и CPython и тест сверяет вывод до цифры.
- **Следующий шаг:** L-0.7 — интеграл.
- **Вопросы пользователю:** —

### 2026-10-15 — L-0.5 Экспонента, логарифм, сигмоида — готов
- **Сделано:** Урок 0.5: три цикла (экспонента и логарифм; логарифм правдоподобия и underflow; сигмоида). Правила rule.log-product, rule.sigmoid-symmetry, rule.logsumexp-shift, формула f.sigmoid-derivative с выводом в четыре шага; понятие calc.sigmoid. Ячейка Python start/underflow.py (произведение 1100 вероятностей — 0.0, сумма логарифмов, log-sum-exp со сдвигом), числа закреплены в code/tests/test_underflow.py. Игра «Underflow» (/games/underflow): прогноз объекта, на котором произведение станет нулём, сумма логарифмов, сравнение двух моделей с нулевым правдоподобием. Валидатор: заголовок таблицы из одной формулы — ошибка (axe empty-table-header). Правило из реестра делится на части по «=» вне скобок.
- **Файлы:** content/courses/foundations/start/exp-log-sigmoid.mdx, content/formulas/rules/{log-product,sigmoid-symmetry,logsumexp-shift}.yaml, content/formulas/calc/sigmoid-derivative.yaml, code/snippets/start/underflow.py, src/games/underflow/*, src/lib/content/rule-instance.ts, src/lib/content/validate.ts
- **Проверка:** vitest 337; pytest 77; e2e урок 0.5, обе игры модуля, «Подгони прямую» — 21; lint, check, validate, check_consistency — чисто; скриншоты 1440/390
- **Отклонения от плана и решения:** Черновик игры попал ещё в коммит L-0.4 (commit.sh делает git add -A), доделан здесь. У «уверенной модели» вероятности от 0.4: произведение чисел больше 0.5 во float64 застревает на 2⁻¹⁰⁷⁴ и нулём не становится. График — «сколько нулей после запятой» (−log₁₀ ∏ pᵢ) с осью n внизу. Page Up у бегунка — десятая часть шкалы, а не десять шагов: справка в обеих играх исправлена. Пользователь попросил вливать готовые срезы в main: после L-0.4 открыт и влит PR #3.
- **Следующий шаг:** L-0.6 — производная и правило цепочки.
- **Вопросы пользователю:** —

### 2026-10-15 — L-0.4 Суммы, произведения, индикатор — готов
- **Сделано:** Урок 0.4: четыре цикла (знак суммы и произведения; двойные суммы и матрицы; индикатор; геометрический ряд), ошибки «выносить зависящее от индекса» и (Σa)² ≠ Σa². Правило rule.bilinear-sum (xᵀAy как двойная сумма, мутации — перестановки индексов) и формула f.geometric-series с выводом по шагам; новый вид выборки fraction. Генераторы basics.sum-square, basics.bilinear, basics.geometric; понятие nota.indicator. Игра «Переводчик сумм» (/games/sum-translator): цепочка множителей с ⊤ переводится обратно в индексы, проверка на двух наборах чисел, 7 уровней до Xᵀy и XᵀX; формулы из HTML шрифтами KaTeX (токен --font-math-upright).
- **Файлы:** content/courses/foundations/start/sums-products-indicators.mdx, content/formulas/rules/bilinear-sum.yaml, content/formulas/calc/geometric-series.yaml, src/games/sum-translator/*, src/pages/games/sum-translator.astro, src/lib/exercises/generators/basics.ts, tests/e2e/sum-translator.spec.ts
- **Проверка:** vitest 331; pytest 71; e2e — 299 passed (полный прогон; одно падение подсказок игры на телефоне устранено ожиданием каждой подсказки), урок 0.4 и игра — 12; lint, check, validate, check_consistency — чисто; скриншоты 1440/390
- **Отклонения от плана и решения:** Индикатор — как в CS229, 1{·}: KaTeX рисует \mathbb{1} обычной единицей, и заметка «в курсе — 𝟙» показывала два одинаковых знака. Игра проверяет ответ на числах, а не по форме: xᵀy и yᵀx, xᵀAy и yᵀAᵀx принимаются обе; что принятая цепочка не бывает ложной, проверяет fast-check по всем цепочкам до трёх множителей.
- **Следующий шаг:** L-0.5 — экспонента, логарифм, сигмоида и игра «Underflow».
- **Вопросы пользователю:** —

### 2026-10-15 — L-0.3 Язык математики: множества, отображения, кванторы — готов
- **Сделано:** Урок 0.3: три цикла (множества и ℝᵈ, ∈ и ⊂; отображения — функция, значение, образ, композиция; аргмин, кванторы, ∝) и практика «перевод туда и обратно» — генератор basics.read-notation (8 записей × 2 стороны, неверные варианты — типичные путаницы). Ошибки ∈↔⊂, min↔argmin, ∝↔=. Понятия nota.sets и nota.argmin, глоссарий. Итоговая проверка — basics.argmin. Типограф: однострочные компоненты MDX (<Note>…</Note>) типографятся как абзац — кавычка после формулы больше не разворачивается («…«), короткие формулы в заметках не рвутся.
- **Файлы:** content/courses/foundations/start/language-of-math.mdx, content/concepts/nota.yaml, content/glossary.yaml, src/lib/exercises/generators/basics.ts, src/markdown/core/plugins.ts, tests/e2e/lesson-start.spec.ts
- **Проверка:** vitest 315; e2e урок 0.3 и layout — 123; lint, check, validate, check_consistency — чисто; скриншоты 1440/390 без горизонтальной прокрутки
- **Отклонения от плана и решения:** Таблица значений f(x) — вертикальная: строчная таблица на телефоне складывалась в карточки без подписи «точка x». Формулу Байеса в тексте разбивать можно только по ∝ (группы в фигурных скобках).
- **Следующий шаг:** L-0.4 — суммы, произведения, индикатор и игра «Переводчик сумм».
- **Вопросы пользователю:** —

### 2026-10-15 — L-0.1 Регрессия руками за 15 минут — готов
- **Сделано:** Урок 0.1: два цикла (прямая на глаз — модель, ошибка, J; чего не хватает — карта модулей I–IV), рисунок «Подгонка прямой» без кнопки минимума, ошибка «сумма со знаком», генератор basics.sse (итоговая проверка). Набор «Квартиры» (code/mlf/datasets.py, экспорт и тест). Игра «Подгони прямую» (/games/fit-line): уровни «наклон», «наклон и сдвиг» (+3 млн), «выброс»; сдача — J не больше минимума на 5 %; решаемость на сетке бегунков — fast-check. Понятие ml.loss.
- **Файлы:** content/courses/foundations/start/regression-by-hand.mdx, code/mlf/datasets.py, src/games/fit-line/*, src/pages/games/fit-line.astro, src/lib/exercises/generators/basics.ts
- **Проверка:** vitest 314; pytest 66; e2e урок 0.1 и игра — 4; lint, check, validate, check_consistency — чисто; скриншоты 1440/390 без горизонтальной прокрутки
- **Отклонения от плана и решения:** Шаги бегунков игры — 0.1 и 0.002: при 0.25 и 0.005 на части выборок минимум не достигался в пределах 5 % (поймал fast-check). Уровень «наклон и сдвиг» — цены +3 млн («с ремонтом»), иначе прямая через ноль почти не хуже.
- **Следующий шаг:** L-0.3 — язык математики.
- **Вопросы пользователю:** —

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
