"""Множители Лагранжа в PCA: максимум uᵀΣu на единичной окружности — собственный вектор (урок II.8).

Регион вставляется в урок при сборке: ``<PyCode src="calculus/lagrange.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока II.8; тест сверяет её вывод с уроком."""
    # region demo
    rng = np.random.default_rng(3)
    pts = rng.multivariate_normal([0, 0], [[2, 0.8], [0.8, 1]], size=500)  # вытянутое облако точек
    S = np.cov(pts, rowvar=False)  # выборочная ковариация Σ

    angles = np.radians(np.arange(0, 180, 0.1))
    U = np.column_stack([np.cos(angles), np.sin(angles)])  # 1800 единичных векторов
    values = np.einsum("ij,jk,ik->i", U, S, U)  # uᵀΣu для каждого
    best = U[values.argmax()]

    lam, Q = np.linalg.eigh(S)
    print("перебор: max uᵀΣu =", values.max().round(4), " u =", best.round(3))
    print("eigh:    λ_max     =", lam[-1].round(4), " q =", (Q[:, -1] * np.sign(Q[0, -1])).round(3))
    print("Σu = λu:", np.allclose(S @ Q[:, -1], lam[-1] * Q[:, -1]))
    # endregion
