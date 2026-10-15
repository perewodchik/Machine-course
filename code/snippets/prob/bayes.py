"""Формула Байеса и симуляция медицинского теста: код для урока III.3.

Регионы вставляются в урок при сборке (``<PyCode src="prob/bayes.py#formula+demo" run />``);
ячейка урока молча выполняет весь файл, затем показанные регионы.
"""

import numpy as np


# region formula
def posterior(
    prevalence: float, sensitivity: float, false_positive: float
) -> float:
    """P(болен | +) по формуле Байеса.

    Знаменатель — формула полной вероятности P(+).
    """
    evidence = sensitivity * prevalence + false_positive * (1 - prevalence)
    return sensitivity * prevalence / evidence
# endregion


# region simulate
def simulate(n: int, prevalence: float, sensitivity: float, false_positive: float, seed: int = 0):
    """n человек: болен ли каждый и что показал его тест."""
    rng = np.random.default_rng(seed)
    sick = rng.random(n) < prevalence
    positive = np.where(sick, rng.random(n) < sensitivity, rng.random(n) < false_positive)
    return sick, positive
# endregion


def counts(prevalence: float, sensitivity: float, false_positive: float, n: int = 1000) -> dict[str, int]:
    """Группы на сетке из 1000 человек (виджет урока): те же округления, что в model.ts."""
    sick = round(n * prevalence)
    tp = round(sick * sensitivity)
    fp = round((n - sick) * false_positive)
    return {"tp": tp, "fn": sick - tp, "fp": fp, "tn": n - sick - fp}


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока III.3; тест сверяет её вывод с уроком."""
    # region demo
    sick, positive = simulate(100_000, prevalence=0.01, sensitivity=0.9, false_positive=0.09, seed=1)
    print("по формуле Байеса:", round(posterior(0.01, 0.9, 0.09), 3))
    print("по симуляции:     ", round(sick[positive].mean(), 3))
    print("положительных:", positive.sum(), "из них больны:", (sick & positive).sum())
    # endregion
