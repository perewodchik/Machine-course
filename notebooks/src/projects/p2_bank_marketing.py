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
# # Проект P2. Отклик на предложение банка
#
# Курс «Основы ML», после модуля 2. Классификация с редким классом и ценой ошибок: найти утечку, обучить логистическую регрессию с нуля и библиотекой, выбрать регуляризацию честно, поставить порог по прибыли и откалибровать вероятности. 8–10 часов.
#
# [Открыть в Colab](https://colab.research.google.com/github/perewodchik/Machine-course/blob/main/notebooks/projects/p2_bank_marketing.ipynb)
#
# **Данные:** Bank Marketing — 45 211 звонков португальского банка в 2008–2010 годах с предложением срочного вклада; открыли вклад 11.7 %. Moro S., Rita P., Cortez P. Bank Marketing. UCI Machine Learning Repository, 2014, doi:10.24432/C5K306; лицензия CC BY 4.0.
#
# **Задача.** Банк решает, **кому звонить** в следующей кампании. Звонок стоит 5 €, открытый вклад приносит 60 € (наши допущения для проекта). Модель оценивает вероятность отклика до звонка, порог решает, звонить ли.
#
# **После проекта вы умеете:**
# - находить признак, которого нет в момент решения, и стратифицировать разбиение при редком классе;
# - обучать логистическую регрессию методом Ньютона и сверять её с `LogisticRegression`;
# - выбирать регуляризацию кросс-валидацией по PR-AUC, а не по accuracy;
# - ставить порог по ожидаемой прибыли и проверять калибровку вероятностей.
#
# **Правила:** выбор — по обучающей и валидационной частям; тест закрыт и открывается один раз в `P.final`. Проект зачтён, если PR-AUC на закрытой выборке не меньше **0.35** (у случайной модели — 0.117, доля откликов).

# %%
# Настройка: пакет курса с данными и проверками. Локально и в CI он уже установлен, в Colab ставится из GitHub.
try:
    from mlf import check, project
except ImportError:
    # %pip install -q "mlf @ git+https://github.com/perewodchik/Machine-course#subdirectory=code"
    from mlf import check, project
import numpy as np
import sklearn
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold

from mlf.datasets import BANK_COLUMNS, bank_marketing
from mlf.project import average_precision, brier

# с scikit-learn 1.8 тип штрафа задаёт l1_ratio (0 — L2, 1 — L1), параметр penalty устарел
NEW_API = tuple(int(v) for v in sklearn.__version__.split(".")[:2]) >= (1, 8)


def logreg(C, l1=False, **kw):
    """LogisticRegression с L2 или L1 и силой штрафа 1/C — одинаково в старых и новых версиях scikit-learn."""
    if NEW_API:
        return LogisticRegression(C=C, l1_ratio=float(l1), solver="liblinear" if l1 else "lbfgs", **kw)
    return LogisticRegression(C=C, penalty="l1" if l1 else "l2", solver="liblinear" if l1 else "lbfgs", **kw)


# %% [markdown]
# ## Этап 1. Данные и утечка
#
# Посмотрите на столбцы и на долю откликов. Accuracy здесь обманчива: модель «никто не откликнется» права в 88 % случаев.

# %%
b = bank_marketing()
for name, text in BANK_COLUMNS.items():
    print(f"{name:>10}: {text}")
y_all = (b["y"] == "yes").astype(float)
print(f"\n{len(y_all)} звонков, откликов {y_all.mean():.1%}; accuracy модели «никто»: {1 - y_all.mean():.1%}")

# %% [markdown]
# **Разведка.** Доля откликов по квартилям длительности звонка. Почему один этот столбец «предсказывает» так хорошо — и можно ли им пользоваться, когда решаем, кому звонить?

# %%
q = np.quantile(b["duration"], [0.25, 0.5, 0.75])
bins = np.digitize(b["duration"], q)
for k in range(4):
    print(f"длительность, квартиль {k + 1}: откликов {y_all[bins == k].mean():.1%}")

# %% [markdown]
# **1.1.** Выпишите признаки модели: `NUMERIC` и `CATEGORICAL` из столбцов набора, кроме ответа `y`. Проверка знает, какой столбец — утечка, и остановит вас, если он попадёт в модель.

# %%
# BEGIN SOLUTION
NUMERIC = ["age", "balance", "day", "campaign", "pdays", "previous"]
CATEGORICAL = ["job", "marital", "education", "default", "housing", "loan", "contact", "month", "poutcome"]
# END SOLUTION

project.check_features(NUMERIC + CATEGORICAL, {
    "duration": "длительность звонка известна только после звонка, а решаем до него",
    "y": "это ответ",
})
check.passed("Утечки в признаках нет.")

# %% [markdown]
# **1.2.** Разбиение: 60 / 20 / 20, **стратифицированное** — доля откликов во всех частях одна и та же. Тест закрыт.

# %%
rows = np.arange(len(y_all))
(r_tr, y_tr), (r_va, y_va), test = project.split(rows, y_all, seed=2026, stratify=True)
P = project.Project("Отклик на предложение банка", test, metric=average_precision, threshold=0.35, lower_is_better=False)
print(f"доля откликов: обучение {y_tr.mean():.4f}, валидация {y_va.mean():.4f}; тест — {len(test)} звонков (закрыт)")
check.close(y_va.mean(), y_tr.mean(), name="доля откликов на валидации", atol=0.002)
P.stage("данные и утечка")

# %% [markdown]
# ## Этап 2. Логистическая регрессия с нуля
#
# Матрица признаков: числа, индикатор «раньше не звонили» (`pdays = −1`) и one-hot категорий — категории берём из **обучающей** части, первую отбрасываем. Всё стандартизуем по обучающей части; первый столбец — единицы.

# %%
CATS = {c: np.unique(b[c][r_tr]) for c in CATEGORICAL}


def raw_features(r):
    cols = [b[c][r].astype(float) for c in NUMERIC] + [(b["pdays"][r] < 0).astype(float)]
    cols += [(b[c][r][:, None] == CATS[c][None, 1:]).astype(float) for c in CATEGORICAL]
    return np.column_stack(cols)


F_tr = raw_features(r_tr)
mu, sd = F_tr.mean(axis=0), F_tr.std(axis=0)
sd[sd == 0] = 1  # редкая категория могла не попасть в обучение


def design(r):
    return np.column_stack([np.ones(len(r)), (raw_features(r) - mu) / sd])


Z_tr, Z_va = design(r_tr), design(r_va)
print("признаков с единицами:", Z_tr.shape[1])

# %% [markdown]
# **2.1.** Метод Ньютона (урок 1.5) для регуляризованной логистической регрессии:
# $$J(\theta) = -\sum_i \big[y^{(i)} \log h + (1 - y^{(i)}) \log(1 - h)\big] + \tfrac{\lambda}{2}\sum_{j \ge 1} \theta_j^2,\qquad h = g(\theta^\top x^{(i)}).$$
# Свободный член $\theta_0$ не штрафуется — так же, как в `LogisticRegression(C=1/λ)`. Напишите `fit_newton(Z, y, lam, iters=12)`: начиная с нулей, $\theta \leftarrow \theta - H^{-1}\nabla J$; решайте систему, а не обращайте матрицу.

# %%
def sigmoid(t):
    return 1 / (1 + np.exp(-t))


def fit_newton(Z, y, lam, iters=12):
    # BEGIN SOLUTION
    d = Z.shape[1]
    penalty = lam * np.eye(d)
    penalty[0, 0] = 0
    theta = np.zeros(d)
    for _ in range(iters):
        h = sigmoid(Z @ theta)
        g = Z.T @ (h - y) + penalty @ theta
        H = (Z.T * (h * (1 - h))) @ Z + penalty
        theta -= np.linalg.solve(H, g)
    return theta
    # END SOLUTION


lam = 1.0
theta = fit_newton(Z_tr, y_tr, lam)
ref = logreg(C=1 / lam, tol=1e-10, max_iter=10_000).fit(Z_tr[:, 1:], y_tr)
check.close(theta, np.r_[ref.intercept_, ref.coef_.ravel()], name="веса метода Ньютона", rtol=1e-3, atol=1e-3)
ap_newton = average_precision(y_va, Z_va @ theta)
print(f"PR-AUC на валидации: {ap_newton:.3f} (случайная модель: {y_va.mean():.3f})")
P.stage("логистическая регрессия с нуля")

# %% [markdown]
# **Что было бы с утечкой.** Добавим длительность звонка — только чтобы увидеть, как утечка завышает оценку. Такой моделью нельзя решать, кому звонить.

# %%
dur_tr, dur_va = b["duration"][r_tr].astype(float), b["duration"][r_va].astype(float)
Zd_tr = np.column_stack([Z_tr, (dur_tr - dur_tr.mean()) / dur_tr.std()])
Zd_va = np.column_stack([Z_va, (dur_va - dur_tr.mean()) / dur_tr.std()])
ap_leak = average_precision(y_va, Zd_va @ fit_newton(Zd_tr, y_tr, lam))
print(f"PR-AUC с длительностью: {ap_leak:.3f} — против {ap_newton:.3f} честной модели")

# %% [markdown]
# ## Этап 3. Регуляризация и выбор
#
# **3.1.** Выберите тип штрафа (L1 или L2) и силу $C = 1/\lambda$ по PR-AUC пятикратной стратифицированной кросс-валидации **на обучающей части**. Заполните `cv_scores[(l1, C)]` — среднюю PR-AUC по фолдам (оценки — `decision_function`).

# %%
GRID = [(l1, C) for l1 in (False, True) for C in (0.001, 0.01, 0.1, 1.0)]
folds = list(StratifiedKFold(n_splits=5, shuffle=True, random_state=0).split(Z_tr, y_tr))
cv_scores = {}
for l1, C in GRID:
    # BEGIN SOLUTION
    scores = []
    for fit_idx, val_idx in folds:
        m = logreg(C, l1, max_iter=2000).fit(Z_tr[fit_idx, 1:], y_tr[fit_idx])
        scores.append(average_precision(y_tr[val_idx], m.decision_function(Z_tr[val_idx, 1:])))
    cv_scores[(l1, C)] = float(np.mean(scores))
    # END SOLUTION
    print(f"{'L1' if l1 else 'L2'}, C = {C:<6}: PR-AUC {cv_scores[(l1, C)]:.4f}")

best_l1, best_C = max(cv_scores, key=cv_scores.get)
model = logreg(best_C, best_l1, max_iter=2000).fit(Z_tr[:, 1:], y_tr)
p_va = model.predict_proba(Z_va[:, 1:])[:, 1]
ap_va = average_precision(y_va, p_va)
print(f"выбрано: {'L1' if best_l1 else 'L2'}, C = {best_C}; PR-AUC на валидации {ap_va:.3f}")
if set(cv_scores) != set(GRID) or not ap_va >= 0.37:
    raise check.CheckFailed("Заполните cv_scores для всей сетки; у выбранной модели PR-AUC на валидации должна быть не ниже 0.37.")
P.stage("регуляризация и выбор")

# %% [markdown]
# **Кривые обучения.** PR-AUC на обучающей части и на валидации при 10, 30 и 100 % обучающих данных — случайных: звонки в наборе идут по времени (май 2008 — ноябрь 2010), и первые 10 % строк — это первые месяцы кампании. Что поможет модели больше — данные или новые признаки?

# %%
shuffled = np.random.default_rng(0).permutation(len(y_tr))
for share in (0.1, 0.3, 1.0):
    k = shuffled[: int(share * len(y_tr))]
    m = logreg(best_C, best_l1, max_iter=2000).fit(Z_tr[k, 1:], y_tr[k])
    print(f"{share:>4.0%}: обучение {average_precision(y_tr[k], m.decision_function(Z_tr[k, 1:])):.3f}, "
          f"валидация {average_precision(y_va, m.decision_function(Z_va[:, 1:])):.3f}")

# %% [markdown]
# ## Этап 4. Порог и калибровка
#
# **4.1.** Прибыль кампании при пороге $t$: звоним всем с вероятностью $p \ge t$, каждый звонок стоит `COST`, каждый отклик приносит `GAIN`. Напишите `best_threshold(p, y, cost, gain)` — порог из значений `p`, при котором прибыль наибольшая (при равенстве — больший порог: меньше звонков), или `np.inf`, если выгоднее никому не звонить. Скрытые тесты сравнят её с перебором всех порогов.

# %%
COST, GAIN = 5.0, 60.0


def profit(y, p, t, cost=COST, gain=GAIN):
    call = p >= t
    return float(gain * y[call].sum() - cost * call.sum())


def best_threshold(p, y, cost, gain):
    # BEGIN SOLUTION
    order = np.argsort(-p, kind="mergesort")
    ps, gains = p[order], gain * y[order] - cost
    total = np.cumsum(gains)
    last = np.r_[np.flatnonzero(np.diff(ps)), len(ps) - 1]  # порог ps[i] включает всех с тем же p
    cand, prof = ps[last], total[last]
    best = np.max(prof)
    if best <= 0:
        return np.inf
    return float(np.max(cand[prof == best]))
    # END SOLUTION


def brute_force(p, y, cost, gain):
    candidates = [np.inf, *np.unique(p)]
    profits = [profit(y, p, t, cost, gain) for t in candidates]
    best = max(profits)
    return max(t for t, v in zip(candidates, profits) if v == best)


def threshold_task(draw):
    from hypothesis import strategies as st
    from hypothesis.extra import numpy as hnp

    n = draw(st.integers(1, 15))
    p = draw(hnp.arrays(np.float64, n, elements=st.integers(0, 10).map(lambda k: k / 10)))
    y = draw(hnp.arrays(np.float64, n, elements=st.integers(0, 1).map(float)))
    return p, y, draw(st.sampled_from([1.0, 5.0])), draw(st.sampled_from([3.0, 60.0]))


check.matches(best_threshold, brute_force, inputs=threshold_task, name="best_threshold")
t_best = best_threshold(p_va, y_va, COST, GAIN)
print(f"порог {t_best:.3f} (теория для калиброванной модели: COST / GAIN = {COST / GAIN:.3f}); "
      f"прибыль на валидации {profit(y_va, p_va, t_best):,.0f} € против {profit(y_va, p_va, 0):,.0f} €, если звонить всем")

# %% [markdown]
# **4.2. Калибровка.** Частый приём при редком классе — `class_weight="balanced"`: веса откликов растут, и модель «чаще говорит да». Ранжирование почти не меняется, а вероятности завышаются — порог COST / GAIN по ним уже не работает. Откалибруйте такую модель методом Платта: одномерная логистическая регрессия по её оценке, обученная на **первой половине валидации**; оцените Брайер на **второй**. Калибровать на обучающей части нельзя: там оценки слишком уверенные.

# %%
half = np.zeros(len(y_va), bool)
half[np.random.default_rng(1).permutation(len(y_va))[: len(y_va) // 2]] = True  # первая половина — для калибровки
balanced = logreg(best_C, best_l1, max_iter=2000, class_weight="balanced").fit(Z_tr[:, 1:], y_tr)
s_va = balanced.decision_function(Z_va[:, 1:])
p_bal = sigmoid(s_va)


def platt(s_cal, y_cal, s):
    # BEGIN SOLUTION
    m = LogisticRegression(C=1e6).fit(s_cal[:, None], y_cal)
    return m.predict_proba(s[:, None])[:, 1]
    # END SOLUTION


p_cal = platt(s_va[half], y_va[half], s_va)
b_raw, b_cal = brier(y_va[~half], p_bal[~half]), brier(y_va[~half], p_cal[~half])
print(f"Брайер на второй половине: без калибровки {b_raw:.4f}, после Платта {b_cal:.4f}; модель без весов {brier(y_va[~half], p_va[~half]):.4f}")
if not b_cal <= b_raw:
    raise check.CheckFailed("После калибровки Брайер должен быть не хуже, чем без неё.")
for lo, hi in ((0, 0.1), (0.1, 0.3), (0.3, 1.01)):
    m = (p_bal[~half] >= lo) & (p_bal[~half] < hi)
    print(f"предсказано {lo:.1f}–{min(hi, 1):.1f}: в среднем {p_bal[~half][m].mean():.2f}, на деле {y_va[~half][m].mean():.2f}")
P.stage("порог и калибровка")

# %% [markdown]
# ## Финальная оценка
#
# Модель, порог и калибровка выбраны. Открываем тест один раз: PR-AUC (порог проекта) и, для отчёта, прибыль кампании при выбранном пороге и при звонках всем.

# %%
score = P.final(
    lambda r: model.predict_proba(design(r)[:, 1:])[:, 1],
    extra={
        "прибыль при выбранном пороге, €": lambda y, p: profit(y, p, t_best),
        "прибыль, если звонить всем, €": lambda y, p: profit(y, p, 0),
    },
)

# %% [markdown]
# ## Отчёт
#
# Шаблон — `notebooks/templates/project-report.md`. Обязательно: как вы нашли утечку и сколько она «стоила» в PR-AUC; таблица кросс-валидации; порог и прибыль с экономическим обоснованием; калибровка (до и после); три гипотезы, что улучшить (например: признаки сезона, взаимодействия, другая стоимость звонка).
#
# Набор данных: Moro S., Rita P., Cortez P. Bank Marketing. UCI Machine Learning Repository, 2014, doi:10.24432/C5K306 (CC BY 4.0).
