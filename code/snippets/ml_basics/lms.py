"""Пакетный, стохастический и мини-батч спуск для линейной регрессии на «Квартирах» (урок 1.2 «Основ ML»).

Регионы вставляются в урок при сборке: ``<PyCode src="ml_basics/lms.py#data+demo" run />``. Тест
``code/tests/test_lms.py`` сверяет вывод и сравнивает веса с ``LinearRegression`` и ``SGDRegressor``.
"""

import numpy as np


# region data
def apartments(n=2000, seed=2028):
    """«Квартиры»: площадь, комнат, этаж, до метро (мин), возраст дома; цена, млн ₽ (как mlf.datasets.apartments_full)."""
    rng = np.random.default_rng(seed)
    area = np.round(rng.uniform(25, 120, size=n))
    rooms = np.clip(np.round(area / 30 + rng.normal(0, 0.5, size=n)), 1, 5)
    floor = rng.integers(1, 26, size=n).astype(float)
    metro = np.round(rng.uniform(2, 40, size=n))
    age = np.round(rng.uniform(0, 70, size=n))
    X = np.column_stack([area, rooms, floor, metro, age])
    price = 1.5 + 0.11 * area + 0.4 * rooms + 0.03 * floor - 0.06 * metro - 0.02 * age + rng.normal(0, 0.8, size=n)
    return X, np.round(price, 2)


def gd(Z, y, alpha, epochs, batch=None, seed=0):
    """Спуск по J(θ) = ‖Zθ − y‖² / (2n): batch=None — пакетный, иначе мини-батчи (1 — стохастический) с перемешиванием."""
    rng = np.random.default_rng(seed)
    n, d = Z.shape
    theta = np.zeros(d)
    for _ in range(epochs):
        if batch is None:
            theta += alpha / n * Z.T @ (y - Z @ theta)
            continue
        for idx in np.array_split(rng.permutation(n), n // batch):
            theta += alpha / len(idx) * Z[idx].T @ (y[idx] - Z[idx] @ theta)
    return theta
# endregion


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока 1.2; тест сверяет её вывод с уроком."""
    # region demo
    X, y = apartments()
    mu, s = X.mean(axis=0), X.std(axis=0)  # по обучающей выборке; здесь вся выборка — обучающая
    Z = np.column_stack([np.ones(len(X)), (X - mu) / s])  # единицу не стандартизуем
    J = lambda th: 0.5 * np.mean((Z @ th - y) ** 2)
    H = Z.T @ Z / len(y)
    print(f"порог шага 2/λmax: {2 / np.linalg.eigvalsh(H).max():.3f}, число обусловленности: {np.linalg.cond(H):.1f}")

    theta_star = np.linalg.lstsq(Z, y, rcond=None)[0]
    # проверка градиента конечными разностями в случайной точке
    t, h = np.random.default_rng(1).normal(size=6), 1e-6
    grad = Z.T @ (Z @ t - y) / len(y)
    numeric = np.array([(J(t + h * e) - J(t - h * e)) / (2 * h) for e in np.eye(6)])
    print("градиент совпал с конечными разностями:", np.abs(grad - numeric).max() < 1e-6)

    for name, kw in [("пакетный", {"alpha": 0.5, "epochs": 200}), ("SGD", {"alpha": 0.01, "epochs": 20, "batch": 1}), ("мини-батч 32", {"alpha": 0.1, "epochs": 20, "batch": 32})]:
        theta = gd(Z, y, seed=0, **kw)
        print(f"{name:13s} J = {J(theta):.4f} (минимум {J(theta_star):.4f}), |θ − θ*| = {np.abs(theta - theta_star).max():.4f}")

    # веса на исходных признаках: θ_j = θ'_j / s_j, свободный член — со сдвигом
    w = theta_star[1:] / s
    b = theta_star[0] - np.sum(theta_star[1:] * mu / s)
    print("веса на исходных признаках:", np.round(np.r_[b, w], 3))
    # endregion
