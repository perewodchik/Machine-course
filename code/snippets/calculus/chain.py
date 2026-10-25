"""Правило цепочки и обратный проход: код для урока II.2.

Регион вставляется в урок при сборке: ``<PyCode src="calculus/chain.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока II.2; тест сверяет её вывод с уроком."""
    # region demo
    theta, x, y = np.array([0.5, 1.0]), np.array([2.0, 1.0]), 3.0  # как на рисунке 1

    # прямой проход: запоминаем промежуточные значения
    s = theta @ x
    r = s - y
    L = r**2
    # обратный проход: от L к θ, каждый шаг — локальная производная
    dL_dr = 2 * r
    dL_ds = dL_dr * 1.0
    dL_dtheta = dL_ds * x  # s = θᵀx, ∂s/∂θ = x
    print("L =", L, " ∇θL =", dL_dtheta)

    h = 1e-6
    loss = lambda t: (t @ x - y) ** 2  # noqa: E731
    numeric = np.array([(loss(theta + h * e) - loss(theta - h * e)) / (2 * h) for e in np.eye(2)])
    print("численно:", numeric.round(6))

    # якобиан f(θ) = (θ₁θ₂, θ₁ + θ₂): строки — координаты f, столбцы — переменные
    J = np.array([[theta[1], theta[0]], [1.0, 1.0]])
    print("J_f =", J.tolist())
    # endregion
