"""Гребневая регрессия и лассо с нуля: центрирование, мягкий порог, покоординатный спуск, путь (урок 2.3 «Основ ML»).

Регионы вставляются в урок при сборке: ``<PyCode src="ml_basics/regularization.py#data+tools+demo" run />``. Тест
``code/tests/test_regularization.py`` сверяет вывод, гребневую — с ``Ridge`` до 1e-8, лассо — с ``Lasso`` до 1e-6 и
``lasso_path``.
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
# endregion


# region tools
def ridge(X, y, lam):
    """min ½‖Xθ − y‖² + ½λ‖θ‖² без штрафа на свободный член: центрирование, затем (XᵀX + λI)θ = Xᵀy."""
    mx, my = X.mean(axis=0), y.mean()
    Xc, yc = X - mx, y - my
    theta = np.linalg.solve(Xc.T @ Xc + lam * np.eye(X.shape[1]), Xc.T @ yc)
    return my - mx @ theta, theta


def soft(z, lam):
    return np.sign(z) * np.maximum(np.abs(z) - lam, 0)


def lasso(X, y, lam, theta=None, sweeps=1000, tol=1e-12):
    """min ‖Xθ − y‖²/(2n) + λ‖θ‖₁ покоординатным спуском (как Lasso(alpha=λ)); theta — тёплый старт."""
    n, d = X.shape
    mx, my = X.mean(axis=0), y.mean()
    Xc, yc = X - mx, y - my
    theta = np.zeros(d) if theta is None else theta.copy()
    norms = (Xc**2).sum(axis=0) / n
    r = yc - Xc @ theta
    for _ in range(sweeps):
        change = 0.0
        for j in range(d):
            old = theta[j]
            rho = Xc[:, j] @ r / n + norms[j] * old  # Xⱼᵀ r⁽ʲ⁾ / n — остаток без признака j
            theta[j] = soft(rho, lam) / norms[j]
            r -= Xc[:, j] * (theta[j] - old)
            change = max(change, abs(theta[j] - old))
        if change < tol:
            break
    return my - mx @ theta, theta
# endregion


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока 2.3; тест сверяет её вывод с уроком."""
    # region demo
    X, y = apartments()
    noise = np.random.default_rng(7).normal(size=(len(y), 20))  # 20 признаков чистого шума
    F = np.column_stack([X, noise])
    tr = np.arange(len(y)) < 1500
    mu, s = F[tr].mean(axis=0), F[tr].std(axis=0)  # по обучающей части
    Z = (F - mu) / s

    for lam in [0.01, 0.05, 0.2]:
        b, theta = lasso(Z[tr], y[tr], lam)
        rmse = np.sqrt(np.mean((b + Z[~tr] @ theta - y[~tr]) ** 2))
        print(f"лассо λ = {lam:4}: ненулевых весов {np.sum(theta != 0):2d} из 25, шумовых {np.sum(theta[5:] != 0):2d}, RMSE на проверке {rmse:.3f}")
    b, theta = ridge(Z[tr], y[tr], 10.0)
    print(f"гребневая λ = 10: ненулевых весов {np.sum(theta != 0)} из 25, наибольший шумовой |θ| = {np.abs(theta[5:]).max():.3f}")

    # путь: при каком λ вес признака впервые становится ненулевым (спуск от больших λ с тёплым стартом)
    theta, first = np.zeros(25), {}
    for lam in np.geomspace(5, 0.005, 80):
        _, theta = lasso(Z[tr], y[tr], lam, theta)
        for j in np.flatnonzero(theta):
            first.setdefault(int(j), lam)
    names = ["площадь", "комнат", "этаж", "метро", "возраст"]
    print("входят в модель по очереди:", ", ".join(f"{names[j]} ({first[j]:.2f})" for j in sorted(first, key=first.get, reverse=True)[:5]))
    # endregion
