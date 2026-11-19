# ---
# jupyter:
#   jupytext:
#     formats: py:percent
#   kernelspec:
#     display_name: Python 3
#     language: python
#     name: python3
# ---

# %% [markdown]
# # Проект P1. Цена квартиры: продажи домов в округе Кинг
#
# Курс «Основы ML», после модуля 1. Полный цикл регрессии на настоящих данных: разбиение → бейзлайн → линейная регрессия с нуля → признаки → честная оценка → анализ ошибок. 6–8 часов.
#
# [Открыть в Colab](https://colab.research.google.com/github/perewodchik/Machine-course/blob/main/notebooks/projects/p1_house_prices.ipynb)
#
# **Данные:** King County House Sales — 21 613 продаж домов в округе Кинг (Сиэтл, США) с мая 2014 по май 2015; OpenML, набор 42092, лицензия CC0. Цена в долларах, площади в квадратных футах.
#
# **После проекта вы умеете:**
# - разбивать данные так, чтобы тест не протёк в обучение (в том числе через повторные продажи одного дома);
# - обучать линейную регрессию спуском и проверять градиент конечными разностями;
# - строить признаки (логарифмы, категории, взаимодействия) и сравнивать модели только на валидации;
# - один раз оценивать итоговую модель на тесте и разбирать ошибки по срезам.
#
# **Правила:** модель выбирают по обучающей и валидационной частям; тестовая закрыта (`Sealed`) и открывается один раз — в `P.final`. Проект зачтён, если RMSE на закрытой выборке не больше **160 000 $**.

# %%
# Настройка: пакет курса с данными и проверками. Локально и в CI он уже установлен, в Colab ставится из GitHub.
try:
    from mlf import check, project
except ImportError:
    # %pip install -q "mlf @ git+https://github.com/perewodchik/Machine-course#subdirectory=code"
    from mlf import check, project
import numpy as np

from mlf.datasets import HOUSE_COLUMNS, house_sales
from mlf.project import rmse

# %% [markdown]
# ## Этап 0. Данные и разбиение
#
# `house_sales()` возвращает словарь столбцов NumPy (с pandas удобнее: `mlf.datasets.as_frame(h)`). Посмотрите на описания столбцов и на цену.

# %%
h = house_sales()
for name, text in HOUSE_COLUMNS.items():
    print(f"{name:>14}: {text}")
price = h["price"].astype(float)
print(f"\n{len(price)} продаж; цена: медиана {np.median(price):,.0f} $, среднее {price.mean():,.0f} $, максимум {price.max():,.0f} $")

# %% [markdown]
# Цена — с тяжёлым правым хвостом: среднее заметно выше медианы, а несколько домов стоят дороже 5 млн $. RMSE чувствителен к таким домам — держите это в голове при анализе ошибок.
#
# **Ловушка разбиения.** Некоторые дома проданы дважды (одинаковый `id`). Если одна продажа попадёт в обучение, а другая в тест, модель «узнает» дом — оценка выйдет слишком оптимистичной. Поэтому делим по домам: `groups=h["id"]`.
#
# Признаки этапов 1–2 — все числовые столбцы, кроме `id`, `date`, `zipcode` и `sqft_above` (жилая площадь = над землёй + подвал: столбец `sqft_above` линейно зависим от двух других).

# %%
NUMERIC = ["bedrooms", "bathrooms", "sqft_living", "sqft_lot", "floors", "waterfront", "view", "condition", "grade",
           "sqft_basement", "yr_built", "yr_renovated", "lat", "long", "sqft_living15", "sqft_lot15"]
rows = np.arange(len(price))
(r_tr, y_tr), (r_va, y_va), test = project.split(rows, price, seed=2026, groups=h["id"])
P = project.Project("Цена квартиры (King County)", test, metric=rmse, threshold=160_000)
print(f"обучение {len(y_tr)}, валидация {len(y_va)}, тест {len(test)} (закрыт)")

shared = set(h["id"][r_tr]) & set(h["id"][r_va])
assert not shared, "один дом в обучении и в валидации"


def numeric(r):
    """Матрица числовых признаков для строк r набора."""
    return np.column_stack([h[c][r].astype(float) for c in NUMERIC])


X_tr, X_va = numeric(r_tr), numeric(r_va)
P.stage("данные и разбиение")

# %% [markdown]
# ## Этап 1. Бейзлайн
#
# **1.1.** Самая простая модель — средняя цена обучающей части. Напишите `baseline(y_train, n)`: вектор длины $n$ из среднего.

# %%
def baseline(y_train, n):
    # BEGIN SOLUTION
    return np.full(n, np.mean(y_train))
    # END SOLUTION


check.close(baseline(np.array([1.0, 2.0, 6.0]), 2), [3.0, 3.0], name="бейзлайн")
rmse_mean = rmse(y_va, baseline(y_tr, len(y_va)))
print(f"RMSE среднего на валидации: {rmse_mean:,.0f} $")

# %% [markdown]
# **1.2.** Стандартизация. Напишите `standardize(X_fit, X)`: вычесть из столбцов `X` среднее столбцов `X_fit` и поделить на их стандартное отклонение. Статистики — **только по `X_fit`** (обучающей части): проверка подставит разные части и поймает утечку масштабирования.

# %%
def standardize(X_fit, X):
    # BEGIN SOLUTION
    return (X - X_fit.mean(axis=0)) / X_fit.std(axis=0)
    # END SOLUTION


project.check_scaling(standardize)
check.passed("Масштабирование — по обучающей части.")

# %% [markdown]
# **1.3.** Линейная регрессия по всем числовым признакам: `design(X_fit, X)` — столбец единиц и стандартизованные признаки, веса — `np.linalg.lstsq`.

# %%
def design(X_fit, X):
    return np.column_stack([np.ones(len(X)), standardize(X_fit, X)])


theta_ols = np.linalg.lstsq(design(X_tr, X_tr), y_tr, rcond=None)[0]
rmse_ols = rmse(y_va, design(X_tr, X_va) @ theta_ols)
print(f"RMSE линейной регрессии на валидации: {rmse_ols:,.0f} $ (среднее: {rmse_mean:,.0f} $)")
if not rmse_ols < rmse_mean:
    raise check.CheckFailed("Линейная модель должна быть лучше среднего на валидации.")
P.stage("бейзлайн")

# %% [markdown]
# ## Этап 2. LMS с нуля
#
# Функция потерь $J(\theta) = \frac{1}{2n}\lVert Z\theta - y\rVert^2$ (урок 1.2). Цену делим на 1 000: веса и шаги — в тысячах долларов, числа удобнее читать.
#
# **2.1.** Напишите `grad(theta, Z, y)` — градиент $J$, вектор той же формы, что $\theta$. Скрытые тесты сравнят его с конечными разностями на случайных задачах.

# %%
def loss(theta, Z, y):
    r = Z @ theta - y
    return r @ r / (2 * len(y))


def grad(theta, Z, y):
    # BEGIN SOLUTION
    return Z.T @ (Z @ theta - y) / len(y)
    # END SOLUTION


def numeric_grad(Z, y, theta, eps=1e-6):
    """Центральные конечные разности: (J(θ + ε eⱼ) − J(θ − ε eⱼ)) / 2ε по каждой координате."""
    E = np.eye(len(theta)) * eps
    return np.array([(loss(theta + e, Z, y) - loss(theta - e, Z, y)) / (2 * eps) for e in E])


check.matches(lambda Z, y, theta: grad(theta, Z, y), numeric_grad, name="grad",
              inputs=lambda draw: check.regression_data(draw, with_theta=True), rtol=1e-4, atol=1e-5)
check.passed("Градиент совпадает с конечными разностями.")

# %% [markdown]
# **2.2.** Напишите `gd(Z, y, alpha, epochs, batch=None, seed=0)`: при `batch=None` — пакетный спуск, иначе — мини-батчи размера `batch` с перемешиванием в каждой эпохе (`batch=1` — стохастический). Начальные веса — нули. Пакетный спуск на стандартизованных признаках должен прийти к весам `lstsq` до $10^{-3}$.

# %%
def gd(Z, y, alpha, epochs, batch=None, seed=0):
    rng = np.random.default_rng(seed)
    # BEGIN SOLUTION
    n, d = Z.shape
    theta = np.zeros(d)
    for _ in range(epochs):
        if batch is None:
            theta -= alpha * grad(theta, Z, y)
            continue
        for idx in np.array_split(rng.permutation(n), n // batch):
            theta -= alpha * grad(theta, Z[idx], y[idx])
    return theta
    # END SOLUTION


Z_tr, yk_tr = design(X_tr, X_tr), y_tr / 1000
L = np.linalg.eigvalsh(Z_tr.T @ Z_tr / len(yk_tr)).max()  # шаг меньше 2/L — спуск сходится (урок 1.2)
theta_gd = gd(Z_tr, yk_tr, alpha=1.9 / L, epochs=500)
check.close(theta_gd, theta_ols / 1000, name="веса пакетного спуска", rtol=1e-3, atol=1e-3)
theta_sgd = gd(Z_tr, yk_tr, alpha=0.01, epochs=10, batch=32)
rmse_sgd = rmse(y_va, 1000 * design(X_tr, X_va) @ theta_sgd)
print(f"мини-батч, 10 эпох: RMSE на валидации {rmse_sgd:,.0f} $ (точное решение: {rmse_ols:,.0f} $)")
if not rmse_sgd < 1.02 * rmse_ols:
    raise check.CheckFailed("Мини-батч спуск за 10 эпох должен подойти к точному решению на 2 %: проверьте шаг и перемешивание.")
P.stage("LMS с нуля")

# %% [markdown]
# **Вопрос для самопроверки.** Запустите пакетный спуск на **нестандартизованных** признаках (единицы и `X_tr` как есть) с любым шагом. Почему он либо расходится, либо почти не двигается? Сравните $L$ и наименьшее собственное значение $Z^\top Z / n$ в обоих случаях.

# %% [markdown]
# ## Этап 3. Признаки
#
# Линейная модель по сырым столбцам ошибается систематически: цена растёт с площадью не линейно, а почтовый индекс — категория, а не число. Напишите `features(r)` — матрицу признаков для строк `r`. Идеи:
#
# - логарифмы площадей (`np.log` от `sqft_living`, `sqft_lot`, соседей);
# - возраст дома `2015 − yr_built` и его квадрат, признак «был ремонт»;
# - класс постройки `grade` и его квадрат;
# - почтовый индекс — one-hot: столбец 0/1 на каждый индекс из **обучающей** части, кроме одного;
# - учить модель на $\log(\text{цены})$ и возвращать прогноз в доллары через `np.exp`.
#
# Цель: RMSE на валидации **не больше 85 % RMSE этапа 1**. Так эталонное решение получает около 127 000 $ против 200 000 $.

# %%
ZIPS = np.unique(h["zipcode"][r_tr])  # категории — по обучающей части


def features(r):
    # BEGIN SOLUTION
    age = 2015 - h["yr_built"][r]
    cols = [np.log(h[c][r]) for c in ("sqft_living", "sqft_lot", "sqft_living15", "sqft_lot15")]
    cols += [h[c][r] for c in ("bedrooms", "bathrooms", "floors", "waterfront", "view", "condition", "grade", "lat", "long")]
    cols += [h["grade"][r] ** 2, age, age**2, h["yr_renovated"][r] > 0, h["sqft_basement"][r] > 0]
    zips = h["zipcode"][r][:, None] == ZIPS[None, 1:]
    return np.column_stack([np.asarray(c, float) for c in cols] + [zips.astype(float)])
    # END SOLUTION


def fit_predict(F_fit, y_fit, F):
    # BEGIN SOLUTION
    Z = lambda A: np.column_stack([np.ones(len(A)), standardize(F_fit, A)])  # noqa: E731
    theta = np.linalg.lstsq(Z(F_fit), np.log(y_fit), rcond=None)[0]
    return np.exp(Z(F) @ theta)
    # END SOLUTION


pred_va = fit_predict(features(r_tr), y_tr, features(r_va))
project.check_units(pred_va, y_va)
rmse_feat = rmse(y_va, pred_va)
print(f"RMSE на валидации: {rmse_feat:,.0f} $ (этап 1: {rmse_ols:,.0f} $, нужно ≤ {0.85 * rmse_ols:,.0f} $)")
if not rmse_feat <= 0.85 * rmse_ols:
    raise check.CheckFailed("Признаки должны снизить RMSE на валидации хотя бы на 15 % относительно этапа 1.")
P.stage("признаки")

# %% [markdown]
# **Исследование: LWR на подвыборке.** Локально взвешенная регрессия (урок 1.3) по одному признаку — логарифму жилой площади — на 2 000 домов обучающей части. Сравните её с прямой по тому же признаку на 500 домах валидации при разных $\tau$. Код LWR — тот же, что в уроке.

# %%
# snippet: ml_basics/features_lwr.py#tools

sub, sub_va = np.arange(2000), np.arange(500)
x_sub, y_sub = np.log(h["sqft_living"][r_tr][sub]), np.log(y_tr[sub])
x_q, y_q = np.log(h["sqft_living"][r_va][sub_va]), y_va[sub_va]
line = np.polyfit(x_sub, y_sub, 1)
print(f"прямая: RMSE {rmse(y_q, np.exp(np.polyval(line, x_q))):,.0f} $")
for tau in (0.02, 0.05, 0.2, 1.0):
    pred = np.array([lwr(x, x_sub, y_sub, tau) for x in x_q])
    print(f"LWR, τ = {tau}: RMSE {rmse(y_q, np.exp(pred)):,.0f} $")

# %% [markdown]
# Почему LWR по одной площади лучше прямой, но далеко от модели этапа 3? Почему при 2 000 домов ошибка почти не меняется от $\tau = 0.02$ до $0.05$, а при очень малом $\tau$ решение в `lwr` может упасть на вырожденной матрице?

# %% [markdown]
# ## Этап 4. Финальная оценка и ошибки
#
# Модель выбрана по валидации. Обучаем её на обучающей и валидационной частях и **один раз** оцениваем на закрытой выборке. Второй вызов `P.final` — это подбор по тесту: проверка его остановит.

# %%
r_fit = np.r_[r_tr, r_va]
y_fit = np.r_[y_tr, y_va]
F_fit = features(r_fit)
score = P.final(lambda r: fit_predict(F_fit, y_fit, features(r)))

# %% [markdown]
# **Ошибки по срезам.** Напишите `slice_rmse(y, pred, groups)` — словарь «группа → RMSE на объектах группы». Посмотрите на срезы по классу постройки и по почтовому индексу — на валидации (тест мы больше не трогаем).

# %%
def slice_rmse(y, pred, groups):
    # BEGIN SOLUTION
    return {g: rmse(y[groups == g], pred[groups == g]) for g in np.unique(groups)}
    # END SOLUTION


check.close(list(slice_rmse(np.array([1.0, 2, 3, 5]), np.array([1.0, 2, 4, 5]), np.array(["a", "a", "b", "b"])).values()),
            [0.0, np.sqrt(0.5)], name="RMSE по срезам")

by_grade = slice_rmse(y_va, pred_va, h["grade"][r_va])
for g, e in by_grade.items():
    print(f"класс {g:>2}: {np.sum(h['grade'][r_va] == g):>4} домов, RMSE {e:>10,.0f} $")
by_zip = slice_rmse(y_va, pred_va, h["zipcode"][r_va])
worst = sorted(by_zip, key=by_zip.get)[-5:]
print("худшие индексы:", ", ".join(f"{z} ({by_zip[z]:,.0f} $)" for z in worst))
P.stage("оценка и ошибки")

# %% [markdown]
# ## Отчёт
#
# Заполните шаблон `notebooks/templates/project-report.md`: задача и метрика, данные и разбиение (почему по домам), бейзлайн, таблица экспериментов на валидации, итог на тесте, ошибки по срезам и **три гипотезы**, что улучшить (например: отдельная модель для дорогих домов, расстояние до центра Сиэтла, сезон продажи). Рубрика — на странице проекта на сайте.
#
# Набор данных: House Sales in King County, USA — OpenML 42092 (CC0 1.0).
