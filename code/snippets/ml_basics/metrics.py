"""Метрики классификации с нуля: матрица ошибок, ROC и PR, AUC, AP, Брайер, надёжность (урок 2.1 «Основ ML»).

Регионы вставляются в урок при сборке: ``<PyCode src="ml_basics/metrics.py#data+tools+demo" run />``. Тест
``code/tests/test_classification_metrics.py`` сверяет вывод и каждую метрику с ``sklearn.metrics`` до 1e-12.
"""

import csv

import numpy as np


# region data
def bank_calls(path="data/bank_marketing-10k.csv"):
    """10 000 звонков Bank Marketing (UCI, CC BY 4.0): признаки до звонка и открыл ли клиент вклад.

    Признаки: возраст, средний остаток (евро), звонков в этой кампании, звонков раньше, есть ипотека, есть кредит,
    прошлая кампания успешна, тип связи неизвестен. Длительности звонка нет: её узнают только после звонка.
    """
    with open(path, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    numbers = [[float(r[c]) for c in ("age", "balance", "campaign", "previous")] for r in rows]
    flags = [[r["housing"] == "yes", r["loan"] == "yes", r["poutcome"] == "success", r["contact"] == "unknown"] for r in rows]
    y = np.array([r["y"] == "yes" for r in rows], dtype=float)
    return np.column_stack([numbers, np.array(flags, dtype=float)]), y


def fit_logistic(X, y, iters=12):
    """Логистическая регрессия методом Ньютона (урок 1.4)."""
    theta = np.zeros(X.shape[1])
    for _ in range(iters):
        p = 1 / (1 + np.exp(-X @ theta))
        theta += np.linalg.solve(X.T @ (X * (p * (1 - p))[:, None]), X.T @ (y - p))
    return theta
# endregion


# region tools
def confusion(s, y, t):
    pred = s >= t
    return {"tp": int(np.sum(pred & (y == 1))), "fp": int(np.sum(pred & (y == 0))), "fn": int(np.sum(~pred & (y == 1))), "tn": int(np.sum(~pred & (y == 0)))}


def curves(s, y):
    """ROC и PR одной сортировкой: пороги — различные оценки по убыванию, совпадающие оценки — одной точкой."""
    order = np.argsort(-s, kind="stable")
    s, y = s[order], y[order]
    last = np.r_[np.diff(s) != 0, True]  # конец группы одинаковых оценок
    tp, fp = np.cumsum(y)[last], np.cumsum(1 - y)[last]
    P, N = y.sum(), len(y) - y.sum()
    return np.r_[0, fp / N], np.r_[0, tp / P], tp / P, tp / (tp + fp)  # FPR, TPR, recall, precision


def auc_pairs(s, y):
    """Доля правильно упорядоченных пар (положительный, отрицательный), ничья — за ½."""
    pos, neg = np.sort(s[y == 1]), np.sort(s[y == 0])
    less = np.searchsorted(neg, pos, side="left")
    equal = np.searchsorted(neg, pos, side="right") - less
    return (less.sum() + 0.5 * equal.sum()) / (len(pos) * len(neg))


def average_precision(recall, precision):
    return np.sum(np.diff(np.r_[0, recall]) * precision)  # ступеньками, не трапециями


def reliability(s, y, bins=10):
    """Средняя оценка и доля положительных в каждой из равных корзин [0, 1] (пустые пропускаются)."""
    b = np.minimum((s * bins).astype(int), bins - 1)
    keep = np.bincount(b, minlength=bins) > 0
    n = np.bincount(b, minlength=bins)[keep]
    return np.bincount(b, s, bins)[keep] / n, np.bincount(b, y, bins)[keep] / n
# endregion


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока 2.1; тест сверяет её вывод с уроком."""
    # region demo
    F, y = bank_calls()
    X = np.column_stack([np.ones(len(y)), (F - F.mean(axis=0)) / F.std(axis=0)])
    tr = np.random.default_rng(0).permutation(len(y)) < 7000  # случайные 7000 звонков — обучение, 3000 — проверка
    s = 1 / (1 + np.exp(-X[~tr] @ fit_logistic(X[tr], y[tr])))
    yt = y[~tr]

    print(f"доля откликов: {yt.mean():.3f}; «никому не звонить» верно в {1 - yt.mean():.1%} случаев")
    c = confusion(s, yt, 0.5)
    prec, rec = c["tp"] / (c["tp"] + c["fp"]), c["tp"] / (c["tp"] + c["fn"])
    print(f"порог 0.5: {c}, доля верных {(c['tp'] + c['tn']) / len(yt):.3f}, точность {prec:.3f}, полнота {rec:.3f}")

    fpr, tpr, recall, precision = curves(s, yt)
    print(f"AUC трапециями: {np.sum(np.diff(fpr) * (tpr[1:] + tpr[:-1]) / 2):.4f}, по парам: {auc_pairs(s, yt):.4f}; AP: {average_precision(recall, precision):.4f}")
    print(f"Брайер: {np.mean((s - yt) ** 2):.4f}, у оценок в кубе: {np.mean((s**3 - yt) ** 2):.4f}, AUC у куба: {auc_pairs(s**3, yt):.4f}")

    t_star = 5 / (5 + 95)  # звонок стоит 5, отклик приносит 100: c_FP = 5, c_FN = 95
    cost = lambda t: 5 * confusion(s, yt, t)["fp"] + 95 * confusion(s, yt, t)["fn"]
    print(f"порог t* = {t_star:.2f}: цена {cost(t_star)}, при пороге 0.5: {cost(0.5)}")
    mean, frac = reliability(s, yt)
    print("надёжность (оценка → доля):", " ".join(f"{m:.2f}→{f:.2f}" for m, f in zip(mean[:5], frac[:5])))
    # endregion
