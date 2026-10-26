"""MLE на числах: произведение 1000 вероятностей уходит в ноль, сумма логарифмов — нет; максимум ℓ на сетке
совпадает с формулой λ̂ = x̄ (урок IV.3).

Регион вставляется в урок при сборке: ``<PyCode src="stats/mle.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока IV.3; тест сверяет её вывод с уроком."""
    # region demo
    rng = np.random.default_rng(0)
    x = rng.poisson(3.0, size=1000)  # звонки за минуту в 1000 разных минут

    def pmf(k, lam):  # функция вероятности Пуассона через логарифмы, чтобы не считать 20!
        return np.exp(k * np.log(lam) - lam - np.array([np.sum(np.log(np.arange(1, j + 1))) for j in k]))

    print("произведение вероятностей:", np.prod(pmf(x, 3.0)))  # underflow
    print("сумма логарифмов:", np.sum(np.log(pmf(x, 3.0))).round(2))

    grid = np.arange(0.5, 6.0, 0.01)
    ell = np.array([np.sum(x) * np.log(lam) - len(x) * lam for lam in grid])  # ℓ(λ) без константы
    print("максимум на сетке: λ =", grid[np.argmax(ell)].round(2), "  формула x̄ =", x.mean())
    # endregion
