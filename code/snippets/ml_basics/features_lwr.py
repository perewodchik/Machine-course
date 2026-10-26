"""Полиномиальные признаки и локально взвешенная регрессия на ценах у метро (урок 1.3 «Основ ML»).

Регионы вставляются в урок при сборке: ``<PyCode src="ml_basics/features_lwr.py#data+tools+demo" run />``. Тест
``code/tests/test_features_lwr.py`` сверяет вывод, ``poly_features`` — с ``PolynomialFeatures``, предел LWR — с
``LinearRegression``.
"""

import numpy as np


# region data
def metro_prices(n=80, seed=2029):
    """Цена м², тыс. ₽, от пути пешком до метро, мин (как mlf.datasets.metro_prices)."""
    rng = np.random.default_rng(seed)
    x = np.round(rng.uniform(1, 40, size=n) * 2) / 2
    y = 200 + 150 * np.exp(-x / 6) + 25 * np.exp(-(((x - 28) / 4) ** 2)) + rng.normal(0, 10, size=n)
    return x, np.round(y)
# endregion


# region tools
def poly_features(z, p):
    """Φ: столбцы 1, z, z², …, z^p — признаки для полинома степени p (z лучше стандартизовать)."""
    return np.column_stack([z**k for k in range(p + 1)])


def lwr(x_query, x, y, tau):
    """Прогноз LWR в точке x_query: взвешенный МНК по прямой θ₀ + θ₁x с весами exp(−(xᵢ − x)²/(2τ²))."""
    X = np.column_stack([np.ones(len(x)), x])
    w = np.exp(-((x - x_query) ** 2) / (2 * tau**2))
    XtW = X.T * w  # то же, что X.T @ np.diag(w), без матрицы n × n
    theta = np.linalg.solve(XtW @ X, XtW @ y)
    return theta[0] + theta[1] * x_query


def rmse(pred, y):
    return np.sqrt(np.mean((pred - y) ** 2))
# endregion


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока 1.3; тест сверяет её вывод с уроком."""
    # region demo
    x, y = metro_prices()
    idx = np.random.default_rng(0).permutation(len(x))
    tr, va = idx[:56], idx[56:]  # 56 — обучение, 24 — валидация
    mu, s = x[tr].mean(), x[tr].std()
    z = (x - mu) / s  # степени стандартизованного признака, а не сырых минут

    print("степень  RMSE обуч.  RMSE вал.")
    for p in [1, 2, 3, 4, 6, 9, 12]:
        Phi = poly_features(z, p)
        theta = np.linalg.lstsq(Phi[tr], y[tr], rcond=None)[0]
        print(f"{p:6d}  {rmse(Phi[tr] @ theta, y[tr]):10.2f}  {rmse(Phi[va] @ theta, y[va]):9.2f}")

    print("τ, мин   RMSE обуч.  RMSE вал.")
    for tau in [0.5, 1, 2, 5, 10, 100]:
        fit = [lwr(q, x[tr], y[tr], tau) for q in x[tr]]
        val = [lwr(q, x[tr], y[tr], tau) for q in x[va]]
        print(f"{tau:6g}  {rmse(np.array(fit), y[tr]):10.2f}  {rmse(np.array(val), y[va]):9.2f}")

    # предел τ → ∞: все веса равны единице, LWR — обычная прямая МНК
    line = np.polyfit(x[tr], y[tr], 1)
    print("LWR при τ = 10⁵ в 20 мин:", round(lwr(20, x[tr], y[tr], 1e5), 3), " прямая МНК:", round(np.polyval(line, 20), 3))
    # endregion
