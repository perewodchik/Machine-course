"""Числа урока 1.3 «Основ ML»: вывод ячейки; poly_features совпадает с PolynomialFeatures; LWR — с взвешенной
LinearRegression (sample_weight) в каждой точке и с обычной LinearRegression в пределе τ → ∞; данные — mlf.datasets."""

from itertools import pairwise

import numpy as np
from ml_basics.features_lwr import _lesson_cell, lwr, metro_prices, poly_features
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures

from mlf.datasets import metro_prices as course_metro_prices


def test_lesson_cell_output(capsys):
    """Ячейка урока 1.3 (<PyCode src="ml_basics/features_lwr.py#data+tools+demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "степень  RMSE обуч.  RMSE вал.\n"
        "     1       20.22      22.29\n"
        "     2       14.64      19.20\n"
        "     3       10.58      12.24\n"
        "     4       10.55      11.98\n"
        "     6       10.46      12.17\n"
        "     9       10.41      12.52\n"
        "    12        9.86      12.48\n"
        "τ, мин   RMSE обуч.  RMSE вал.\n"
        "   0.5        6.93      12.76\n"
        "     1        9.17      12.25\n"
        "     2       10.20      12.54\n"
        "     5       11.66      15.55\n"
        "    10       14.11      18.31\n"
        "   100       20.10      22.21\n"
        "LWR при τ = 10⁵ в 20 мин: 222.056  прямая МНК: 222.056\n"
    )


def test_data_is_course_dataset():
    for a, b in zip(metro_prices(), course_metro_prices()):
        np.testing.assert_array_equal(a, b)


def test_poly_features_match_sklearn():
    z = np.random.default_rng(3).normal(size=20)
    for p in (1, 3, 7):
        np.testing.assert_allclose(poly_features(z, p), PolynomialFeatures(p).fit_transform(z[:, None]))


def test_lwr_is_weighted_least_squares():
    x, y = metro_prices()
    for q, tau in [(3, 1.0), (20, 2.0), (35, 5.0)]:
        w = np.exp(-((x - q) ** 2) / (2 * tau**2))
        lr = LinearRegression().fit(x[:, None], y, sample_weight=w)
        assert abs(lwr(q, x, y, tau) - lr.predict([[q]])[0]) < 1e-6


def test_lwr_large_tau_is_linear_regression():
    x, y = metro_prices()
    lr = LinearRegression().fit(x[:, None], y)
    for q in (5, 20, 33):
        pred, ref = lwr(q, x, y, 1e5), lr.predict([[q]])[0]
        assert abs(pred - ref) / abs(ref) < 1e-5  # пять значащих цифр


def test_validation_picks_middle_complexity():
    """Минимум валидационной ошибки — в середине: степень 4 и τ = 1 мин; на обучении ошибка падает с гибкостью."""
    x, y = metro_prices()
    idx = np.random.default_rng(0).permutation(len(x))
    tr, va = idx[:56], idx[56:]
    z = (x - x[tr].mean()) / x[tr].std()
    val = {}
    train = []
    for p in range(1, 13):
        Phi = poly_features(z, p)
        th = np.linalg.lstsq(Phi[tr], y[tr], rcond=None)[0]
        val[p] = np.sqrt(np.mean((Phi[va] @ th - y[va]) ** 2))
        train.append(np.sqrt(np.mean((Phi[tr] @ th - y[tr]) ** 2)))
    assert min(val, key=val.get) == 4
    assert all(a >= b - 1e-9 for a, b in pairwise(train))


def test_site_widget_data_matches_generator():
    """Данные виджета «Гибкость модели» (src/widgets/ml/flexibility/data.json) — тот же генератор, что в уроке."""
    import json
    from pathlib import Path

    x, y = course_metro_prices()
    data = json.loads((Path(__file__).resolve().parents[2] / "src/widgets/ml/flexibility/data.json").read_text(encoding="utf-8"))
    assert data["x"] == x.tolist() and data["y"] == y.tolist()
    assert data["train"] == sorted(np.random.default_rng(0).permutation(len(x))[:56].tolist())
