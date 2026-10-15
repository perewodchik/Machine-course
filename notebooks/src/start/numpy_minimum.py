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
# # Лабораторная: NumPy за час
#
# Урок 0.8 «Минимум NumPy: массивы, формы, векторизация». Около 60 минут.
#
# [Открыть в Colab](https://colab.research.google.com/github/perewodchik/Machine-course/blob/main/notebooks/start/numpy_minimum.ipynb)
#
# **После лабораторной вы умеете:**
# - предсказывать форму результата `@`, транспонирования, агрегатов и broadcasting;
# - переписывать цикл по объектам одним выражением над массивами;
# - находить ошибку, когда `(n,)` и `(n, 1)` незаметно дают матрицу `n × n`;
# - считать объекты каждого класса без цикла — индикатором из урока 0.4.

# %%
# Настройка: пакет курса с проверками. Локально и в CI он уже установлен, в Colab ставится из GitHub.
try:
    from mlf import check
except ImportError:
    # %pip install -q "mlf @ git+https://github.com/perewodchik/Machine-course#subdirectory=code"
    from mlf import check
import numpy as np

# %% [markdown]
# ## Задание 1. Предскажите форму
#
# Не запуская выражения, запишите форму каждого результата кортежем: `(5,)`, `(5, 3)` и так далее. Потом запустите проверку.

# %%
X = np.ones((5, 3))      # 5 объектов, 3 признака
theta = np.ones(3)       # веса
y = np.ones(5)           # ответы — одномерный массив
y_col = np.ones((5, 1))  # те же ответы столбцом

# BEGIN SOLUTION
predicted = {
    "X @ theta": (5,),
    "X.T @ X": (3, 3),
    "X.mean(axis=0)": (3,),
    "X.sum(axis=1)": (5,),
    "X * theta": (5, 3),
    "y_col - y": (5, 5),
}
# END SOLUTION

for code, shape in predicted.items():
    check.shape(eval(code), shape, name=code)  # строки кода — из словаря выше
check.passed()

# %% [markdown]
# **Вопрос для самопроверки.** Почему `y_col - y` — матрица 5 × 5? Распишите правило broadcasting: формы `(5, 1)` и `(5,)` выравниваются по правому краю.

# %% [markdown]
# ## Задание 2. Векторизуйте цикл
#
# Функция ниже считает $J(\theta) = \tfrac12 \sum_i \bigl(\theta^\top x^{(i)} - y^{(i)}\bigr)^2$ двумя циклами. Напишите `loss` без циклов.

# %%
# snippet: start/numpy_minimum.py#data
# snippet: start/numpy_minimum.py#loop


X, y, theta = make_data(n=300, d=4, seed=1)


def loss(X, y, theta):
    # BEGIN SOLUTION
    r = X @ theta - y
    return 0.5 * r @ r
    # END SOLUTION


check.close(loss(X, y, theta), loss_loop(X, y, theta), name="J(θ)")
check.matches(loss, loss_loop, inputs=lambda draw: check.regression_data(draw, with_theta=True), name="loss")
check.passed()

# %% [markdown]
# ## Задание 3. Стандартизация признаков
#
# Вычтите из каждого столбца $X$ его среднее и разделите на стандартное отклонение. Одной строкой, без цикла по столбцам: агрегаты по `axis=0` и broadcasting.

# %%
def standardize(X):
    # BEGIN SOLUTION
    return (X - X.mean(axis=0)) / X.std(axis=0)
    # END SOLUTION


Z = standardize(X)
check.shape(Z, X.shape, name="Z")
check.close(Z.mean(axis=0), np.zeros(X.shape[1]), name="средние столбцов", atol=1e-12)
check.close(Z.std(axis=0), np.ones(X.shape[1]), name="стандартные отклонения столбцов")
check.passed()

# %% [markdown]
# ## Задание 4. Почините баг
#
# Ответы пришли столбцом формы `(n, 1)`. Код ниже считает функцию потерь без ошибок, но ответ неверный. Найдите причину и исправьте `residuals`.

# %%
y_col = y.reshape(-1, 1)  # так ответы часто читают из файла

# BEGIN SOLUTION
residuals = X @ theta - y_col.ravel()
# END SOLUTION

check.shape(residuals, (X.shape[0],), name="residuals")
check.close(0.5 * residuals @ residuals, loss_loop(X, y, theta), name="J(θ)")
check.passed()

# %% [markdown]
# **Вопрос для самопроверки.** Какой формы был бы `X @ theta - y_col` и почему NumPy не сообщил об ошибке?

# %% [markdown]
# ## Задание 5. Число объектов каждого класса
#
# Метки классов — числа от 0 до $K - 1$. Посчитайте `counts[k]` $= \sum_i 1\{y^{(i)} = k\}$ без цикла: сравните столбец меток со строкой `np.arange(K)` (broadcasting даст матрицу индикаторов) и сложите по нужной оси.

# %%
rng = np.random.default_rng(7)
K = 4
labels = rng.integers(0, K, size=200)


def class_counts(labels, K):
    # BEGIN SOLUTION
    return (labels[:, None] == np.arange(K)).sum(axis=0)
    # END SOLUTION


check.close(class_counts(labels, K), np.bincount(labels, minlength=K), name="counts")
check.passed()

# %% [markdown]
# ## Задание 6. Исследование: насколько быстрее
#
# Сравните время `loss_loop` и вашей `loss` на 200 000 объектах. Во сколько раз векторное выражение быстрее на вашем компьютере? Почему разница растёт с числом признаков?

# %%
import time

X_big, y_big, theta_big = make_data(n=200_000, d=4, seed=2)
for f in (loss_loop, loss):
    start = time.perf_counter()
    f(X_big, y_big, theta_big)
    print(f"{f.__name__}: {time.perf_counter() - start:.3f} с")

# %% [markdown]
# **Вопрос для самопроверки.** Почему для случайных чисел в курсе пишут `rng = np.random.default_rng(seed)`, а не `np.random.seed(seed)`? Подсказка: что будет, если две функции по очереди меняют общее состояние генератора.
