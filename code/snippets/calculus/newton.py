"""Метод Ньютона против градиентного спуска на логистической регрессии: код для урока II.7.

Регион вставляется в урок при сборке: ``<PyCode src="calculus/newton.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока II.7; тест сверяет её вывод с уроком."""
    # region demo
    rng = np.random.default_rng(7)
    hours = rng.uniform(0, 10, size=40)  # часы подготовки к экзамену
    passed = (rng.uniform(size=40) < 1 / (1 + np.exp(-(hours - 5)))).astype(float)
    X = np.column_stack([np.ones(40), hours - 5])  # свободный член и признак

    def grad(theta):
        p = 1 / (1 + np.exp(-(X @ theta)))
        return X.T @ (p - passed)  # ∇ℓ = Xᵀ(g(Xθ) − y)

    def hessian(theta):
        p = 1 / (1 + np.exp(-(X @ theta)))
        return X.T @ ((p * (1 - p))[:, None] * X)  # XᵀDX

    theta = np.zeros(2)
    for k in range(1, 7):
        theta = theta - np.linalg.solve(hessian(theta), grad(theta))  # система, а не inv
        print(f"Ньютон, шаг {k}: ‖∇ℓ‖ = {np.linalg.norm(grad(theta)):.1e}")

    theta_gd, steps = np.zeros(2), 0
    eta = 1 / np.linalg.eigvalsh(hessian(np.zeros(2)))[-1]  # ℓ″ максимален в θ = 0
    while np.linalg.norm(grad(theta_gd)) > 1e-8:
        theta_gd = theta_gd - eta * grad(theta_gd)
        steps += 1
    print("градиентный спуск до ‖∇ℓ‖ < 1e-8, шагов:", steps)
    print("θ =", theta.round(3), " совпадают:", np.allclose(theta, theta_gd, atol=1e-6))
    # endregion
