"""Линейная независимость в NumPy: код для урока I.1.

Регион вставляется в урок при сборке (``<PyCode src="la/span.py#demo" run />``).
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока I.1; тест сверяет её вывод с уроком."""
    # region demo
    v1 = np.array([1, 2, 0])
    v2 = np.array([0, 1, 1])
    v3 = v1 + 2 * v2  # комбинация первых двух

    A = np.column_stack([v1, v2, v3])  # векторы — столбцы
    print("ранг [v1 v2 v3] =", np.linalg.matrix_rank(A))
    B = np.column_stack([v1, v2, [0, 0, 1]])
    print("ранг [v1 v2 e3] =", np.linalg.matrix_rank(B))
    # endregion
