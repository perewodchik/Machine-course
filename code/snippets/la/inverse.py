"""Обратная матрица и определитель в NumPy: код для урока I.7.

Регион вставляется в урок при сборке: ``<PyCode src="la/inverse.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока I.7; тест сверяет её вывод с уроком."""
    # region demo
    A = np.array([[4.0, 1.0], [2.0, 3.0]])
    b = np.array([1.0, 2.0])

    x = np.linalg.solve(A, b)  # так решают систему
    y = np.linalg.inv(A) @ b  # так тоже можно, но дороже
    print("x =", x, "совпало:", np.allclose(x, y))

    B = np.array([[1.0, 2.0], [0.0, -1.0]])
    print("det A =", round(np.linalg.det(A), 6), " det B =", round(np.linalg.det(B), 6))
    print("det AB =", round(np.linalg.det(A @ B), 6))
    # endregion
