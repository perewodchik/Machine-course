"""Экспоненциальное семейство на числах: производные a(η) — среднее и дисперсия T(y) (урок IV.5).

Регион вставляется в урок при сборке: ``<PyCode src="stats/expfam.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока IV.5; тест сверяет её вывод с уроком."""
    # region demo
    rng = np.random.default_rng(0)
    h = 1e-4

    def d(f, x):  # центральная разность
        return (f(x + h) - f(x - h)) / (2 * h)

    for name, a, sample, eta in [
        ("Бернулли", lambda e: np.log1p(np.exp(e)), lambda e: rng.random(200_000) < 1 / (1 + np.exp(-e)), 0.8),
        ("Пуассон ", np.exp, lambda e: rng.poisson(np.exp(e), 200_000), 1.2),
    ]:
        y = sample(eta)
        print(f"{name}: a'(η) = {d(a, eta):.4f}, среднее y = {y.mean():.4f};  a''(η) = {d(lambda e: d(a, e), eta):.4f}, дисперсия y = {y.var():.4f}")
    # endregion
