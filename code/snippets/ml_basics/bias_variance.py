"""Смещение и разброс: облако из 100 полиномов на 100 выборках (урок 2.2 «Основ ML»).

Регионы вставляются в урок при сборке: ``<PyCode src="ml_basics/bias_variance.py#tools+demo" run />``. Тест
``code/tests/test_bias_variance.py`` сверяет вывод, предсказания — с ``make_pipeline(PolynomialFeatures,
LinearRegression)``, сумму слагаемых — с ошибкой на свежих точках, разброс МНК — с σ²d/n.
"""

import numpy as np


# region tools
def h_star(x):
    return np.sin(2.5 * x) + 0.3 * x  # истина: известна, потому что данные мы порождаем сами


def draw(rng, n, sigma):
    x = rng.uniform(-1, 1, size=n)
    return x, h_star(x) + rng.normal(0, sigma, size=n)


def fit_predict(x, y, degree, grid):
    """Полином степени degree по МНК (lstsq), значения на сетке."""
    theta = np.linalg.lstsq(np.vander(x, degree + 1), y, rcond=None)[0]
    return np.vander(grid, degree + 1) @ theta


GRID = np.linspace(-1, 1, 200)


def cloud(degree, n, sigma, B=100, seed=0, grid=GRID):
    """B моделей на B выборках: смещение² и разброс, усреднённые по сетке."""
    rng = np.random.default_rng(seed)
    P = np.array([fit_predict(*draw(rng, n, sigma), degree, grid) for _ in range(B)])
    bias2 = np.mean((P.mean(axis=0) - h_star(grid)) ** 2)
    var = np.mean(P.var(axis=0))
    return bias2, var, P
# endregion


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока 2.2; тест сверяет её вывод с уроком."""
    # region demo
    n, sigma = 30, 0.3
    rng = np.random.default_rng(1)
    x_new, y_new = draw(rng, 10_000, sigma)  # свежие точки для проверки разложения
    print("степень  смещение²  разброс   σ²+смещ²+разбр  ошибка на свежих")
    for degree in [1, 3, 5, 9]:
        bias2, var, _ = cloud(degree, n, sigma)
        rng_s = np.random.default_rng(0)  # те же 100 выборок
        test = np.mean([np.mean((fit_predict(*draw(rng_s, n, sigma), degree, x_new) - y_new) ** 2) for _ in range(100)])
        print(f"{degree:7d}  {bias2:9.4f}  {var:7.4f}  {sigma**2 + bias2 + var:14.4f}  {test:16.4f}")

    # разброс МНК в обучающих точках при фиксированных x: σ²·d/n, d — число весов
    x_fix = np.linspace(-1, 1, n)
    for degree in [1, 5]:
        preds = np.array([fit_predict(x_fix, h_star(x_fix) + rng.normal(0, sigma, n), degree, x_fix) for _ in range(2000)])
        print(f"степень {degree}: средний разброс в обучающих точках {preds.var(axis=0).mean():.4f}, σ²d/n = {sigma**2 * (degree + 1) / n:.4f}")
    # endregion
