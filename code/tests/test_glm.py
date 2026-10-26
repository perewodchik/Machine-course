"""Числа урока 1.6 «Основ ML»: вывод ячейки; веса Ньютона совпадают с PoissonRegressor(alpha=0) до 1e-3 (по
умолчанию там штраф alpha=1); у линейной регрессии есть отрицательные прогнозы, и пуассоновская девиация на них не
считается; σ² гауссовой GLM не меняет θ̂; данные — mlf.datasets.ad_views."""

import numpy as np
import pytest
from ml_basics.glm import _lesson_cell, ad_views, poisson_newton
from sklearn.linear_model import LinearRegression, PoissonRegressor
from sklearn.metrics import mean_poisson_deviance

from mlf.datasets import ad_views as course_ad_views


def test_lesson_cell_output(capsys):
    """Ячейка урока 1.6 (<PyCode src="ml_basics/glm.py#data+demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "просмотров в среднем: 2.80, объявлений без просмотров: 18.5%\n"
        "Ньютон: 6 итераций, θ = [ 1.506  0.122 -2.42   0.01 ]\n"
        "градиент Xᵀ(y − λ) в максимуме равен нулю: True\n"
        "ещё одно фото умножает прогноз на e^θ₁ = 1.130\n"
        "отрицательных прогнозов: у линейной 7.8%, у пуассоновской 0.0%\n"
    )


def test_data_is_course_dataset():
    for a, b in zip(ad_views(), course_ad_views()):
        np.testing.assert_array_equal(a, b)


def test_newton_matches_poisson_regressor_without_penalty():
    F, y = ad_views()
    theta, _ = poisson_newton(np.column_stack([np.ones(len(y)), F]), y)
    sk = PoissonRegressor(alpha=0, tol=1e-12, max_iter=10_000).fit(F, y)
    np.testing.assert_allclose(theta[1:], sk.coef_, atol=1e-3)
    assert abs(theta[0] - sk.intercept_) < 1e-3
    default = PoissonRegressor().fit(F, y)  # штраф alpha=1 сжимает веса
    assert np.abs(default.coef_).sum() < np.abs(sk.coef_).sum()


def test_linear_regression_negative_predictions_break_deviance():
    F, y = ad_views()
    pred = LinearRegression().fit(F, y).predict(F)
    assert np.mean(pred < 0) > 0.05
    with pytest.raises(ValueError):
        mean_poisson_deviance(y, pred)


def test_gaussian_glm_variance_does_not_change_theta():
    rng = np.random.default_rng(0)
    X = np.column_stack([np.ones(50), rng.normal(size=50)])
    y = 2 + 3 * X[:, 1] + rng.normal(size=50)
    # ℓ = −‖y − Xθ‖²/(2σ²) + const: максимум при любом σ² — решение нормальных уравнений
    for s2 in (1.0, 4.0):
        theta = np.linalg.solve(X.T @ X / s2, X.T @ y / s2)
        np.testing.assert_allclose(theta, np.linalg.lstsq(X, y, rcond=None)[0])


def test_site_widget_data_matches_generator():
    """Данные «Конструктора GLM» (src/widgets/ml/glm-builder/data.json) — те же генераторы, что в уроках."""
    import json
    from pathlib import Path

    from mlf.datasets import apartments_full

    X, price = apartments_full()
    F, views = course_ad_views()
    data = json.loads((Path(__file__).resolve().parents[2] / "src/widgets/ml/glm-builder/data.json").read_text(encoding="utf-8"))
    assert data["normal"]["x"] == X[:200, 0].tolist() and data["normal"]["y"] == price[:200].tolist()
    assert data["bernoulli"]["y"] == (price[:200] > np.median(price)).astype(int).tolist()
    assert data["poisson"]["x"] == F[:200, 0].tolist() and data["poisson"]["y"] == views[:200].astype(int).tolist()
    assert data["categorical"]["y"] == np.digitize(price, np.quantile(price, [1 / 3, 2 / 3]))[:200].tolist()
