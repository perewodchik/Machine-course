"""Матожидание, дисперсия и Йенсен на выборке: две частые ошибки (урок III.5).

Регион вставляется в урок при сборке: ``<PyCode src="prob/moments.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока III.5; тест сверяет её вывод с уроком."""
    # region demo
    rng = np.random.default_rng(0)
    X = rng.integers(1, 7, size=1_000_000)  # кубик: E X = 3.5, Var X = 35/12 ≈ 2.917

    print("E X² =", np.mean(X**2).round(3), " (E X)² =", (np.mean(X) ** 2).round(3))  # g(E X) ≠ E g(X)
    print("E log X =", np.mean(np.log(X)).round(3), " log E X =", np.log(np.mean(X)).round(3))  # Йенсен: log вогнут

    Y_indep = rng.integers(1, 7, size=X.size)  # второй кубик, независимый
    Y_same = X  # «второй кубик» — тот же самый
    print("Var(X + Y), Y независим:", np.var(X + Y_indep).round(3))
    print("Var(X + Y), Y = X:      ", np.var(X + Y_same).round(3), " ≠ Var X + Var Y =", (2 * np.var(X)).round(3))
    # endregion
