"""МНК как проекция на данных «Квартиры»: код для капстоуна I.12 и лабораторной.

Регионы вставляются в урок и ноутбук при сборке: ``<PyCode src="la/least_squares.py#data+demo" run />``.
В уроке и в браузере пакета ``mlf`` нет, поэтому генератор данных повторён здесь; тест сверяет его
с ``mlf.datasets.apartments``.
"""

import numpy as np


# region data
def apartments(n: int = 16, seed: int = 2026):
    """«Квартиры» из урока 0.1: площадь, м², и цена, млн ₽."""
    rng = np.random.default_rng(seed)
    area = np.round(rng.uniform(28, 110, size=n))
    price = np.round(1.5 + 0.12 * area + rng.normal(0, 0.9, size=n), 1)
    return area, price


area, y = apartments()
X = np.column_stack([np.ones_like(area), area])  # 16 × 2: столбец единиц и площадь
# endregion


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока I.12; тест сверяет её вывод с уроком."""
    # region demo
    theta = np.linalg.solve(X.T @ X, X.T @ y)  # нормальные уравнения
    print("θ̂ =", theta.round(3))
    print("как у lstsq:", np.allclose(theta, np.linalg.lstsq(X, y, rcond=None)[0]))
    r = y - X @ theta  # остаток
    print("Xᵀr ≈ 0:", np.allclose(X.T @ r, 0), " сумма остатков:", round(float(r.sum()), 6) + 0.0)
    print("квартира 75 м²:", round(float(theta @ [1, 75]), 2), "млн ₽")
    # endregion


def _dependent_cell() -> None:
    """Служебная обёртка: регион dup — вторая ячейка урока I.12, зависимые признаки."""
    # region dup
    X3 = np.column_stack([X, 10.764 * area])  # та же площадь в квадратных футах
    print("ранг X3:", np.linalg.matrix_rank(X3), "из", X3.shape[1])
    theta3 = np.linalg.pinv(X3) @ y  # решение наименьшей нормы
    print("θ⁺ =", theta3.round(4))
    print("ŷ тот же:", np.allclose(X3 @ theta3, X @ np.linalg.lstsq(X, y, rcond=None)[0]))
    print("как у lstsq:", np.allclose(theta3, np.linalg.lstsq(X3, y, rcond=None)[0]))
    # endregion
