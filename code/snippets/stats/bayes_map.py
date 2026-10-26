"""Байесовское обновление монеты и ridge как MAP на числах (урок IV.6).

Регион вставляется в урок при сборке: ``<PyCode src="stats/bayes_map.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока IV.6; тест сверяет её вывод с уроком."""
    # region demo
    tosses = [1, 1, 1]  # три орла подряд
    a, b = 2.0, 2.0  # априорное Beta(2, 2): два воображаемых орла и две решки
    for y in tosses:
        a, b = a + y, b + (1 - y)  # сопряжённость: после броска — снова Beta
    k, n = sum(tosses), len(tosses)
    print(f"апостериорное Beta({a:.0f}, {b:.0f}): MLE {k / n:.3f}, MAP {(a - 1) / (a + b - 2):.3f}, среднее {a / (a + b):.3f}")

    # ridge = MAP с априорным N(0, τ²I): минимум −log p(θ | данные) численно и по формуле
    rng = np.random.default_rng(0)
    X = rng.normal(size=(20, 3))
    y = X @ np.array([1.0, -2.0, 0.5]) + rng.normal(0, 1.0, size=20)
    s2, t2 = 1.0, 0.25  # σ² шума и τ² априорного: λ = σ²/τ² = 4
    theta = np.zeros(3)
    for _ in range(5000):  # спуск по −log p(θ | данные)
        theta -= 0.01 * (X.T @ (X @ theta - y) / s2 + theta / t2)
    ridge = np.linalg.solve(X.T @ X + (s2 / t2) * np.eye(3), X.T @ y)
    ols = np.linalg.solve(X.T @ X, X.T @ y)
    print("MAP спуском:", theta.round(4), " ridge:", ridge.round(4), " МНК:", ols.round(4))
    # endregion
