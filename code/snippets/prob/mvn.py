"""Многомерное нормальное на выборке: Холецкий, доли внутри эллипсов уровня, маргинальное и условное (урок III.11).

Регион вставляется в урок при сборке: ``<PyCode src="prob/mvn.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока III.11; тест сверяет её вывод с уроком."""
    # region demo
    rng = np.random.default_rng(0)
    mu = np.array([1.0, -1.0])
    Sigma = np.array([[2.0, 1.2], [1.2, 1.0]])
    L = np.linalg.cholesky(Sigma)  # Σ = L Lᵀ, L — нижнетреугольная
    Z = rng.standard_normal((200_000, 2))
    X = mu + Z @ L.T  # x⁽ⁱ⁾ = μ + L z⁽ⁱ⁾: Cov = L I Lᵀ = Σ
    print("выборочная Σ:", np.cov(X.T, bias=True).round(2).tolist())

    d2 = np.einsum("ij,jk,ik->i", X - mu, np.linalg.inv(Sigma), X - mu)  # (x − μ)ᵀ Σ⁻¹ (x − μ) для каждой строки
    print("внутри уровня 1:", np.mean(d2 <= 1).round(3), " уровня 2:", np.mean(d2 <= 4).round(3))

    near = np.abs(X[:, 1] - 0) < 0.05  # условие x₂ ≈ 0
    print("E[X₁ | X₂ ≈ 0] по выборке:", X[near, 0].mean().round(2), " формула:", mu[0] + Sigma[0, 1] / Sigma[1, 1] * (0 - mu[1]))
    # endregion
