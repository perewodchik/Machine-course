"""Непрерывные распределения на выборке: σ против σ², правило 68–95–99.7, отсутствие памяти (урок III.7).

Регион вставляется в урок при сборке: ``<PyCode src="prob/continuous.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока III.7; тест сверяет её вывод с уроком."""
    # region demo
    rng = np.random.default_rng(0)
    # хотим N(0, 4): дисперсия 4, σ = 2 — второй аргумент numpy — σ
    right = rng.normal(loc=0, scale=2, size=200_000)
    wrong = rng.normal(loc=0, scale=4, size=200_000)  # ошибка: передали дисперсию
    print("дисперсия выборки: scale=2 →", right.var().round(2), " scale=4 →", wrong.var().round(2))

    for k in (1, 2, 3):
        print(f"доля внутри ±{k}σ:", np.mean(np.abs(right) <= 2 * k).round(4))

    wait = rng.exponential(scale=1.0, size=200_000)  # показательное, λ = 1
    print("P(T > 1) =", np.mean(wait > 1).round(3), "  P(T > 3 | T > 2) =", np.mean(wait[wait > 2] > 3).round(3))
    # endregion
