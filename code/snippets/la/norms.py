"""Нормы и угол в NumPy: код для урока I.2.

Регионы вставляются в урок при сборке: ``<PyCode src="la/norms.py#norms" run />``
и ``<PyCode src="la/norms.py#angles" run />``.
"""

import numpy as np


def _norms_cell() -> None:
    """Служебная обёртка: регион norms — первая ячейка урока I.2; тест сверяет её вывод с уроком."""
    # region norms
    x = np.array([3.0, -4.0])
    print("ℓ1:", np.linalg.norm(x, 1))
    print("ℓ2:", np.linalg.norm(x))  # по умолчанию — евклидова
    print("ℓ∞:", np.linalg.norm(x, np.inf))

    A = np.array([[1.0, 2.0], [2.0, 4.0]])
    print("Фробениус:", np.linalg.norm(A, "fro"))
    # endregion


def _angles_cell() -> None:
    """Служебная обёртка: регион angles — вторая ячейка урока I.2; тест сверяет её вывод с уроком."""
    # region angles
    rng = np.random.default_rng(0)
    for d in [2, 10, 100, 1000]:
        U = rng.normal(size=(500, d))  # 500 пар случайных векторов в ℝ^d
        V = rng.normal(size=(500, d))
        lengths = np.linalg.norm(U, axis=1) * np.linalg.norm(V, axis=1)
        cos = np.sum(U * V, axis=1) / lengths
        print(f"d = {d:4}: средний |cos| = {np.mean(np.abs(cos)):.3f}")
    # endregion
