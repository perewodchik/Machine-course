"""Некоррелированные, но зависимые X и X²; закон полного матожидания на симуляции (урок III.9).

Регион вставляется в урок при сборке: ``<PyCode src="prob/covariance.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока III.9; тест сверяет её вывод с уроком."""
    # region demo
    rng = np.random.default_rng(0)
    x = rng.uniform(-1, 1, size=200_000)
    y = x ** 2  # Y — функция от X: зависимость полная
    print("корреляция X и X²:", np.corrcoef(x, y)[0, 1].round(3))
    print("P(Y > 0.5) =", np.mean(y > 0.5).round(3), "  P(Y > 0.5 | X > 0.8) =", np.mean(y[x > 0.8] > 0.5))

    # закон полного матожидания: время ответа сервера при обычной (70 %) и высокой (30 %) нагрузке
    busy = rng.random(200_000) < 0.3
    t = np.where(busy, rng.exponential(scale=5, size=200_000), rng.exponential(scale=1, size=200_000))
    print("E T по выборке:", t.mean().round(2), "  0.7 · 1 + 0.3 · 5 =", 0.7 * 1 + 0.3 * 5)
    # endregion
