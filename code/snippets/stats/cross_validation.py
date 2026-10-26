"""Переобучение, k-кратная кросс-валидация и разложение ошибки на шум, смещение² и разброс (урок IV.7).

Регион вставляется в урок при сборке: ``<PyCode src="stats/cross_validation.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока IV.7; тест сверяет её вывод с уроком."""
    # region demo
    rng = np.random.default_rng(1)
    f = lambda x: np.sin(np.pi * x)  # истинная зависимость h*(x)
    sigma = 0.25
    n = 20
    x = rng.uniform(-1, 1, n)
    y = f(x) + rng.normal(0, sigma, n)
    x_new = rng.uniform(-1, 1, 2000)  # «новые данные» — чтобы увидеть настоящий риск
    y_new = f(x_new) + rng.normal(0, sigma, 2000)

    def fit(x, y, deg):
        return np.polyfit(x, y, deg)

    def mse(coef, x, y):
        return np.mean((np.polyval(coef, x) - y) ** 2)

    folds = np.array_split(rng.permutation(n), 5)  # 5-кратная кросс-валидация
    for deg in [1, 3, 6]:
        cv = np.mean([mse(fit(np.delete(x, idx), np.delete(y, idx), deg), x[idx], y[idx]) for idx in folds])
        coef = fit(x, y, deg)
        print(f"степень {deg}: обучение {mse(coef, x, y):.3f}, CV {cv:.3f}, новые данные {mse(coef, x_new, y_new):.3f}")

    # разложение в точке x0 = 0.5 по 2000 обучающим выборкам
    x0 = 0.5
    for deg in [1, 3, 7]:
        preds = []
        for _ in range(2000):
            xs = rng.uniform(-1, 1, n)
            preds.append(np.polyval(fit(xs, f(xs) + rng.normal(0, sigma, n), deg), x0))
        preds = np.array(preds)
        bias2, var = (f(x0) - preds.mean()) ** 2, preds.var()
        print(f"степень {deg}: шум {sigma**2:.4f} + смещение² {bias2:.4f} + разброс {var:.4f} = {sigma**2 + bias2 + var:.4f}")
    # endregion
