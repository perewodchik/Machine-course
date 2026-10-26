"""Смесь двух гауссиан: порождение через скрытую z, ответственность против доли на выборке, смесь ≠ сумма (урок III.12).

Регион вставляется в урок при сборке: ``<PyCode src="prob/mixture.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока III.12; тест сверяет её вывод с уроком."""
    # region demo
    rng = np.random.default_rng(0)
    n, phi = 200_000, 0.4
    mu, sigma = np.array([-1.5, 2.0]), np.array([0.8, 1.2])

    z = (rng.random(n) >= phi).astype(int)  # скрытая переменная: 0 с вероятностью φ, иначе 1
    x = rng.normal(mu[z], sigma[z])  # x | z ~ N(μ_z, σ_z²)

    def normal(t, m, s):
        return np.exp(-((t - m) ** 2) / (2 * s**2)) / (np.sqrt(2 * np.pi) * s)

    x0 = 0.5
    num = phi * normal(x0, mu[0], sigma[0])
    resp = num / (num + (1 - phi) * normal(x0, mu[1], sigma[1]))
    near = np.abs(x - x0) < 0.05
    print("P(z = 1 | x ≈ 0.5): по выборке", np.mean(z[near] == 0).round(3), " формула", resp.round(3))

    mean = phi * mu[0] + (1 - phi) * mu[1]
    var = phi * (sigma[0] ** 2 + mu[0] ** 2) + (1 - phi) * (sigma[1] ** 2 + mu[1] ** 2) - mean**2
    s = phi * rng.normal(mu[0], sigma[0], n) + (1 - phi) * rng.normal(mu[1], sigma[1], n)  # сумма, а не смесь
    print("Var смеси:", x.var().round(2), " формула:", var.round(2), "  Var взвешенной суммы:", s.var().round(2))
    # endregion
