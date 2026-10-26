"""Градиентный спуск и SGD на «Квартирах»: код для урока II.6 и лабораторной модуля II.

Регионы вставляются в урок и ноутбук при сборке: ``<PyCode src="calculus/gd.py#data+demo" run />``.
В уроке и в браузере пакета ``mlf`` нет, поэтому генератор данных повторён здесь (как в la/least_squares.py).
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
n = area.size
z = (area - area.mean()) / area.std()  # стандартизованная площадь: среднее 0, разброс 1
X = np.column_stack([np.ones(n), z])


def J(theta):
    """Средний квадрат ошибки пополам: J(θ) = ‖Xθ − y‖² / (2n)."""
    r = X @ theta - y
    return r @ r / (2 * n)


def grad(theta):
    return X.T @ (X @ theta - y) / n
# endregion


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — первая ячейка урока II.6; тест сверяет её вывод с уроком."""
    # region demo
    X_raw = np.column_stack([np.ones(n), area])  # площадь как есть, в м²
    for name, M in [("площадь в м²", X_raw), ("стандартизованная", X)]:
        H = M.T @ M / n  # гессиан J — постоянная матрица
        lam = np.linalg.eigvalsh(H)
        eta = 1 / lam[-1]  # половина порога 2/λ_max
        theta, steps = np.zeros(2), 0
        while np.linalg.norm(M.T @ (M @ theta - y) / n) > 1e-6 and steps < 20_000:
            theta = theta - eta * M.T @ (M @ theta - y) / n
            steps += 1
        done = f"шагов {steps}" if steps < 20_000 else "за 20000 шагов не сошёлся"
        print(f"{name}: порог η < {2 / lam[-1]:.2g}, обусловленность {lam[-1] / lam[0]:.0f}, {done}")

    theta = np.zeros(2)
    for _ in range(30):
        theta = theta - 2.1 * grad(theta)  # стандартизованная площадь, шаг выше порога 2
    print("η = 2.1:", theta.round(1))
    # endregion


def _sgd_cell() -> None:
    """Служебная обёртка: регион sgd — вторая ячейка урока II.6."""
    # region sgd
    rng = np.random.default_rng(0)
    theta = np.zeros(2)
    eta = 0.05
    ups = 0
    history = [J(theta)]
    for epoch in range(20):
        for i in rng.permutation(n):  # один объект — одна оценка градиента
            g_i = (X[i] @ theta - y[i]) * X[i]
            theta = theta - eta * g_i
            history.append(J(theta))
            ups += history[-1] > history[-2]
    print("шагов SGD:", len(history) - 1, " из них J выросла:", ups)
    print("J: старт", round(history[0], 2), "→ после 20 эпох", round(history[-1], 3))
    print("θ =", theta.round(2), " решение:", np.linalg.solve(X.T @ X, X.T @ y).round(2))
    # endregion
