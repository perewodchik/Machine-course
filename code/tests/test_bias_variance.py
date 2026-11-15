"""Числа урока 2.2 «Основ ML»: вывод ячейки; предсказания полиномов совпадают с make_pipeline(PolynomialFeatures,
LinearRegression); σ² + смещение² + разброс совпадает с ошибкой на свежих точках в пределах погрешности Монте-Карло;
разброс МНК в обучающих точках — σ²d/n; оценка смещения² по B выборкам завышена на разброс/B."""

import numpy as np
from ml_basics.bias_variance import _lesson_cell, cloud, draw, fit_predict, h_star
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures


def test_lesson_cell_output(capsys):
    """Ячейка урока 2.2 (<PyCode src="ml_basics/bias_variance.py#tools+demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "степень  смещение²  разброс   σ²+смещ²+разбр  ошибка на свежих\n"
        "      1     0.0787   0.0137          0.1824            0.1778\n"
        "      3     0.0008   0.0159          0.1067            0.1046\n"
        "      5     0.0003   0.0417          0.1320            0.1285\n"
        "      9     0.0639   6.0815          6.2354            5.4400\n"
        "степень 1: средний разброс в обучающих точках 0.0059, σ²d/n = 0.0060\n"
        "степень 5: средний разброс в обучающих точках 0.0180, σ²d/n = 0.0180\n"
    )


def test_predictions_match_sklearn_pipeline():
    x, y = draw(np.random.default_rng(3), 30, 0.3)
    grid = np.linspace(-1, 1, 50)
    for degree in (1, 3, 7):
        sk = make_pipeline(PolynomialFeatures(degree), LinearRegression()).fit(x[:, None], y)
        np.testing.assert_allclose(fit_predict(x, y, degree, grid), sk.predict(grid[:, None]), atol=1e-6)


def test_decomposition_matches_fresh_error():
    sigma, n = 0.3, 30
    x_new, y_new = draw(np.random.default_rng(1), 10_000, sigma)
    for degree in (1, 3, 5):
        bias2, var, _ = cloud(degree, n, sigma, B=400)
        rng = np.random.default_rng(0)
        test = np.mean([np.mean((fit_predict(*draw(rng, n, sigma), degree, x_new) - y_new) ** 2) for _ in range(400)])
        assert abs(sigma**2 + bias2 + var - test) / test < 0.05


def test_bias_estimate_inflated_by_variance_over_b():
    """Для истины в классе (прямая, степень 1) смещение 0, а оценка по B выборкам — около разброс/B."""
    rng = np.random.default_rng(5)
    grid = np.linspace(-1, 1, 50)
    B, n, sigma = 20, 15, 1.0
    est, var = [], []
    for _ in range(300):
        xs = [rng.uniform(-1, 1, n) for _ in range(B)]
        P = np.array([fit_predict(x, 2 * x + rng.normal(0, sigma, n), 1, grid) for x in xs])
        est.append(np.mean((P.mean(axis=0) - 2 * grid) ** 2))
        var.append(np.mean(P.var(axis=0, ddof=1)))
    assert abs(np.mean(est) - np.mean(var) / B) / (np.mean(var) / B) < 0.1
    assert h_star(0.0) == 0.0
