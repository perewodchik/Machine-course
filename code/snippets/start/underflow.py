"""Underflow и логарифм правдоподобия: код для урока 0.5.

Регионы вставляются в урок при сборке (``<PyCode src="start/underflow.py#logsumexp+demo" run />``);
ячейка урока молча выполняет весь файл, затем показанные регионы.
"""

import numpy as np


# region logsumexp
def logsumexp(z):
    """log Σ exp(zᵢ) без переполнения: вынести за скобку exp(max z)."""
    m = np.max(z)
    return m + np.log(np.sum(np.exp(z - m)))
# endregion


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока 0.5; тест сверяет её вывод с уроком."""
    # region demo
    p = np.full(1100, 0.5)  # вероятности правильных ответов 1100 объектов
    print("произведение:", np.prod(p))
    print("сумма логарифмов:", round(np.sum(np.log(p)), 2))

    z = np.array([1000.0, 1001.0, 1002.0])
    with np.errstate(over="ignore"):  # exp(1000) не помещается во float64
        print("log Σ exp напрямую:", np.log(np.sum(np.exp(z))))
    print("log Σ exp со сдвигом:", round(logsumexp(z), 4))
    # endregion
