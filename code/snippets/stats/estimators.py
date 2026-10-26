"""Оценки дисперсии на симуляции: деление на n смещено, на n − 1 — нет, но MSE у смещённой меньше (урок IV.2).

Регион вставляется в урок при сборке: ``<PyCode src="stats/estimators.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока IV.2; тест сверяет её вывод с уроком."""
    # region demo
    rng = np.random.default_rng(0)
    sigma2, n = 4.0, 5
    X = rng.normal(0, np.sqrt(sigma2), size=(200_000, n))  # 200 000 выборок по 5 наблюдений

    for ddof, name in [(0, "делим на n    "), (1, "делим на n − 1")]:
        est = X.var(axis=1, ddof=ddof)
        bias, var = est.mean() - sigma2, est.var()
        print(f"{name}: среднее оценки {est.mean():.3f}, смещение {bias:+.3f}, дисперсия {var:.3f}, MSE {((est - sigma2) ** 2).mean():.3f}")
    print("теория: E оценки с делением на n =", (n - 1) / n * sigma2)
    # endregion
