"""Нормальные уравнения: код для урока V.1 и лабораторной.

Регионы (``# region name`` … ``# endregion``) вставляются в урок и ноутбук при сборке:
``<PyCode src="la/normal_equations.py#solve" />``. Код вне регионов — служебный: ячейка урока
выполняет весь файл молча, а затем показанные регионы (отступ региона снимается).
"""

import numpy as np


# region data
def make_data(n: int = 12, seed: int = 7):
    """Тот же набор, что на рисунке 1 урока V.1."""
    rng = np.random.default_rng(seed=seed)
    x = rng.uniform(0.5, 9.5, size=n)
    y = 1.2 + 0.55 * x + rng.normal(0, 0.6, size=n)
    X = np.column_stack([np.ones(n), x])  # n × 2: столбец единиц и признак
    return X, y
# endregion


# region solve
def normal_equations(X: np.ndarray, y: np.ndarray) -> np.ndarray:
    """XᵀXθ = Xᵀy: решаем систему, а не обращаем матрицу."""
    return np.linalg.solve(X.T @ X, X.T @ y)
# endregion


# region loss
def loss(theta: np.ndarray, X: np.ndarray, y: np.ndarray) -> float:
    """J(θ) = ½‖Xθ − y‖²."""
    r = X @ theta - y
    return 0.5 * float(r @ r)
# endregion


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока V.1; тест сверяет её вывод с уроком."""
    # region demo
    X, y = make_data()
    theta = normal_equations(X, y)
    print("θ =", theta.round(3))
    ref = np.linalg.lstsq(X, y, rcond=None)[0]
    print("совпадает с lstsq:", np.allclose(theta, ref))
    # endregion
