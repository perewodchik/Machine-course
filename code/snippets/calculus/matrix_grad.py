"""Матричные градиенты и проверка конечными разностями: код для урока II.3.

Регион вставляется в урок при сборке: ``<PyCode src="calculus/matrix_grad.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока II.3; тест сверяет её вывод с уроком."""
    # region demo
    def grad_check(f, X, h=1e-6):
        """Численный градиент той же формы, что X: центральная разность по каждому элементу."""
        G = np.zeros_like(X)
        for idx in np.ndindex(X.shape):
            E = np.zeros_like(X)
            E[idx] = h
            G[idx] = (f(X + E) - f(X - E)) / (2 * h)
        return G

    rng = np.random.default_rng(0)
    A, x = rng.normal(size=(3, 3)), rng.normal(size=3)
    B = rng.normal(size=(3, 3)) + 3 * np.eye(3)

    print("∇ xᵀAx = (A+Aᵀ)x:", np.allclose(grad_check(lambda v: v @ A @ v, x), (A + A.T) @ x))
    print("∇ xᵀAx = 2Ax:", np.allclose(grad_check(lambda v: v @ A @ v, x), 2 * A @ x))
    print("∇ tr(AB) = Bᵀ:", np.allclose(grad_check(lambda M: np.trace(M @ B), A), B.T))
    print("∇ log|det B| = B⁻ᵀ:", np.allclose(grad_check(lambda M: np.log(abs(np.linalg.det(M))), B), np.linalg.inv(B).T))
    # endregion
