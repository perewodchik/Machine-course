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
# # Лабораторная: ЦПТ на симуляциях
#
# Урок III.8 «Предельные теоремы и метод Монте-Карло». Около 50 минут.
#
# [Открыть в Colab](https://colab.research.google.com/github/perewodchik/Machine-course/blob/main/notebooks/prob/clt_simulations.ipynb)
#
# **После лабораторной вы умеете:**
# - проверять на симуляции, что $\operatorname{Var} \bar X = \sigma^2/n$;
# - видеть закон больших чисел в бегущем среднем;
# - измерять, насколько стандартизованная сумма близка к $\mathcal{N}(0, 1)$;
# - находить, где предельные теоремы не работают (распределение Коши);
# - строить доверительный интервал для среднего и проверять его покрытие.

# %%
# Настройка: пакет курса с проверками. Локально и в CI он уже установлен, в Colab ставится из GitHub.
try:
    from mlf import check
except ImportError:
    # %pip install -q "mlf @ git+https://github.com/perewodchik/Machine-course#subdirectory=code"
    from mlf import check
import numpy as np

rng = np.random.default_rng(2026)

# %% [markdown]
# ## Задание 1. Дисперсия выборочного среднего
#
# Напишите `sample_means(draw, n, reps)`: `draw(size=…)` возвращает массив независимых значений; функция делает `reps` выборок по `n` значений и возвращает массив `reps` средних. Без циклов: одна матрица `reps × n` и среднее по строкам. Проверка сравнит дисперсию средних равномерного на $[0, 1]$ с формулой урока $\sigma^2/n$, $\sigma^2 = 1/12$.

# %%
def sample_means(draw, n, reps):
    # BEGIN SOLUTION
    return draw(size=(reps, n)).mean(axis=1)
    # END SOLUTION


means = sample_means(rng.uniform, 25, 20_000)
check.shape(means, (20_000,), name="средние")
check.close(means.var(), 1 / 12 / 25, name="Var X̄ против σ²/n", rtol=0.05)
print(f"Var X̄ = {means.var():.5f}, σ²/n = {1 / 12 / 25:.5f}")
check.passed()

# %% [markdown]
# ## Задание 2. Закон больших чисел
#
# Напишите `running_mean(x)` — массив бегущих средних $m_k = (x_1 + \cdots + x_k)/k$ той же длины, что `x` (подсказка: `np.cumsum`). Проверка бросит кубик $10\,000$ раз и убедится, что последнее среднее не дальше $4\sigma/\sqrt{n}$ от $3.5$.

# %%
def running_mean(x):
    # BEGIN SOLUTION
    return np.cumsum(x) / np.arange(1, len(x) + 1)
    # END SOLUTION


dice = rng.integers(1, 7, size=10_000)
m = running_mean(dice)
check.close(m[:3], [dice[0], dice[:2].mean(), dice[:3].mean()], name="первые бегущие средние")
assert abs(m[-1] - 3.5) < 4 * np.sqrt(35 / 12) / 100, f"m_n = {m[-1]:.4f} слишком далеко от 3.5"
for k in (10, 100, 1000, 10_000):
    print(f"k = {k:>5}: m_k = {m[k - 1]:.4f}, ошибка {abs(m[k - 1] - 3.5):.4f}, σ/√k = {np.sqrt(35 / 12 / k):.4f}")
check.passed()

# %% [markdown]
# ## Задание 3. Центральная предельная теорема
#
# Напишите `inside_one(draw, k, mu, sigma, reps)`: `reps` раз сложить `k` независимых значений, стандартизовать сумму $Z = (S_k - k\mu)/(\sigma\sqrt{k})$ и вернуть долю $\lvert Z \rvert \le 1$. У $\mathcal{N}(0, 1)$ эта доля — $0.683$. Проверка: у суммы $30$ показательных величин доля отличается от $0.683$ меньше чем на $0.02$, а у одной — больше чем на $0.1$.

# %%
def inside_one(draw, k, mu, sigma, reps=50_000):
    # BEGIN SOLUTION
    s = draw(size=(reps, k)).sum(axis=1)
    z = (s - k * mu) / (sigma * np.sqrt(k))
    return np.mean(np.abs(z) <= 1)
    # END SOLUTION


for k in (1, 2, 5, 30):
    print(f"показательное, k = {k:>2}: P(|Z| ≤ 1) ≈ {inside_one(rng.exponential, k, 1, 1):.3f}")
check.close(inside_one(rng.exponential, 30, 1, 1), 0.683, name="k = 30", atol=0.02)
assert abs(inside_one(rng.exponential, 1, 1, 1) - 0.683) > 0.1, "одна показательная величина не нормальна"
check.passed()

# %% [markdown]
# **Вопрос для самопроверки.** Повторите для равномерного ($\mu = 1/2$, $\sigma^2 = 1/12$) и Бернулли с $\varphi = 0.05$. Какому распределению нужно больше слагаемых, чтобы сумма стала похожа на нормальную, и почему? Подсказка: посмотрите на симметрию и на то, как часто слагаемое отличается от нуля.

# %% [markdown]
# ## Задание 4. Где ЦПТ ломается
#
# У распределения Коши (`rng.standard_cauchy`) нет ни матожидания, ни дисперсии — условия теорем не выполнены. Посчитайте `iqr(n)` — межквартильный размах (`np.percentile(…, 75) − np.percentile(…, 25)`) $5000$ средних по $n$ значениям. У распределения с конечной дисперсией он падал бы как $1/\sqrt{n}$. Проверка: у Коши при $n = 1000$ размах не меньше, чем при $n = 10$, с точностью $25\,\%$.

# %%
def iqr(n, reps=5000):
    # BEGIN SOLUTION
    means = sample_means(rng.standard_cauchy, n, reps)
    return np.percentile(means, 75) - np.percentile(means, 25)
    # END SOLUTION


small, big = iqr(10), iqr(1000)
print(f"Коши: IQR средних при n = 10 — {small:.2f}, при n = 1000 — {big:.2f}")
assert big > 0.75 * small, "у Коши среднее не должно сужаться"
check.passed()

# %% [markdown]
# **Вопрос для самопроверки.** Среднее $n$ величин Коши — снова Коши с тем же масштабом. Почему это не противоречит закону больших чисел? Какое условие теоремы нарушено?

# %% [markdown]
# ## Задание 5. Доверительный интервал для среднего
#
# По ЦПТ $\bar X$ приближённо $\mathcal{N}(\mu, \sigma^2/n)$, поэтому интервал $\bar x \pm 1.96\, s/\sqrt{n}$ накрывает $\mu$ примерно в $95\,\%$ выборок; $s$ — выборочное стандартное отклонение. Напишите `coverage(draw, mu, n, reps)` — долю из `reps` выборок, интервал которых накрыл $\mu$. Проверка: у показательных выборок по $n = 50$ покрытие между $0.90$ и $0.97$.

# %%
def coverage(draw, mu, n, reps=10_000):
    # BEGIN SOLUTION
    x = draw(size=(reps, n))
    xbar = x.mean(axis=1)
    half = 1.96 * x.std(axis=1, ddof=1) / np.sqrt(n)
    return np.mean(np.abs(xbar - mu) <= half)
    # END SOLUTION


c50, c5 = coverage(rng.exponential, 1, 50), coverage(rng.exponential, 1, 5)
print(f"покрытие: n = 50 — {c50:.3f}, n = 5 — {c5:.3f}")
assert 0.90 <= c50 <= 0.97, f"покрытие {c50:.3f}"
check.passed()

# %% [markdown]
# **Вопрос для самопроверки.** При $n = 5$ покрытие заметно ниже $95\,\%$. Какие два приближения в интервале $\bar x \pm 1.96\, s/\sqrt{n}$ хуже всего работают на малых выборках? Как это связано с перекосом показательного распределения?
