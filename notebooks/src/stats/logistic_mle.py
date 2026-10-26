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
# # Лабораторная: логистическая регрессия как MLE
#
# Капстоун модуля IV «Статистика». Уроки IV.3 и IV.5, II.6 (градиентный спуск), II.7 (метод Ньютона). Около 60 минут.
#
# [Открыть в Colab](https://colab.research.google.com/github/perewodchik/Machine-course/blob/main/notebooks/stats/logistic_mle.ipynb)
#
# **После лабораторной вы умеете:**
# - записывать логарифм правдоподобия логистической регрессии и считать его без переполнения;
# - выводить и проверять градиент $X^\top (y - \sigma(X\theta))$;
# - доказывать вогнутость $\ell$ через гессиан $-X^\top W X$ — то, что даёт экспоненциальное семейство;
# - обучать модель градиентным подъёмом и методом Ньютона и сравнивать их скорость.

# %%
# Настройка: пакет курса с проверками и данными. Локально и в CI он уже установлен, в Colab ставится из GitHub.
try:
    from mlf import check
except ImportError:
    # %pip install -q "mlf @ git+https://github.com/perewodchik/Machine-course#subdirectory=code"
    from mlf import check
from mlf.datasets import apartments
import numpy as np

# %% [markdown]
# ## Данные
#
# $200$ квартир из генератора «Квартир» (урок 0.1). Метка $y^{(i)} = 1$, если квартира дороже $10$ млн ₽. Признак — стандартизованная площадь $z = (x - \bar x)/s$, плюс столбец единиц для свободного члена. Модель (CS229, «Classification and logistic regression»): $y \mid x \sim \operatorname{Bernoulli}(\sigma(\theta^\top x))$. По уроку IV.5 натуральный параметр Бернулли — $\eta = \theta^\top x$, а $\phi = \sigma(\eta)$.

# %%
area, price = apartments(200, seed=7)
y = (price > 10).astype(float)
z = (area - area.mean()) / area.std()
X = np.column_stack([np.ones_like(z), z])
n = len(y)
print("X:", X.shape, " доля дорогих:", y.mean())


def sigmoid(t):
    return 1 / (1 + np.exp(-t))


# %% [markdown]
# ## Задание 1. Логарифм правдоподобия
#
# $\ell(\theta) = \sum_i \bigl(y^{(i)} \log h^{(i)} + (1 - y^{(i)}) \log(1 - h^{(i)})\bigr)$, $h^{(i)} = \sigma(\theta^\top x^{(i)})$. Подставив сигмоиду, получим $\ell(\theta) = \sum_i \bigl(y^{(i)} t_i - \log(1 + e^{t_i})\bigr)$, $t = X\theta$. Напишите `log_lik(theta)` через `np.logaddexp(0, t)` — это $\log(1 + e^t)$ без переполнения при больших $t$.

# %%
def log_lik(theta):
    # BEGIN SOLUTION
    t = X @ theta
    return np.sum(y * t - np.logaddexp(0, t))
    # END SOLUTION


theta_test = np.array([0.3, -1.2])
h = sigmoid(X @ theta_test)
check.close(log_lik(theta_test), np.sum(y * np.log(h) + (1 - y) * np.log(1 - h)), name="ℓ через logaddexp")
print("ℓ при θ = 1000·(1, 1):", log_lik(np.array([1000.0, 1000.0])))  # без logaddexp было бы inf − inf
check.passed()

# %% [markdown]
# ## Задание 2. Градиент
#
# Напишите `grad(theta)` $= X^\top (y - \sigma(X\theta))$ (урок V.2, урок II.3). Проверка сравнит его с конечными разностями.

# %%
def grad(theta):
    # BEGIN SOLUTION
    return X.T @ (y - sigmoid(X @ theta))
    # END SOLUTION


eps = 1e-6
numeric = np.array([(log_lik(theta_test + eps * e) - log_lik(theta_test - eps * e)) / (2 * eps) for e in np.eye(2)])
check.shape(grad(theta_test), (2,), name="∇ℓ")
check.close(grad(theta_test), numeric, name="∇ℓ против конечных разностей", rtol=1e-5)
check.passed()

# %% [markdown]
# ## Задание 3. Вогнутость
#
# Гессиан $\nabla^2 \ell = -X^\top W X$, $W = \operatorname{diag}\bigl(h^{(i)}(1 - h^{(i)})\bigr)$. Множитель $h(1 - h)$ — дисперсия Бернулли, вторая производная $a(\eta)$ (урок IV.5). Напишите `hessian(theta)` и проверьте, что он отрицательно определён в нескольких случайных точках: значит, $\ell$ вогнута, и у неё один максимум.

# %%
def hessian(theta):
    # BEGIN SOLUTION
    h = sigmoid(X @ theta)
    return -(X.T * (h * (1 - h))) @ X
    # END SOLUTION


rng = np.random.default_rng(0)
for th in rng.normal(0, 3, size=(5, 2)):
    assert np.all(np.linalg.eigvalsh(hessian(th)) < 0), "гессиан должен быть отрицательно определён"
numeric_h = np.column_stack([(grad(theta_test + eps * e) - grad(theta_test - eps * e)) / (2 * eps) for e in np.eye(2)])
check.close(hessian(theta_test), numeric_h, name="гессиан против конечных разностей градиента", rtol=1e-4)
check.passed()

# %% [markdown]
# ## Задание 4. Градиентный подъём
#
# Напишите `ascent(eta, steps)`: старт $\theta = 0$, шаг $\theta := \theta + \frac{\eta}{n} \nabla \ell(\theta)$; возвращает $\theta$ и список значений $\ell$. С $\eta = 4$ за $3000$ шагов $\ell$ должна только расти: у стандартизованного признака $\frac1n X^\top X = I$, а $h(1 - h) \le \tfrac14$, поэтому шаг до $8$ безопасен (урок II.6).

# %%
def ascent(eta, steps):
    theta = np.zeros(2)
    history = [log_lik(theta)]
    # BEGIN SOLUTION
    for _ in range(steps):
        theta = theta + eta / n * grad(theta)
        history.append(log_lik(theta))
    # END SOLUTION
    return theta, history


theta_ga, hist_ga = ascent(4.0, 3000)
assert all(b >= a - 1e-12 for a, b in zip(hist_ga, hist_ga[1:])), "ℓ не должна убывать"
print("подъём:", theta_ga.round(4), " ℓ =", round(hist_ga[-1], 4))
check.passed()

# %% [markdown]
# ## Задание 5. Метод Ньютона
#
# Шаг Ньютона (урок II.7): $\theta := \theta - (\nabla^2 \ell)^{-1} \nabla \ell$. Напишите `newton(steps)` со стартом в нуле. Сколько шагов нужно, чтобы норма градиента стала меньше $10^{-10}$? Сравните с подъёмом.

# %%
def newton(steps):
    theta = np.zeros(2)
    norms = []
    # BEGIN SOLUTION
    for _ in range(steps):
        theta = theta - np.linalg.solve(hessian(theta), grad(theta))
        norms.append(np.linalg.norm(grad(theta)))
    # END SOLUTION
    return theta, norms


theta_nt, norms = newton(15)
first = next(i for i, v in enumerate(norms) if v < 1e-10) + 1
print("Ньютон:", theta_nt.round(4), " шагов до ‖∇ℓ‖ < 1e−10:", first)
print("нормы градиента по шагам:", [f"{v:.1e}" for v in norms[:first]])
check.close(theta_nt, theta_ga, name="Ньютон и подъём приходят в одну точку", atol=1e-3)
assert first <= 12, "методу Ньютона хватает десятка шагов: вблизи максимума ошибка возводится в квадрат"
check.passed()

# %% [markdown]
# **Вопрос для самопроверки.** Подъёму понадобились тысячи шагов, Ньютону — несколько. Почему? Чем платит Ньютон за каждый шаг, и почему при $d$ в миллионы признаков его не используют?

# %% [markdown]
# ## Задание 6. Что умеет модель
#
# Найдите `p75` — оценку вероятности, что квартира $75$ м² дороже $10$ млн ₽, `accuracy` — долю верных ответов на обучающей выборке при пороге $0.5$, и `loss` — среднюю кросс-энтропию $-\ell(\hat\theta)/n$. Сравните с константой $\hat\phi = \bar y$: её кросс-энтропия — энтропия доли (урок III.13).

# %%
# BEGIN SOLUTION
p75 = sigmoid(theta_nt @ [1, (75 - area.mean()) / area.std()])
accuracy = np.mean((sigmoid(X @ theta_nt) >= 0.5) == y)
loss = -log_lik(theta_nt) / n
# END SOLUTION
baseline = -(y.mean() * np.log(y.mean()) + (1 - y.mean()) * np.log(1 - y.mean()))
print(f"P(дороже 10 млн | 75 м²) = {p75:.3f}, точность {accuracy:.3f}, кросс-энтропия {loss:.4f}, у константы {baseline:.4f}")
assert 0 < p75 < 1 and loss < baseline
check.passed()
