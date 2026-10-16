"""Собственные значения и спектральное разложение в NumPy: код для урока I.9.

Регион вставляется в урок при сборке: ``<PyCode src="la/eigen.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока I.9; тест сверяет её вывод с уроком."""
    # region demo
    A = np.array([[2.0, 1.0], [1.0, 2.0]])  # симметричная
    lam, Q = np.linalg.eigh(A)  # для симметричных — eigh: значения по возрастанию
    print("λ =", lam)
    print("QᵀQ = I:", np.allclose(Q.T @ Q, np.eye(2)))
    print("A = QΛQᵀ:", np.allclose(Q @ np.diag(lam) @ Q.T, A))

    R = np.array([[0.0, -1.0], [1.0, 0.0]])  # поворот на 90°
    print("поворот:", np.linalg.eigvals(R))  # вещественных нет
    # endregion
