"""Минимум NumPy: код для урока 0.8 и лабораторной «NumPy за час» (notebooks/src/start/numpy_minimum.py).

Регионы вставляются в урок при сборке (``<PyCode src="start/numpy_minimum.py#loop+vectorized+demo" run />``)
и в лабораторную директивой ``# snippet:``.
"""

import numpy as np


# region data
def make_data(n=500, d=3, seed=0):
    """Признаки X (n × d), веса theta (d,) и ответы y (n,) с шумом."""
    rng = np.random.default_rng(seed)
    X = rng.normal(size=(n, d))
    theta = np.arange(1, d + 1, dtype=float)
    y = X @ theta + rng.normal(scale=0.5, size=n)
    return X, y, theta
# endregion


# region loop
def loss_loop(X, y, theta):
    """J(θ) = ½ Σᵢ (θᵀx⁽ⁱ⁾ − y⁽ⁱ⁾)²: циклы по объектам и признакам."""
    total = 0.0
    for i in range(X.shape[0]):
        pred = 0.0
        for j in range(X.shape[1]):
            pred += X[i, j] * theta[j]
        total += (pred - y[i]) ** 2
    return 0.5 * total
# endregion


# region vectorized
def loss_vec(X, y, theta):
    """То же без циклов."""
    r = X @ theta - y
    return 0.5 * r @ r
# endregion


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока 0.8; тест сверяет её вывод с уроком."""
    # region demo
    X, y, theta = make_data()
    print("X:", X.shape, " y:", y.shape, " theta:", theta.shape)
    print("цикл:    ", round(loss_loop(X, y, theta), 4))
    print("векторно:", round(loss_vec(X, y, theta), 4))
    # endregion
