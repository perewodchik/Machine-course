"""Ковариация линейного преобразования на выборке: AΣAᵀ против ошибки AΣ, Σ ⪰ 0, Var(aᵀX) (урок III.10).

Регион вставляется в урок при сборке: ``<PyCode src="prob/random_vectors.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока III.10; тест сверяет её вывод с уроком."""
    # region demo
    rng = np.random.default_rng(0)
    Sigma = np.array([[2.0, 0.6], [0.6, 1.0]])
    X = rng.multivariate_normal([0, 0], Sigma, size=200_000)  # строки — объекты, как в CS229
    A = np.array([[1.0, 1.0], [0.0, 2.0]])
    Y = X @ A.T + np.array([3.0, -1.0])  # y⁽ⁱ⁾ = A x⁽ⁱ⁾ + b для каждой строки

    print("выборочная Cov Y:\n", np.cov(Y.T, bias=True).round(2))
    print("A Σ Aᵀ:\n", A @ Sigma @ A.T)
    print("ошибка A Σ:\n", A @ Sigma)

    a = np.array([1.0, -2.0])
    print("Var(aᵀX): выборка", (X @ a).var().round(2), " aᵀΣa =", (a @ Sigma @ a).round(2))
    print("собственные числа Σ:", np.linalg.eigvalsh(Sigma).round(3))
    # endregion
