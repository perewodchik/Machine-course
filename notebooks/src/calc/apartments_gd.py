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
# # Лабораторная: Квартиры — GD, SGD и нормальные уравнения
#
# Урок II.6 «Градиентный спуск и SGD», капстоун модуля II. Около 60 минут.
#
# [Открыть в Colab](https://colab.research.google.com/github/perewodchik/Machine-course/blob/main/notebooks/calc/apartments_gd.ipynb)
#
# **После лабораторной вы умеете:**
# - писать градиент функции потерь МНК и проверять его конечными разностями;
# - реализовывать полный градиентный спуск и находить порог шага $2/\lambda_{\max}$;
# - реализовывать стохастический и мини-батч спуск и сравнивать их с полным;
# - объяснять, зачем стандартизуют признаки, через число обусловленности.

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
# «Квартиры» из уроков 0.1 и I.12: площадь шестнадцати квартир, м², и цена, млн ₽. Площадь стандартизована: $z = (x - \bar x)/s$, у неё среднее $0$ и разброс $1$. Функция потерь — средний квадрат ошибки пополам, $J(\theta) = \frac{1}{2n} \lVert X\theta - y \rVert^2$, — та же, что в CS229, только поделена на $n$: так шаг не зависит от размера выборки. В ячейке уже есть `J` и эталонный `grad`.

# %%
# snippet: calculus/gd.py#data

theta_star = np.linalg.solve(X.T @ X, X.T @ y)  # ответ нормальных уравнений (урок I.12)
print("X:", X.shape, " θ* =", theta_star.round(3))

# %% [markdown]
# ## Задание 1. Градиент
#
# Напишите `my_grad(theta)` — градиент $J$: $\nabla J = \frac1n X^\top (X\theta - y)$ (урок II.3). Проверка сравнит его с конечными разностями в случайной точке.

# %%
def my_grad(theta):
    # BEGIN SOLUTION
    return X.T @ (X @ theta - y) / n
    # END SOLUTION


t = np.array([3.0, -1.0])
h = 1e-6
numeric = np.array([(J(t + h * e) - J(t - h * e)) / (2 * h) for e in np.eye(2)])
check.shape(my_grad(t), (2,), name="∇J")
check.close(my_grad(t), numeric, name="∇J против конечных разностей", rtol=1e-5)
check.passed()

# %% [markdown]
# ## Задание 2. Полный градиентный спуск
#
# Напишите `gd(eta, steps)`: старт в $\theta = 0$, шаг $\theta := \theta - \eta \nabla J(\theta)$, возвращает последний $\theta$ и список значений $J$ после каждого шага (`history`, длина `steps + 1` вместе со стартом). При $\eta = 0.5$ за $40$ шагов спуск должен прийти к ответу нормальных уравнений.

# %%
def gd(eta, steps):
    theta = np.zeros(2)
    history = [J(theta)]
    # BEGIN SOLUTION
    for _ in range(steps):
        theta = theta - eta * my_grad(theta)
        history.append(J(theta))
    # END SOLUTION
    return theta, history


theta, history = gd(0.5, 40)
check.close(len(history), 41, name="длина history")
check.close(theta, theta_star, name="θ после 40 шагов", atol=1e-6)
assert all(a >= b - 1e-12 for a, b in zip(history, history[1:])), "полный спуск с малым шагом не должен увеличивать J"
check.passed()

# %% [markdown]
# ## Задание 3. Порог шага
#
# Гессиан $J$ — постоянная матрица $H = \frac1n X^\top X$. Спуск сходится при $0 < \eta < 2/\lambda_{\max}(H)$ (урок II.6, формула 1). Найдите порог `eta_max` через `np.linalg.eigvalsh`. Проверка запустит спуск чуть ниже и чуть выше порога.

# %%
# BEGIN SOLUTION
H = X.T @ X / n
eta_max = 2 / np.linalg.eigvalsh(H)[-1]
# END SOLUTION

below, _ = gd(0.95 * eta_max, 300)
above, _ = gd(1.05 * eta_max, 300)
check.close(eta_max, 2.0, name="порог 2/λ_max")
check.close(below, theta_star, name="θ при η = 0.95 · порог", atol=1e-6)
assert np.linalg.norm(above) > 1e3, "выше порога спуск должен уходить"
print("порог:", eta_max, " выше порога ‖θ‖ =", f"{np.linalg.norm(above):.1e}")
check.passed()

# %% [markdown]
# **Вопрос для самопроверки.** У стандартизованных данных $H = I$, и при $\eta = 1$ спуск приходит к ответу за один шаг. Почему? Подсказка: шаг умножает ошибку $\theta - \theta^\star$ на $I - \eta H$.

# %% [markdown]
# ## Задание 4. Стохастический спуск
#
# В SGD градиент считают по одному объекту: $g_i = (\theta^\top x^{(i)} - y^{(i)})\, x^{(i)}$ (CS229, «Linear regression», stochastic gradient descent). Эпоха — проход по всем объектам в случайном порядке. Напишите `sgd(eta, epochs, seed)`: возвращает $\theta$ и значения $J$ после каждого шага по объекту.

# %%
def sgd(eta, epochs, seed=0):
    rng = np.random.default_rng(seed)
    theta = np.zeros(2)
    history = [J(theta)]
    # BEGIN SOLUTION
    for _ in range(epochs):
        for i in rng.permutation(n):
            theta = theta - eta * (X[i] @ theta - y[i]) * X[i]
            history.append(J(theta))
    # END SOLUTION
    return theta, history


theta_sgd, hist_sgd = sgd(0.05, 30)
check.close(len(hist_sgd), 30 * n + 1, name="длина history")
check.close(theta_sgd, theta_star, name="θ после 30 эпох SGD", atol=0.15)
ups = sum(b > a for a, b in zip(hist_sgd, hist_sgd[1:]))
print("шагов:", len(hist_sgd) - 1, " J выросла на", ups, "из них")
assert ups > 0, "у SGD отдельные шаги иногда увеличивают J"
check.passed()

# %% [markdown]
# **Вопрос для самопроверки.** Треть шагов SGD увеличивает $J$. Почему спуск всё равно приходит к ответу и почему о нём нельзя судить по одному шагу?

# %% [markdown]
# ## Задание 5. Мини-батч
#
# Компромисс между полным и стохастическим спуском: градиент по $b$ объектам, $g_B = \frac1b \sum_{i \in B} (\theta^\top x^{(i)} - y^{(i)})\, x^{(i)}$. Напишите `minibatch(eta, epochs, b, seed)` — эпоха делит перестановку объектов на батчи по $b$. При $b = 4$ и $\eta = 0.2$ за $30$ эпох $J$ должна быть не больше чем на $1\,\%$ выше минимума.

# %%
def minibatch(eta, epochs, b, seed=0):
    rng = np.random.default_rng(seed)
    theta = np.zeros(2)
    history = [J(theta)]
    # BEGIN SOLUTION
    for _ in range(epochs):
        idx = rng.permutation(n)
        for k in range(0, n, b):
            B = idx[k : k + b]
            theta = theta - eta * X[B].T @ (X[B] @ theta - y[B]) / len(B)
            history.append(J(theta))
    # END SOLUTION
    return theta, history


theta_mb, hist_mb = minibatch(0.2, 30, 4)
check.close(len(hist_mb), 30 * (n // 4) + 1, name="длина history")
assert J(theta_mb) <= 1.01 * J(theta_star), f"J = {J(theta_mb):.4f}, минимум {J(theta_star):.4f}"
print(f"J мини-батч = {J(theta_mb):.4f}, минимум = {J(theta_star):.4f}")
check.passed()

# %% [markdown]
# ## Задание 6. Исследование: зачем стандартизовать
#
# Повторите спуск на площади в м² — без стандартизации. Найдите порог и число обусловленности $\lambda_{\max}/\lambda_{\min}$ матрицы $\frac1n X_{\text{raw}}^\top X_{\text{raw}}$ и посмотрите, далеко ли спуск ушёл за $2000$ шагов с шагом $0.9$ от порога.

# %%
X_raw = np.column_stack([np.ones(n), area])
lam = np.linalg.eigvalsh(X_raw.T @ X_raw / n)
print(f"порог η < {2 / lam[-1]:.2g}, обусловленность {lam[-1] / lam[0]:.0f}")
theta_raw = np.zeros(2)
for _ in range(2000):
    theta_raw = theta_raw - 0.9 * (2 / lam[-1]) * X_raw.T @ (X_raw @ theta_raw - y) / n
print("θ_raw после 2000 шагов:", theta_raw.round(3), " ответ:", np.linalg.lstsq(X_raw, y, rcond=None)[0].round(3))

# %% [markdown]
# **Вопрос для самопроверки.** Какой из весов спуск нашёл почти сразу, а какой не нашёл за $2000$ шагов? Свяжите ответ с собственными векторами $H$: вдоль какого направления множитель $1 - \eta\lambda_{\min}$ почти равен $1$? И как пересчитать веса стандартизованной модели обратно в «млн ₽ за м²»?
