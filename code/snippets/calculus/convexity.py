"""Выпуклость логистической потери: код для урока II.5.

Регион вставляется в урок при сборке: ``<PyCode src="calculus/convexity.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока II.5; тест сверяет её вывод с уроком."""
    # region demo
    X = np.array([[1.0, 0.5], [1.0, 2.0], [1.0, -1.0], [1.0, 1.5]])  # первый столбец — свободный член
    y = np.array([0.0, 1.0, 0.0, 1.0])

    def J(theta):
        z = X @ theta
        return np.sum(np.log1p(np.exp(z)) - y * z)

    def hessian(theta):
        g = 1 / (1 + np.exp(-(X @ theta)))
        return X.T @ np.diag(g * (1 - g)) @ X  # Xᵀ D X, D = diag(g(1 − g))

    rng = np.random.default_rng(0)
    thetas = rng.normal(scale=3, size=(1000, 2))
    lam_min = min(np.linalg.eigvalsh(hessian(t))[0] for t in thetas)
    print("все λ(H) > 0 в 1000 точках:", lam_min > 0)

    gaps = [
        s * J(a) + (1 - s) * J(b) - J(s * a + (1 - s) * b)
        for a, b, s in zip(thetas[:500], thetas[500:], rng.uniform(size=500))
    ]
    print("хорда ниже графика:", sum(g < -1e-12 for g in gaps), "раз из 500")
    # endregion
