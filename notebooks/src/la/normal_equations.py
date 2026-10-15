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
# # Лабораторная: нормальные уравнения
#
# Урок V.1 «Линейная регрессия тремя способами». Около 40 минут.
#
# [Открыть в Colab](https://colab.research.google.com/github/perewodchik/Machine-course/blob/main/notebooks/la/normal_equations.ipynb)
#
# **После лабораторной вы умеете:**
# - записывать функцию потерь МНК через матрицы и считать её в NumPy без циклов;
# - проверять аналитический градиент численным;
# - решать нормальные уравнения и объяснять, почему `solve` лучше `inv`;
# - видеть, что происходит, когда столбцы $X$ линейно зависимы.

# %%
# Настройка: пакет курса с проверками. Локально и в CI он уже установлен, в Colab ставится из GitHub.
try:
    from mlf import check
except ImportError:
    # %pip install -q "mlf @ git+https://github.com/perewodchik/Machine-course#subdirectory=code"
    from mlf import check
import numpy as np

# %% [markdown]
# ## Данные
#
# Те же двенадцать объектов, что на рисунке 1 урока. Матрица $X$ имеет размер $n \times 2$: столбец единиц для свободного члена и признак.

# %%
# snippet: la/normal_equations.py#data


X, y = make_data()
print("X:", X.shape, " y:", y.shape)

# %% [markdown]
# ## Задание 1. Функция потерь
#
# Реализуйте $J(\theta) = \tfrac12 \lVert X\theta - y \rVert^2$ без циклов.
#
# Подсказка: квадрат нормы вектора $r$ — это `r @ r`.

# %%
def loss(theta):
    # BEGIN SOLUTION
    r = X @ theta - y
    return 0.5 * r @ r
    # END SOLUTION


check.close(loss(np.array([2.5, 0.25])), 5.2297, name="J(θ) в точке (2.5, 0.25)", rtol=1e-3)
check.passed()

# %% [markdown]
# ## Задание 2. Градиент
#
# В уроке мы вывели $\nabla_\theta J = X^\top X\theta - X^\top y$. Реализуйте его и сравните с численным градиентом: центральная разность $\dfrac{J(\theta + h e_i) - J(\theta - h e_i)}{2h}$ по каждой координате.

# %%
def gradient(theta):
    # BEGIN SOLUTION
    return X.T @ X @ theta - X.T @ y
    # END SOLUTION


def numeric_gradient(f, theta, h=1e-6):
    g = np.zeros_like(theta)
    for i in range(theta.size):
        e = np.zeros_like(theta)
        e[i] = h
        g[i] = (f(theta + e) - f(theta - e)) / (2 * h)
    return g


theta0 = np.array([2.5, 0.25])
check.close(gradient(theta0), numeric_gradient(loss, theta0), name="градиент", rtol=1e-5)
check.passed()

# %% [markdown]
# ## Задание 3. Решение
#
# Найдите $\theta^\star$ из системы $X^\top X\theta = X^\top y$. Используйте `np.linalg.solve`, а не `np.linalg.inv`.

# %%
# BEGIN SOLUTION
theta_star = np.linalg.solve(X.T @ X, X.T @ y)
# END SOLUTION

check.close(theta_star, np.linalg.lstsq(X, y, rcond=None)[0], name="θ*")
check.close(gradient(theta_star), np.zeros(2), name="градиент в θ*", atol=1e-9)
print("θ* =", theta_star.round(3), " J(θ*) =", round(loss(theta_star), 3))
check.passed()

# %% [markdown]
# ## Задание 4. Зависимые столбцы
#
# Добавьте к $X$ копию второго столбца. Что стало с рангом $X$ и с определителем $X^\top X$? Работает ли `solve`? Что возвращает `lstsq`?

# %%
X_dup = np.column_stack([X, X[:, 1]])
print("rank X_dup =", np.linalg.matrix_rank(X_dup))
print("det(XᵀX) =", np.linalg.det(X_dup.T @ X_dup))
theta_min_norm = np.linalg.lstsq(X_dup, y, rcond=None)[0]
print("lstsq:", theta_min_norm.round(3))

# %% [markdown]
# **Вопрос для самопроверки.** Почему `lstsq` всё равно находит решение и почему оно делит вес поровну между одинаковыми столбцами? Ответ связан с псевдообратной матрицей из урока I.11.

# %% [markdown]
# ## Задание 5. Решение для любых данных
#
# Напишите `fit(X, y)`, которая находит веса для **любой** матрицы признаков — в том числе с одним объектом
# или с зависимыми столбцами. Проверка запускает вашу функцию на десятках случайных задач разного размера
# и, если что-то не так, показывает самый маленький пример, на котором она ломается.

# %%
def fit(X, y):
    # BEGIN SOLUTION
    return np.linalg.lstsq(X, y, rcond=None)[0]
    # END SOLUTION


check.matches(fit, lambda X, y: np.linalg.lstsq(X, y, rcond=None)[0], name="fit")
check.passed()

# %% [markdown]
# **Попробуйте.** Замените решение на `np.linalg.solve(X.T @ X, X.T @ y)` и запустите проверку ещё раз:
# на каком примере оно падает и почему?

