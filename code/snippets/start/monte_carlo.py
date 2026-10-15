"""Интеграл методом Монте-Карло: код для урока 0.7.

Регионы вставляются в урок при сборке (``<PyCode src="start/monte_carlo.py#estimate+demo" run />``).
"""

import numpy as np


# region estimate
def monte_carlo(f, a, b, n, seed=0):
    """∫ₐᵇ f ≈ (b − a) · среднее f в n случайных точках отрезка."""
    rng = np.random.default_rng(seed)
    x = rng.uniform(a, b, size=n)
    return (b - a) * np.mean(f(x))
# endregion


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока 0.7; тест сверяет её вывод с уроком."""
    # region demo
    def f(x):
        return np.exp(-x**2 / 2)

    for n in [100, 10_000, 1_000_000]:
        print(f"n = {n:>9}: {monte_carlo(f, -6, 6, n):.4f}")
    print("√(2π) =      ", round(np.sqrt(2 * np.pi), 4))
    # endregion
