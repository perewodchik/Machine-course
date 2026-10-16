"""След и симметричная часть в NumPy: код для урока I.5.

Регион вставляется в урок при сборке: ``<PyCode src="la/trace.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока I.5; тест сверяет её вывод с уроком."""
    # region demo
    A = np.array([[1, 2, 0], [0, 1, -1]])  # 2 × 3
    B = np.array([[3, 1], [-1, 2], [0, 4]])  # 3 × 2
    print("AB:", (A @ B).shape, "след", np.trace(A @ B))
    print("BA:", (B @ A).shape, "след", np.trace(B @ A))

    M = np.array([[1, 4], [0, 2]])  # не симметрична
    S = (M + M.T) / 2  # симметричная часть
    x = np.array([1, -2])
    print("x^T M x =", x @ M @ x)
    print("x^T S x =", x @ S @ x)
    print("tr(M x x^T) =", np.trace(M @ np.outer(x, x)))
    # endregion
