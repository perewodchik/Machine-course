"""Системы уравнений и ранг в NumPy: код для урока I.6.

Регион вставляется в урок при сборке: ``<PyCode src="la/systems.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока I.6; тест сверяет её вывод с уроком."""
    # region demo
    A = np.array([[1, 2], [2, 4]])  # строки пропорциональны
    for b in ([2, 4], [2, 1]):
        Ab = np.column_stack([A, b])  # расширенная матрица [A | b]
        print("b =", b, "rank A =", np.linalg.matrix_rank(A), "rank [A|b] =", np.linalg.matrix_rank(Ab))

    try:
        np.linalg.solve(A, [2, 4])
    except np.linalg.LinAlgError as err:
        print("solve:", err)  # квадратная, но вырожденная

    B = np.array([[1, 2], [1, -1]])
    print("решение:", np.linalg.solve(B, [2, -1]))
    # endregion
