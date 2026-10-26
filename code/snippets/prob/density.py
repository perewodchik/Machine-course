"""Плотность функции от величины и индикатор: проверка на i.i.d. выборке (урок III.4).

Регион вставляется в урок при сборке: ``<PyCode src="prob/density.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока III.4; тест сверяет её вывод с уроком."""
    # region demo
    rng = np.random.default_rng(0)
    X = rng.exponential(scale=1.0, size=200_000)  # i.i.d. выборка: показательное, λ = 1
    Y = np.sqrt(X)

    print("среднее 1{X > 1}:", np.mean(X > 1).round(4), " P(X > 1) = e⁻¹ =", round(np.exp(-1), 4))

    counts, edges = np.histogram(Y, bins=40, range=(0, 2.5))
    mids = (edges[:-1] + edges[1:]) / 2
    hist = counts / (Y.size * np.diff(edges))  # гистограмма, нормированная как плотность
    formula = 2 * mids * np.exp(-mids**2)  # p_Y(y) = p_X(y²) · |d(y²)/dy|
    print("наибольшее расхождение гистограммы и 2y·e^(−y²):", np.abs(hist - formula).max().round(3))
    print("без множителя 2y:", np.abs(hist - np.exp(-mids**2)).max().round(3))
    # endregion
