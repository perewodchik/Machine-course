"""Порог классификатора: код для урока 2.1 курса «Основы ML» и виджета «Порог классификатора».

Данные виджета экспортирует ``scripts/export_widget_data.py``; числа, которые показывает урок,
проверяет ``code/tests/test_threshold.py``. Регионы вставляются в урок при сборке.
"""

import numpy as np


# region data
def make_scores(n: int = 300, seed: int = 229):
    """Оценки модели и истинные метки. Вероятности калиброваны по построению:
    сначала p ~ Beta(0.9, 2.6), потом y ~ Bernoulli(p). Оценка — это и есть p."""
    rng = np.random.default_rng(seed)
    p = rng.beta(0.9, 2.6, size=n).round(3)
    y = (rng.uniform(size=n) < p).astype(int)
    return p, y
# endregion


# region confusion
def confusion(scores: np.ndarray, y: np.ndarray, t: float) -> dict:
    """Матрица ошибок при пороге t: объект считаем положительным, если score ≥ t."""
    pred = scores >= t
    return {
        "tp": int(np.sum(pred & (y == 1))), "fp": int(np.sum(pred & (y == 0))),
        "fn": int(np.sum(~pred & (y == 1))), "tn": int(np.sum(~pred & (y == 0))),
    }


def precision_recall(c: dict) -> tuple[float, float]:
    precision = c["tp"] / (c["tp"] + c["fp"]) if c["tp"] + c["fp"] else 1.0
    recall = c["tp"] / (c["tp"] + c["fn"])
    return precision, recall
# endregion


# region auc
def roc_auc(scores: np.ndarray, y: np.ndarray) -> float:
    """AUC = P(оценка положительного > оценки отрицательного); ничья считается за ½."""
    pos, neg = scores[y == 1], scores[y == 0]
    greater = (pos[:, None] > neg[None, :]).sum()
    ties = (pos[:, None] == neg[None, :]).sum()
    return float((greater + 0.5 * ties) / (len(pos) * len(neg)))
# endregion


# region cost
def total_cost(scores: np.ndarray, y: np.ndarray, t: float, c_fp: float, c_fn: float) -> float:
    c = confusion(scores, y, t)
    return c_fp * c["fp"] + c_fn * c["fn"]


def best_threshold(scores: np.ndarray, y: np.ndarray, c_fp: float, c_fn: float) -> tuple[float, float]:
    """Перебор порогов по всем различным оценкам (и «никого не отмечать»). При равной цене — меньший порог."""
    candidates = np.append(np.unique(scores), 1.001)
    costs = [total_cost(scores, y, t, c_fp, c_fn) for t in candidates]
    i = int(np.argmin(costs))
    return float(candidates[i]), float(costs[i])


def bayes_threshold(c_fp: float, c_fn: float) -> float:
    """Для калиброванных вероятностей: отмечать, если p · c_fn > (1 − p) · c_fp, то есть p > c_fp / (c_fp + c_fn)."""
    return c_fp / (c_fp + c_fn)
# endregion
