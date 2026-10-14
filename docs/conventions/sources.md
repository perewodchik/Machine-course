# На что опираться: источники

## Иерархия

Источник выше по списку побеждает при расхождении. Внутри уровня — порядок не важен.

### 1. Первичные: задают объём, порядок и нотацию

| Источник | Для чего |
|---|---|
| **CS229 main notes** (T. Ma, A. Ng), зафиксированное издание: `main-notes-2026-spring` | Что именно нужно для ML и в какой нотации. Каждое понятие курса должно вести к разделу конспекта |
| **Обзоры CS229**: Linear Algebra Review and Reference (Z. Kolter, C. Do, T. Ma); Probability Theory Review (A. Maleki, T. Do, H. Yuan, T. Ma); Convex Optimization Overview I–II (Z. Kolter, C. Do); The Multivariate Gaussian и More on Gaussians (C. Do) | Минимальный объём ЛА, вероятности и оптимизации |
| **Задания CS229 (problem sets)** | Нужная беглость: что ученик должен уметь вывести сам (Ньютон для логистической регрессии, GDA, GLM для Пуассона) |

### 2. Вторичные: изложение, строгость, примеры

| Источник | Для чего | Оговорка |
|---|---|---|
| M. Deisenroth, A. Faisal, C. Ong. *Mathematics for Machine Learning* | Ближе всех по объёму; доказательства, примеры | Градиент там — строка; у нас — как в CS229 (той же формы, что аргумент) |
| S. Boyd, L. Vandenberghe. *Introduction to Applied Linear Algebra (VMLS)*; *Convex Optimization*, гл. 2–5 | МНК, выпуклость, двойственность | — |
| G. Strang. *Introduction to Linear Algebra* (MIT 18.06); *Linear Algebra and Learning from Data* (18.065) | Подпространства, проекции, SVD, геометрия | — |
| C. Piech. CS109 Course Reader | Вероятность для программистов: MLE, MAP, Beta | — |
| J. Blitzstein, J. Hwang. *Introduction to Probability*; L. Wasserman. *All of Statistics* | Строгость вероятности и статистики | — |
| C. Bishop. *Pattern Recognition and Machine Learning*, гл. 2 | Экспоненциальное семейство, условные гауссианы | Нотация отличается |
| K. Petersen, M. Pedersen. *The Matrix Cookbook* | Справочник тождеств | Только с проверкой соглашений и численной проверкой в `content/formulas` |

### 3. Русская терминология

Учебник по ML ШАД (education.yandex.ru/handbook/ml), лекции К. В. Воронцова. Берём **термины**, но не нотацию: у Воронцова $\ell$ — число объектов, $n$ — число признаков.

### 4. Третичные: только интуиция и визуальные идеи

3Blue1Brown (Essence of Linear Algebra), Immersive Math, Seeing Theory (Brown), Distill, Explorable Explanations, шпаргалки A. и S. Amidi (как чек-лист покрытия), Coursera Machine Learning Specialization (как образец порядка «интуиция → код → математика»).

## Правила

1. **Пишем своё.** Чужие тексты, задачи и рисунки не копируем и не пересказываем близко к тексту. Идею можно взять, формулировку и иллюстрацию — нет.
2. **Каждое утверждение проверяемо.** Формула — через численную проверку в `content/formulas`; факт — ссылкой на источник уровня 1–2.
3. **Ссылка на CS229 — издание и название раздела** (`edition: main-notes-2026-spring`, `section: 'Linear regression / The normal equations'`), не номер главы: номера меняются между изданиями (в весеннем издании 2026 года главы про RL сдвинулись на 3 номера).
4. **Расхождение источников** (нотация, знак, множитель $\tfrac12$) — решаем в пользу CS229 и пишем пометку на полях «в MML это записано так…».
5. **Свежесть.** Версии библиотек и статусы сервисов сверяем на дату решения и записываем дату в ADR.
