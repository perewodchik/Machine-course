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
# # Лабораторная: MLE своими руками
#
# Урок IV.3 «Метод максимального правдоподобия». Около 50 минут.
#
# [Открыть в Colab](https://colab.research.google.com/github/perewodchik/Machine-course/blob/main/notebooks/stats/mle_by_hand.ipynb)
#
# **После лабораторной вы умеете:**
# - писать логарифм правдоподобия выборки векторно, без циклов;
# - находить максимум ℓ перебором и градиентным подъёмом и сверять с формулой;
# - выводить MLE нормального распределения и видеть, что дисперсия делится на $n$;
# - получать МНК линейной регрессии как максимум условного правдоподобия с нормальным шумом.

# %%
# Настройка: пакет курса с проверками и данными. Локально и в CI он уже установлен, в Colab ставится из GitHub.
try:
    from mlf import check
except ImportError:
    # %pip install -q "mlf @ git+https://github.com/perewodchik/Machine-course#subdirectory=code"
    from mlf import check
from mlf.datasets import apartments
import numpy as np

rng = np.random.default_rng(2026)
calls = rng.poisson(2.4, size=200)  # звонки за минуту в 200 разных минут
print("первые звонки:", calls[:12], " среднее:", calls.mean())

# %% [markdown]
# ## Задание 1. Логарифм правдоподобия Пуассона
#
# Напишите `log_lik(lam, x)` — $\ell(\lambda) = \sum_i \bigl(x^{(i)} \log \lambda - \lambda - \log x^{(i)}!\bigr)$. Логарифм факториала — `np.sum(np.log(np.arange(1, k + 1)))`; удобнее заранее посчитать вектор $\log x^{(i)}!$ для всей выборки. Проверка сравнит с прямым произведением вероятностей на маленькой выборке, где оно ещё не ушло в ноль.

# %%
def log_lik(lam, x):
    # BEGIN SOLUTION
    log_fact = np.array([np.sum(np.log(np.arange(1, k + 1))) for k in x])
    return np.sum(x * np.log(lam) - lam - log_fact)
    # END SOLUTION


small = calls[:8]
direct = np.prod([np.exp(-1.7) * 1.7**k / np.prod(np.arange(1, k + 1)) for k in small])
check.close(log_lik(1.7, small), np.log(direct), name="ℓ(1.7) на восьми наблюдениях")
print("ℓ(2.4) на всей выборке:", log_lik(2.4, calls).round(3))
check.passed()

# %% [markdown]
# ## Задание 2. Максимум перебором
#
# Посчитайте `ell` — значения `log_lik` на сетке `grid` и найдите `lam_grid` — точку сетки с наибольшим $\ell$. Сравните с формулой $\hat\lambda = \bar x$ (урок IV.3, формула 1).

# %%
grid = np.arange(0.5, 6.0, 0.005)
# BEGIN SOLUTION
ell = np.array([log_lik(lam, calls) for lam in grid])
lam_grid = grid[np.argmax(ell)]
# END SOLUTION
check.close(lam_grid, calls.mean(), name="максимум на сетке против x̄", atol=0.005)
print("перебор:", lam_grid.round(3), " формула:", calls.mean())
check.passed()

# %% [markdown]
# ## Задание 3. Градиентный подъём
#
# Перебор не работает, когда параметров много. Напишите `ascend(x, lam0, eta, steps)`: подъём по среднему градиенту $\frac1n \ell'(\lambda) = \bar x/\lambda - 1$, шаг $\lambda := \lambda + \eta \cdot (\bar x/\lambda - 1)$ (урок II.6 — тот же спуск, только к максимуму). Из $\lambda_0 = 0.5$ с $\eta = 0.5$ за $100$ шагов подъём должен прийти к $\bar x$.

# %%
def ascend(x, lam0, eta, steps):
    lam = lam0
    # BEGIN SOLUTION
    m = x.mean()
    for _ in range(steps):
        lam = lam + eta * (m / lam - 1)
    # END SOLUTION
    return lam


check.close(ascend(calls, 0.5, 0.5, 100), calls.mean(), name="градиентный подъём", atol=1e-6)
check.passed()

# %% [markdown]
# **Вопрос для самопроверки.** Почему для Пуассона подъём не нужен, а для логистической регрессии (лабораторная урока IV.5) — нужен? Подсказка: можно ли решить уравнение $\ell'(\theta) = 0$ в явном виде?

# %% [markdown]
# ## Задание 4. MLE нормального распределения
#
# Цены «Квартир» (урок 0.1) считаем выборкой из $\mathcal{N}(\mu, \sigma^2)$. Найдите `mu_hat` и `var_hat` — оценки максимального правдоподобия (урок IV.3, формула 2), — и `s2` — несмещённую оценку дисперсии. Какую из двух даёт `np.var` по умолчанию?

# %%
area, price = apartments()
# BEGIN SOLUTION
mu_hat = price.mean()
var_hat = np.mean((price - mu_hat) ** 2)
s2 = np.sum((price - mu_hat) ** 2) / (len(price) - 1)
# END SOLUTION
check.close(var_hat, np.var(price), name="MLE дисперсии против np.var")
check.close(s2 * (len(price) - 1) / len(price), var_hat, name="связь s² и MLE")
print(f"μ̂ = {mu_hat:.3f}, σ̂² (MLE) = {var_hat:.3f}, s² = {s2:.3f}")
check.passed()

# %% [markdown]
# ## Задание 5. МНК как максимум правдоподобия
#
# Линейная регрессия в CS229 («Linear regression», «Probabilistic interpretation»): $y^{(i)} = \theta^\top x^{(i)} + \epsilon^{(i)}$, шум $\epsilon^{(i)} \sim \mathcal{N}(0, \sigma^2)$ независим. Условный логарифм правдоподобия
# $$\ell(\theta) = \sum_i \log p(y^{(i)} \mid x^{(i)}; \theta) = -\frac{n}{2} \log (2\pi\sigma^2) - \frac{1}{2\sigma^2} \sum_i \bigl(y^{(i)} - \theta^\top x^{(i)}\bigr)^2 .$$
# Напишите `cond_log_lik(theta, sigma2)` и найдите `theta_mle` — максимум по $\theta$. Подсказка: максимизировать $\ell$ по $\theta$ — то же, что минимизировать сумму квадратов (нормальные уравнения, урок I.12). Затем найдите `sigma2_mle` — максимум по $\sigma^2$ при найденном $\theta$.

# %%
X = np.column_stack([np.ones_like(area), area])
y = price


def cond_log_lik(theta, sigma2):
    # BEGIN SOLUTION
    r = y - X @ theta
    return -len(y) / 2 * np.log(2 * np.pi * sigma2) - r @ r / (2 * sigma2)
    # END SOLUTION


# BEGIN SOLUTION
theta_mle = np.linalg.solve(X.T @ X, X.T @ y)
sigma2_mle = np.mean((y - X @ theta_mle) ** 2)
# END SOLUTION
check.close(theta_mle, np.linalg.lstsq(X, y, rcond=None)[0], name="θ MLE против МНК")
best = cond_log_lik(theta_mle, sigma2_mle)
for d in (np.array([0.1, 0]), np.array([0, 0.002])):
    assert cond_log_lik(theta_mle + d, sigma2_mle) < best, "сдвиг θ должен уменьшать ℓ"
assert cond_log_lik(theta_mle, 1.2 * sigma2_mle) < best and cond_log_lik(theta_mle, 0.8 * sigma2_mle) < best
print("θ =", theta_mle.round(4), f" σ̂² = {sigma2_mle:.4f}", f" ℓ = {best:.3f}")
check.passed()

# %% [markdown]
# **Вопрос для самопроверки.** Здесь мы максимизировали **условное** правдоподобие $\prod_i p(y^{(i)} \mid x^{(i)}; \theta)$ и ничего не говорили о распределении площадей $x^{(i)}$. Как называется такая модель? А какая модель описывала бы совместное $p(x, y)$, и где в CS229 такие модели встречаются?
