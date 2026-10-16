"""Проекция на плоскость столбцов и QR в NumPy: код для урока I.8.

Регион вставляется в урок при сборке: ``<PyCode src="la/projections.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока I.8; тест сверяет её вывод с уроком."""
    # region demo
    X = np.array([[1.0, 0.0], [0.0, 1.0], [0.5, 0.5]])  # столбцы a и b с рисунка
    y = np.array([1.0, 0.5, 2.0])

    P = X @ np.linalg.inv(X.T @ X) @ X.T  # матрица проекции
    y_hat = P @ y
    print("ŷ =", np.round(y_hat, 3))
    print("остаток ⟂ столбцам:", np.allclose(X.T @ (y - y_hat), 0))
    print("P² = P:", np.allclose(P @ P, P), "  Pᵀ = P:", np.allclose(P.T, P))

    Q, R = np.linalg.qr(X)  # ортонормированный базис той же плоскости
    print("QᵀQ = I:", np.allclose(Q.T @ Q, np.eye(2)), "  QQᵀ = P:", np.allclose(Q @ Q.T, P))
    # endregion
