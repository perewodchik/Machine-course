"""Дискретные распределения на выборке: Пуассон с E = Var и биномиальное с большим n (урок III.6).

Регион вставляется в урок при сборке: ``<PyCode src="prob/discrete.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока III.6; тест сверяет её вывод с уроком."""
    # region demo
    rng = np.random.default_rng(0)
    calls = rng.poisson(lam=3, size=100_000)  # звонков за минуту
    print("Пуассон, λ = 3:  среднее", calls.mean().round(3), " дисперсия", calls.var().round(3))

    first = rng.geometric(p=0.25, size=100_000)  # номер первого успеха
    print("геометрическое, φ = 0.25: среднее", first.mean().round(3), " (1/φ = 4)")

    # 1000 испытаний с вероятностью успеха 0.003 — почти Пуассон с λ = nφ = 3
    rare = rng.binomial(n=1000, p=0.003, size=100_000)
    for k in range(5):
        print(f"P(X = {k}): биномиальное {np.mean(rare == k):.3f}, Пуассон {np.mean(calls == k):.3f}")
    # endregion
