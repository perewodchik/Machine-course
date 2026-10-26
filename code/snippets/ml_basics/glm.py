"""Пуассоновская регрессия: просмотры объявлений за неделю (урок 1.6 «Основ ML»).

Регионы вставляются в урок при сборке: ``<PyCode src="ml_basics/glm.py#data+demo" run />``. Тест
``code/tests/test_glm.py`` сверяет вывод, веса — с ``PoissonRegressor(alpha=0)``, долю отрицательных прогнозов —
с ``LinearRegression``.
"""

import numpy as np


# region data
def ad_views(n=2000, seed=2030):
    """Фото, цена к медиане района, площадь; просмотры за неделю (как mlf.datasets.ad_views)."""
    rng = np.random.default_rng(seed)
    photos = rng.integers(0, 16, size=n).astype(float)
    rel = np.round(np.clip(rng.normal(1, 0.15, size=n), 0.6, 1.5), 2)
    area = np.round(rng.uniform(25, 120, size=n))
    eta = 0.4 + 0.12 * (photos - 5) - 2.5 * (rel - 1) + 0.01 * (area - 70)
    return np.column_stack([photos, rel, area]), rng.poisson(np.exp(eta)).astype(float)


def poisson_newton(X, y, tol=1e-8):
    """Максимум ℓ(θ) = Σ [yθᵀx − exp(θᵀx)] методом Ньютона; старт — свободный член log ȳ, остальные нули."""
    theta = np.zeros(X.shape[1])
    theta[0] = np.log(y.mean())
    for k in range(1, 50):
        lam = np.exp(X @ theta)
        step = np.linalg.solve(X.T @ (X * lam[:, None]), X.T @ (y - lam))  # (XᵀDX)⁻¹∇ℓ, D = diag(λ)
        theta += step
        if np.abs(step).max() < tol:
            return theta, k
    return theta, k
# endregion


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока 1.6; тест сверяет её вывод с уроком."""
    # region demo
    F, y = ad_views()
    X = np.column_stack([np.ones(len(y)), F])
    print(f"просмотров в среднем: {y.mean():.2f}, объявлений без просмотров: {np.mean(y == 0):.1%}")

    theta, k = poisson_newton(X, y)
    print(f"Ньютон: {k} итераций, θ = {np.round(theta, 3)}")
    print("градиент Xᵀ(y − λ) в максимуме равен нулю:", np.abs(X.T @ (y - np.exp(X @ theta))).max() < 1e-6)
    print(f"ещё одно фото умножает прогноз на e^θ₁ = {np.exp(theta[1]):.3f}")

    w = np.linalg.lstsq(X, y, rcond=None)[0]  # линейная регрессия на тех же признаках
    print(f"отрицательных прогнозов: у линейной {np.mean(X @ w < 0):.1%}, у пуассоновской {np.mean(np.exp(X @ theta) < 0):.1%}")
    # endregion
