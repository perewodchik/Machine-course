"""Метод Монте-Карло и его ошибка σ/√n, ЦПТ для суммы показательных величин (урок III.8).

Регион вставляется в урок при сборке: ``<PyCode src="prob/limits.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока III.8; тест сверяет её вывод с уроком."""
    # region demo
    rng = np.random.default_rng(0)
    exact = 0.746824  # ∫₀¹ e^(−x²) dx, считали численно
    for n in (100, 10_000, 1_000_000):
        g = np.exp(-rng.uniform(size=n) ** 2)  # g(U), U равномерна на [0, 1]: E g(U) — интеграл
        print(f"n = {n:>7}: оценка {g.mean():.5f}, ошибка {abs(g.mean() - exact):.5f}, σ/√n = {g.std() / np.sqrt(n):.5f}")

    # ЦПТ: сумма 30 показательных величин против одной
    for k in (1, 30):
        s = rng.exponential(size=(100_000, k)).sum(axis=1)
        z = (s - k) / np.sqrt(k)  # μ = 1, σ² = 1 у каждого слагаемого
        print(f"k = {k:>2}: доля |Z| ≤ 1 — {np.mean(np.abs(z) <= 1):.3f}, доля Z > 2 — {np.mean(z > 2):.4f}")
    # endregion
