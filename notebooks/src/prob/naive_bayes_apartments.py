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
# # Лабораторная: наивный Байес на «Квартирах»
#
# Капстоун модуля III «Вероятность». Уроки III.2, III.3, III.12 и III.13. Около 60 минут.
#
# [Открыть в Colab](https://colab.research.google.com/github/perewodchik/Machine-course/blob/main/notebooks/prob/naive_bayes_apartments.ipynb)
#
# **После лабораторной вы умеете:**
# - оценивать параметры наивного Байеса максимумом правдоподобия — долями;
# - предсказывать класс через сумму логарифмов, а не произведение вероятностей;
# - объяснять и исправлять нулевые оценки сглаживанием Лапласа;
# - сравнивать модели по кросс-энтропии на отложенной выборке;
# - находить информативные признаки через KL-дивергенцию.

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
# $600$ объявлений о продаже квартир. Признаки — есть ли в тексте каждое из семи слов: $x_j^{(i)} \in \{0, 1\}$. Метка $y^{(i)} = 1$, если квартира продалась за неделю. Первые $400$ объявлений — обучающая выборка, остальные $200$ — отложенная.
#
# Модель (CS229, «Generative learning algorithms», «Naive Bayes»): $y \sim \operatorname{Bernoulli}(\phi_y)$, и при известном $y$ слова **условно независимы** (урок III.2): $p(x \mid y) = \prod_j p(x_j \mid y)$, $x_j \mid y \sim \operatorname{Bernoulli}(\phi_{j \mid y})$.

# %%
# snippet: prob/naive_bayes.py#data

print("слова:", WORDS)
print("X_train:", X_train.shape, " доля проданных:", y_train.mean())

# %% [markdown]
# ## Задание 1. Оценки максимального правдоподобия
#
# Напишите `fit(X, y, alpha=0)`: возвращает `phi_y` — долю $y = 1$, и два вектора длины $7$: `phi1[j]` — долю объявлений со словом $j$ среди $y = 1$, `phi0[j]` — среди $y = 0$. Параметр `alpha` пока равен нулю (задание 4). Это максимум правдоподобия: для Бернулли оценка — доля (урок II.8).

# %%
def fit(X, y, alpha=0.0):
    # BEGIN SOLUTION
    phi_y = y.mean()
    phi1 = (X[y == 1].sum(axis=0) + alpha) / ((y == 1).sum() + 2 * alpha)
    phi0 = (X[y == 0].sum(axis=0) + alpha) / ((y == 0).sum() + 2 * alpha)
    return phi_y, phi1, phi0
    # END SOLUTION


phi_y, phi1, phi0 = fit(X_train, y_train)
check.shape(phi1, (7,), name="phi1")
check.close(phi_y, 0.3375, name="phi_y")
check.close(phi1[0], np.mean(X_train[y_train == 1, 0]), name="phi1 для «метро»")
for w, a, b in zip(WORDS, phi1, phi0):
    print(f"{w:>15}: P(слово | продалась) = {a:.3f}, P(слово | нет) = {b:.3f}")
check.passed()

# %% [markdown]
# ## Задание 2. Предсказание через логарифмы
#
# Апостериорная вероятность по формуле Байеса (урок III.3):
# $$P(y = 1 \mid x) = \frac{\phi_y \prod_j p(x_j \mid 1)}{\phi_y \prod_j p(x_j \mid 1) + (1 - \phi_y) \prod_j p(x_j \mid 0)} .$$
# Произведение многих вероятностей уходит в машинный ноль, поэтому считают логарифмы: $a_c = \log P(y = c) + \sum_j \log p(x_j \mid c)$, и $P(y = 1 \mid x) = 1 / (1 + e^{a_0 - a_1})$ — та же сигмоида, что в логистической регрессии.
#
# Напишите `log_joint(X, phi_y, phi1, phi0)` — массив `n × 2` со столбцами $a_0$ и $a_1$, и `predict_proba` — вектор $P(y = 1 \mid x^{(i)})$. Используйте `np.errstate(divide="ignore")`: логарифм нуля пусть будет $-\infty$. Осторожно: `X @ np.log(phi)` при нулевой оценке даст $0 \cdot (-\infty) = $ `nan` — берите `np.where`.

# %%
def log_joint(X, phi_y, phi1, phi0):
    # BEGIN SOLUTION
    with np.errstate(divide="ignore"):
        # np.where, а не X @ log(phi): при phi = 0 произведение 0 · (−∞) дало бы nan
        a1 = np.log(phi_y) + np.sum(np.where(X == 1, np.log(phi1), np.log(1 - phi1)), axis=1)
        a0 = np.log(1 - phi_y) + np.sum(np.where(X == 1, np.log(phi0), np.log(1 - phi0)), axis=1)
    return np.column_stack([a0, a1])
    # END SOLUTION


def predict_proba(X, phi_y, phi1, phi0):
    a = log_joint(X, phi_y, phi1, phi0)
    # BEGIN SOLUTION
    with np.errstate(over="ignore", invalid="ignore"):
        return 1 / (1 + np.exp(a[:, 0] - a[:, 1]))
    # END SOLUTION


x = X_test[:1]
direct = phi_y * np.prod(np.where(x == 1, phi1, 1 - phi1)) / (phi_y * np.prod(np.where(x == 1, phi1, 1 - phi1)) + (1 - phi_y) * np.prod(np.where(x == 1, phi0, 1 - phi0)))
check.shape(log_joint(X_test, phi_y, phi1, phi0), (200, 2), name="log_joint")
check.close(predict_proba(x, phi_y, phi1, phi0)[0], direct, name="P(y = 1 | x) против прямой формулы")
check.passed()

# %% [markdown]
# ## Задание 3. Точность и нулевая оценка
#
# Посчитайте `accuracy` — долю верных ответов на отложенной выборке при пороге $0.5$, и `baseline` — точность константы «не продастся». Посмотрите на объявления со словом «аукцион».

# %%
proba = predict_proba(X_test, phi_y, phi1, phi0)
# BEGIN SOLUTION
accuracy = np.mean((proba >= 0.5) == y_test)
baseline = np.mean(y_test == 0)
# END SOLUTION
print(f"точность {accuracy:.3f}, константа {baseline:.3f}")
auction = WORDS.index("аукцион")
print("P(y = 1 | x) у объявлений с «аукционом»:", proba[X_test[:, auction] == 1].round(3))
assert accuracy > baseline, "модель должна быть лучше константы"
check.passed()

# %% [markdown]
# **Вопрос для самопроверки.** Почему у всех объявлений со словом «аукцион» вероятность продажи ровно $0$, какие бы другие слова в них ни были? Что в обучающей выборке привело к `phi1[6] = 0`, и разумно ли из одной ненаблюдавшейся комбинации делать вывод «никогда»?

# %% [markdown]
# ## Задание 4. Сглаживание Лапласа
#
# Добавьте к каждому счётчику $\alpha$: $\hat\phi_{j \mid y} = \dfrac{\#\{x_j = 1, y\} + \alpha}{\#\{y\} + 2\alpha}$. При $\alpha = 1$ это **сглаживание Лапласа** — максимум апостериорной плотности с априорным $\operatorname{Beta}(2, 2)$ (уроки III.7 и IV.6). Допишите `fit` выше так, чтобы он учитывал `alpha`, и проверьте: ни одна оценка не равна $0$ или $1$, а вероятности у объявлений с «аукционом» стали осмысленными.

# %%
s_phi_y, s_phi1, s_phi0 = fit(X_train, y_train, alpha=1.0)
assert np.all((s_phi1 > 0) & (s_phi1 < 1)) and np.all((s_phi0 > 0) & (s_phi0 < 1)), "после сглаживания оценки строго между 0 и 1"
check.close(s_phi1[auction], 1 / (np.sum(y_train == 1) + 2), name="phi1 для «аукциона» после сглаживания")
s_proba = predict_proba(X_test, s_phi_y, s_phi1, s_phi0)
print("с «аукционом» после сглаживания:", s_proba[X_test[:, auction] == 1].round(3))
check.passed()

# %% [markdown]
# ## Задание 5. Кросс-энтропия на отложенной выборке
#
# Точность не видит уверенности. Напишите `log_loss(y, p)` — среднюю кросс-энтропию $-\frac1n \sum_i \bigl(y^{(i)} \ln p^{(i)} + (1 - y^{(i)}) \ln (1 - p^{(i)})\bigr)$ (урок III.13). Сравните три модели: без сглаживания, со сглаживанием и константу $p^{(i)} = \hat\phi_y$ — у константы кросс-энтропия равна кросс-энтропии меток и доли $\hat\phi_y$.

# %%
def log_loss(y, p):
    # BEGIN SOLUTION
    with np.errstate(divide="ignore", invalid="ignore"):
        return -np.mean(np.where(y == 1, np.log(p), np.log(1 - p)))
    # END SOLUTION


raw, smooth, const = log_loss(y_test, proba), log_loss(y_test, s_proba), log_loss(y_test, np.full(200, s_phi_y))
print(f"log loss: без сглаживания {raw}, со сглаживанием {smooth:.4f}, константа {const:.4f}")
assert np.isinf(raw) or raw > smooth, "нулевая вероятность у реального события даёт бесконечную потерю"
assert smooth < const, "модель должна быть лучше константы и по кросс-энтропии"
check.passed()

# %% [markdown]
# ## Задание 6. Какие слова информативны
#
# Слово полезно, если его распределение у проданных и непроданных разное. Меру даёт KL-дивергенция двух Бернулли: $D_{KL}\bigl(\operatorname{Bern}(\phi_{j \mid 1}) \,\Vert\, \operatorname{Bern}(\phi_{j \mid 0})\bigr)$. Посчитайте её для каждого слова по сглаженным оценкам и найдите самое и наименее информативное.

# %%
# BEGIN SOLUTION
kl = s_phi1 * np.log(s_phi1 / s_phi0) + (1 - s_phi1) * np.log((1 - s_phi1) / (1 - s_phi0))
# END SOLUTION
order = np.argsort(kl)[::-1]
for j in order:
    print(f"{WORDS[j]:>15}: KL = {kl[j]:.4f}")
assert WORDS[order[0]] == "срочно", f"самое информативное слово — не {WORDS[order[0]]!r}"
assert WORDS[order[-1]] == "новостройка", f"наименее информативное — не {WORDS[order[-1]]!r}"
check.passed()

# %% [markdown]
# **Вопрос для самопроверки.** «Новостройка» встречается в $30\,\%$ объявлений обоих классов. Почему её KL почти ноль и почему её можно выбросить из модели без потерь? И почему наивный Байес, вопреки названию, неплохо работает, даже когда слова на самом деле зависимы?
