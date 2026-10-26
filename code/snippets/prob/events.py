"""События на двух кубиках: частоты на симуляции против формулы включений-исключений (урок III.1).

Регион вставляется в урок при сборке: ``<PyCode src="prob/events.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока III.1; тест сверяет её вывод с уроком."""
    # region demo
    rng = np.random.default_rng(0)
    rolls = rng.integers(1, 7, size=(100_000, 2))  # сто тысяч бросков двух кубиков
    A = rolls.sum(axis=1) >= 8  # сумма не меньше 8
    B = rolls[:, 0] % 2 == 0  # первый кубик чётный

    print("частота A ∪ B:", (A | B).mean().round(4))
    print("P(A) + P(B) − P(A ∩ B):", round(15 / 36 + 18 / 36 - 9 / 36, 4))
    print("P(A) + P(B) без вычитания:", round(15 / 36 + 18 / 36, 4))
    # endregion
