"""Логистическая регрессия: градиентный подъём и метод Ньютона на «Квартирах» (урок 1.4 «Основ ML»).

Регионы вставляются в урок при сборке: ``<PyCode src="ml_basics/logistic.py#data+tools+demo" run />``. Тест
``code/tests/test_logistic.py`` сверяет вывод и веса с ``LogisticRegression(C=np.inf)``.
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


def expensive(n=200):
    """Первые n квартир: признаки «площадь» и «до метро», класс 1 — дороже медианы всех 2000."""
    X, price = apartments()
    return X[:n][:, [0, 3]], (price[:n] > np.median(price)).astype(float)
# endregion


# region tools
def sigmoid(z):
    return 0.5 * (1 + np.tanh(z / 2))  # то же, что 1/(1 + e^(−z)), без переполнения при больших |z|


def loglik(theta, X, y):
    """ℓ(θ) = −Σ log(1 + exp(−ỹ θᵀx)), ỹ = 2y − 1: logaddexp не теряет точность при больших |θᵀx|."""
    return -np.sum(np.logaddexp(0, -(2 * y - 1) * (X @ theta)))


def grad(theta, X, y):
    return X.T @ (y - sigmoid(X @ theta))


def newton(X, y, tol=1e-6):
    theta, k = np.zeros(X.shape[1]), 0
    while np.linalg.norm(grad(theta, X, y)) >= tol:
        h = sigmoid(X @ theta)
        H = X.T @ (X * (h * (1 - h))[:, None])  # XᵀDX — минус гессиан
        theta = theta + np.linalg.solve(H, grad(theta, X, y))
        k += 1
    return theta, k


def ascent(X, y, alpha, tol=1e-6, max_iter=100_000):
    """Подъём по ℓ/n: θ := θ + α Xᵀ(y − g(Xθ))/n."""
    theta, k = np.zeros(X.shape[1]), 0
    while np.linalg.norm(grad(theta, X, y)) >= tol and k < max_iter:
        theta = theta + alpha * grad(theta, X, y) / len(y)
        k += 1
    return theta, k
# endregion


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока 1.4; тест сверяет её вывод с уроком."""
    # region demo
    F, y = expensive()
    mu, s = F.mean(axis=0), F.std(axis=0)
    X = np.column_stack([np.ones(len(y)), (F - mu) / s])  # единица и стандартизованные площадь и метро

    t, h = np.random.default_rng(1).normal(size=3), 1e-6
    numeric = np.array([(loglik(t + h * e, X, y) - loglik(t - h * e, X, y)) / (2 * h) for e in np.eye(3)])
    print("градиент совпал с конечными разностями:", np.abs(grad(t, X, y) - numeric).max() < 1e-4)

    theta_n, k_n = newton(X, y)
    theta_a, k_a = ascent(X, y, alpha=2.0)
    print(f"Ньютон:  {k_n:5d} итераций, θ = {np.round(theta_n, 3)}")
    print(f"подъём:  {k_a:5d} итераций, θ = {np.round(theta_a, 3)}")
    print(f"ℓ/n в максимуме: {loglik(theta_n, X, y) / len(y):.4f}, доля верных: {np.mean((X @ theta_n > 0) == (y == 1)):.3f}")
    p = sigmoid(X[:3] @ theta_n)
    print("вероятности первых трёх:", np.round(p, 3), " при 10θ:", np.round(sigmoid(X[:3] @ (10 * theta_n)), 3))
    # endregion
