"""Градиент функции потерь МНК на «Квартирах»: численный против формулы из частных производных (урок II.1).

Регион вставляется в урок при сборке: ``<PyCode src="calculus/gradient.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока II.1; тест сверяет её вывод с уроком."""
    # region demo
    rng = np.random.default_rng(2026)  # «Квартиры», как в уроках 0.1 и I.12
    area = np.round(rng.uniform(28, 110, size=16))
    y = np.round(1.5 + 0.12 * area + rng.normal(0, 0.9, size=16), 1)
    X = np.column_stack([np.ones(16), area])

    def J(theta):
        r = X @ theta - y
        return 0.5 * r @ r

    theta = np.array([1.0, 0.1])
    # частные производные: ∂J/∂θⱼ = Σᵢ (θᵀx⁽ⁱ⁾ − y⁽ⁱ⁾) xⱼ⁽ⁱ⁾ — вместе это Xᵀ(Xθ − y)
    grad = X.T @ (X @ theta - y)
    h = 1e-6
    numeric = np.array([(J(theta + h * e) - J(theta - h * e)) / (2 * h) for e in np.eye(2)])
    print("∇J =", grad.round(2))
    print("численно:", numeric.round(2))
    print("совпадают:", np.allclose(grad, numeric, rtol=1e-5))
    # endregion
