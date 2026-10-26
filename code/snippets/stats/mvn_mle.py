"""MLE многомерного нормального и параметры GDA на выборке (урок IV.4).

Регион вставляется в урок при сборке: ``<PyCode src="stats/mvn_mle.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока IV.4; тест сверяет её вывод с уроком."""
    # region demo
    rng = np.random.default_rng(0)
    Sigma = np.array([[2.0, 0.8], [0.8, 1.0]])
    X = rng.multivariate_normal([1.0, -1.0], Sigma, size=2000)  # строки — объекты

    mu_hat = X.mean(axis=0)
    D = X - mu_hat
    Sigma_hat = D.T @ D / len(X)  # = (1/n) Σ (x − μ̂)(x − μ̂)ᵀ
    print("μ̂ =", mu_hat.round(3), " Σ̂ =", Sigma_hat.round(3).tolist())
    print("как np.cov(bias=True):", np.allclose(Sigma_hat, np.cov(X.T, bias=True)), " как np.cov:", np.allclose(Sigma_hat, np.cov(X.T)))

    # GDA: два класса с общей Σ — оценки максимального правдоподобия
    y = (rng.random(2000) < 0.3).astype(int)
    Z = rng.multivariate_normal([0, 0], Sigma, size=2000) + np.where(y[:, None] == 1, [2.0, 1.0], [0.0, 0.0])
    phi = y.mean()
    mu0, mu1 = Z[y == 0].mean(axis=0), Z[y == 1].mean(axis=0)
    R = Z - np.where(y[:, None] == 1, mu1, mu0)  # отклонение от среднего своего класса
    print("φ̂ =", phi.round(3), " μ̂₀ =", mu0.round(2), " μ̂₁ =", mu1.round(2), " Σ̂ =", (R.T @ R / len(Z)).round(2).tolist())
    # endregion
