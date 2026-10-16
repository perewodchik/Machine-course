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
# # Лабораторная: МНК как проекция
#
# Урок I.12 «Капстоун: МНК как проекция». Около 50 минут.
#
# [Открыть в Colab](https://colab.research.google.com/github/perewodchik/Machine-course/blob/main/notebooks/la/least_squares_projection.ipynb)
#
# **После лабораторной вы умеете:**
# - собирать матрицу признаков и находить веса МНК из нормальных уравнений;
# - строить матрицу проекции и проверять её свойства: $P^2 = P$, $P^\top = P$, $\operatorname{tr} P = d$;
# - проверять, что остаток перпендикулярен столбцам $X$, и раскладывать $\lVert y \rVert^2$ по теореме Пифагора;
# - объяснять, что происходит с весами и с предсказаниями, когда признаки зависимы.

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
# «Квартиры» из урока 0.1: площадь шестнадцати квартир, м², и их цена, млн ₽. В уроке 0.1 прямую подгоняли на глаз, здесь найдём её точно.

# %%
# snippet: la/least_squares.py#data

print("площадь:", area[:5], "…")
print("цена:", y[:5], "…")

# %% [markdown]
# ## Задание 1. Матрица признаков
#
# Модель — $\hat y = \theta_0 + \theta_1 x$. Соберите матрицу $X$ размера $16 \times 2$: первый столбец — единицы (для $\theta_0$), второй — площадь. В ячейке данных $X$ уже есть; соберите свою, `X1`, сами.

# %%
# BEGIN SOLUTION
X1 = np.column_stack([np.ones(area.size), area])
# END SOLUTION

check.shape(X1, (16, 2), name="X1")
check.close(X1, X, name="X1")
check.passed()

# %% [markdown]
# ## Задание 2. Веса — из проекции
#
# Предсказания $X\theta$ лежат в пространстве столбцов $X$ — плоскости в $\mathbb{R}^{16}$. Ближайшая к $y$ точка этой плоскости — проекция, и остаток перпендикулярен столбцам: $X^\top (y - X\hat\theta) = 0$. Найдите $\hat\theta$ из нормальных уравнений $X^\top X \theta = X^\top y$ через `np.linalg.solve`.

# %%
# BEGIN SOLUTION
theta = np.linalg.solve(X.T @ X, X.T @ y)
# END SOLUTION

check.shape(theta, (2,), name="θ̂")
check.close(theta, np.linalg.lstsq(X, y, rcond=None)[0], name="θ̂")
print("θ̂ =", theta.round(3), "→ цена ≈", theta[0].round(2), "+", theta[1].round(3), "· площадь")
check.passed()

# %% [markdown]
# ## Задание 3. Матрица проекции
#
# Постройте $P = X (X^\top X)^{-1} X^\top$ — без `inv`: $(X^\top X)^{-1} X^\top$ — это решение системы $X^\top X \, Z = X^\top$. Затем проверьте три свойства: $P^2 = P$, $P^\top = P$ и $\operatorname{tr} P = 2$. Почему след равен именно двум? Подсказка: $\operatorname{tr}(AB) = \operatorname{tr}(BA)$ (урок I.5).

# %%
# BEGIN SOLUTION
P = X @ np.linalg.solve(X.T @ X, X.T)
# END SOLUTION

check.shape(P, (16, 16), name="P")
check.close(P @ P, P, name="P²", atol=1e-10)
check.close(P.T, P, name="Pᵀ", atol=1e-12)
check.close(np.trace(P), 2.0, name="tr P")
check.close(P @ y, X @ theta, name="Py")
check.passed()

# %% [markdown]
# ## Задание 4. Остаток и теорема Пифагора
#
# Найдите остаток $r = y - \hat y$. Проверьте, что он перпендикулярен обоим столбцам $X$, а значит, сумма остатков равна нулю. Раз $\hat y \perp r$, длины складываются по Пифагору: $\lVert y \rVert^2 = \lVert \hat y \rVert^2 + \lVert r \rVert^2$.

# %%
# BEGIN SOLUTION
y_hat = X @ theta
r = y - y_hat
# END SOLUTION

check.close(X.T @ r, np.zeros(2), name="Xᵀr", atol=1e-9)
check.close(r.sum(), 0.0, name="сумма остатков", atol=1e-9)
check.close(y @ y, y_hat @ y_hat + r @ r, name="‖y‖² = ‖ŷ‖² + ‖r‖²")
check.passed()

# %% [markdown]
# ## Задание 5. Зависимые признаки
#
# Добавим третий столбец — ту же площадь в квадратных футах ($1$ м² $= 10.764$ фут²). Столбцы стали зависимы: ранг $X_3$ меньше числа столбцов, $X_3^\top X_3$ вырождена, и у нормальных уравнений бесконечно много решений.
#
# 1. Найдите `theta_pinv` — решение наименьшей нормы через `np.linalg.pinv` (урок I.11).
# 2. Найдите любое другое решение `theta_other`: возьмите $\hat\theta$ из задания 2 и допишите ноль для третьего признака.
#
# Проверка убедится, что оба дают те же предсказания, что и $X\hat\theta$, а `theta_pinv` короче.

# %%
X3 = np.column_stack([X, 10.764 * area])
print("ранг X3:", np.linalg.matrix_rank(X3), " число обусловленности X3ᵀX3:", f"{np.linalg.cond(X3.T @ X3):.1e}")

# BEGIN SOLUTION
theta_pinv = np.linalg.pinv(X3) @ y
theta_other = np.append(theta, 0.0)
# END SOLUTION

check.shape(theta_pinv, (3,), name="theta_pinv")
check.close(X3 @ theta_pinv, y_hat, name="предсказания theta_pinv", atol=1e-8)
check.close(X3 @ theta_other, y_hat, name="предсказания theta_other", atol=1e-8)
check.close(theta_pinv, np.linalg.lstsq(X3, y, rcond=None)[0], name="theta_pinv против lstsq")
assert np.linalg.norm(theta_pinv) < np.linalg.norm(theta_other), "решение наименьшей нормы должно быть короче"
print("θ⁺ =", theta_pinv.round(4), " ‖θ⁺‖ =", np.linalg.norm(theta_pinv).round(4), " ‖θ_other‖ =", np.linalg.norm(theta_other).round(4))
check.passed()

# %% [markdown]
# **Вопрос для самопроверки.** Почему предсказания не изменились, хотя весов стало бесконечно много? Подсказка: пространство столбцов $X_3$ — то же, что у $X$, а проекция на подпространство единственна. И почему `pinv` делит вес площади между вторым и третьим столбцами в отношении $1 : 10.764$?

# %% [markdown]
# ## Задание 6. Исследование: почему `lstsq`, а не нормальные уравнения
#
# Сравните число обусловленности $X$ и $X^\top X$. Оно показывает, во сколько раз ошибка в данных может вырасти в ответе. Сингулярные числа $X^\top X$ — квадраты сингулярных чисел $X$ (урок I.11): что это значит для обусловленности? Попробуйте сдвинуть площадь к нулю (`area - area.mean()`) и посмотрите, как изменятся оба числа.

# %%
print(f"cond X = {np.linalg.cond(X):.1f}, cond XᵀX = {np.linalg.cond(X.T @ X):.1f}")
Xc = np.column_stack([np.ones(area.size), area - area.mean()])
print(f"после центрирования: cond X = {np.linalg.cond(Xc):.1f}, cond XᵀX = {np.linalg.cond(Xc.T @ Xc):.1f}")

# %% [markdown]
# **Вопрос для самопроверки.** Во сколько раз $\operatorname{cond}(X^\top X)$ больше $\operatorname{cond}(X)$ и почему `lstsq`, работающая с самой $X$ через QR или SVD, точнее нормальных уравнений? Что дальше: в модуле II тот же $\hat\theta$ получится как минимум функции $J(\theta) = \tfrac12 \lVert X\theta - y \rVert^2$ — через градиент.
