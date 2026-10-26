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
# # Демонстрационный проект: цена квартиры
#
# Шаблон проекта курсов ML на синтетических «Квартирах». Около 40 минут. Так устроены все проекты: этапы с автопроверкой, закрытая тестовая выборка и отчёт.
#
# [Открыть в Colab](https://colab.research.google.com/github/perewodchik/Machine-course/blob/main/notebooks/projects/demo_apartments.ipynb)
#
# **Правила проекта:**
# - модель выбирают по обучающей и валидационной частям; тестовая закрыта и открывается один раз — в финальной оценке;
# - каждая функция проверяется скрытыми тестами на случайных данных;
# - проект зачтён, если метрика на закрытой выборке не хуже порога.

# %%
# Настройка: пакет курса с проверками. Локально и в CI он уже установлен, в Colab ставится из GitHub.
try:
    from mlf import check, project
except ImportError:
    # %pip install -q "mlf @ git+https://github.com/perewodchik/Machine-course#subdirectory=code"
    from mlf import check, project
import numpy as np

from mlf.datasets import apartments

# %% [markdown]
# ## Этап 1. Данные и разбиение
#
# 300 квартир: площадь, м², и цена, млн ₽. Делим на обучающую (60 %), валидационную (20 %) и закрытую тестовую (20 %) части. Тестовая — объект `Sealed`: прочитать её до финальной оценки нельзя.

# %%
area, price = apartments(300, seed=5)
(a_tr, y_tr), (a_va, y_va), test = project.split(area, price, seed=1)
P = project.Project("Цена квартиры (демо)", test, metric=project.rmse, threshold=1.0)
print(f"обучение {len(y_tr)}, валидация {len(y_va)}, тест {len(test)} (закрыт)")

try:
    test.X  # так делать нельзя: это утечка
except project.LeakError as err:
    print("Утечка поймана:", err)
P.stage("данные и разбиение")

# %% [markdown]
# ## Этап 2. Бейзлайн
#
# Самая простая модель — предсказывать среднюю цену обучающей части. Любая настоящая модель должна быть лучше. Напишите `baseline(y_train, n)`: вектор длины $n$ из среднего.

# %%
def baseline(y_train, n):
    # BEGIN SOLUTION
    return np.full(n, np.mean(y_train))
    # END SOLUTION


check.close(baseline(np.array([1.0, 2.0, 6.0]), 2), [3.0, 3.0], name="бейзлайн")
rmse_base = project.rmse(y_va, baseline(y_tr, len(y_va)))
print(f"RMSE бейзлайна на валидации: {rmse_base:.3f}")
P.stage("бейзлайн")

# %% [markdown]
# ## Этап 3. Линейная регрессия с нуля
#
# Напишите `fit_ols(X, y)` — веса МНК через нормальные уравнения, без `inv` (урок V.1 курса математики). Скрытые тесты сравнят её с `np.linalg.lstsq` на случайных задачах.

# %%
def fit_ols(X, y):
    # BEGIN SOLUTION
    return np.linalg.solve(X.T @ X, X.T @ y)
    # END SOLUTION


def reference(X, y):
    # вырожденная XᵀX — не задача этого этапа: такие примеры эталон отклоняет, и проверка их пропускает
    if np.linalg.matrix_rank(X) < X.shape[1]:
        raise np.linalg.LinAlgError("вырожденная матрица")
    return np.linalg.lstsq(X, y, rcond=None)[0]


check.matches(fit_ols, reference, name="fit_ols", n=(4, 12), d=(1, 3))
P.stage("линейная регрессия с нуля")

# %% [markdown]
# ## Этап 4. Выбор модели по валидации
#
# Сравним прямую и параболу по площади. Признаки стандартизуем по обучающей части — по ней же, а не по всем данным: иначе в признаки просочится информация из валидации и теста.

# %%
mu, sd = a_tr.mean(), a_tr.std()


def features(a, degree):
    z = (a - mu) / sd
    return np.column_stack([z**k for k in range(degree + 1)])


scores = {}
for degree in (1, 2):
    theta = fit_ols(features(a_tr, degree), y_tr)
    scores[degree] = project.rmse(y_va, features(a_va, degree) @ theta)
    print(f"степень {degree}: RMSE на валидации {scores[degree]:.3f}")
best = min(scores, key=scores.get)
assert scores[best] < rmse_base, "модель должна быть лучше бейзлайна"
P.stage("выбор модели по валидации")

# %% [markdown]
# ## Этап 5. Финальная оценка
#
# Обучаем выбранную модель на обучающей и валидационной частях и один раз оцениваем на закрытой выборке.

# %%
a_fit, y_fit = np.r_[a_tr, a_va], np.r_[y_tr, y_va]
theta = fit_ols(features(a_fit, best), y_fit)
score = P.final(lambda a: features(a, best) @ theta)

# %% [markdown]
# ## Отчёт
#
# Шаблон отчёта — `notebooks/templates/project-report.md`: задача и метрика, данные и разбиение, бейзлайн, эксперименты (таблица с валидацией), финальный результат на тесте, анализ ошибок, что сделать дальше. Рубрика — на странице проекта на сайте.
