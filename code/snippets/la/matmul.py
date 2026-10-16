"""Умножение матриц в NumPy: код для урока I.3.

Регионы вставляются в урок при сборке: ``<PyCode src="la/matmul.py#star" run />``
и ``<PyCode src="la/matmul.py#gram" run />``.
"""

import numpy as np


def _star_cell() -> None:
    """Служебная обёртка: регион star — первая ячейка урока I.3; тест сверяет её вывод с уроком."""
    # region star
    A = np.array([[1, 2], [3, 4]])
    B = np.array([[0, 1], [1, 0]])
    print("A * B — поэлементно:")
    print(A * B)
    print("A @ B — матричное:")
    print(A @ B)
    print("B @ A — другой порядок:")
    print(B @ A)
    # endregion


def _gram_cell() -> None:
    """Служебная обёртка: регион gram — вторая ячейка урока I.3; тест сверяет её вывод с уроком."""
    # region gram
    rng = np.random.default_rng(0)
    X = rng.normal(size=(1000, 3))  # 1000 объектов, 3 признака

    G = np.zeros((3, 3))
    for x in X:  # по одному объекту: внешнее произведение x xᵀ
        G += np.outer(x, x)

    print("форма X.T @ X:", (X.T @ X).shape)
    print("сумма по объектам совпала:", np.allclose(G, X.T @ X))
    # endregion
