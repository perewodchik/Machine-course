"""Числа урока 1.4 «Основ ML»: вывод ячейки; веса Ньютона и подъёма совпадают с LogisticRegression без штрафа
(C=np.inf) до 1e-3; число итераций Ньютона не меняется при линейной замене признаков, подъёма — меняется;
на разделимых данных ℓ растёт с ‖θ‖ без предела; данные — mlf.datasets.apartments_full."""

import numpy as np
from ml_basics.logistic import (
    _lesson_cell,
    apartments,
    ascent,
    expensive,
    loglik,
    newton,
)
from sklearn.linear_model import LogisticRegression

from mlf.datasets import apartments_full


def test_lesson_cell_output(capsys):
    """Ячейка урока 1.4 (<PyCode src="ml_basics/logistic.py#data+tools+demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "градиент совпал с конечными разностями: True\n"
        "Ньютон:      8 итераций, θ = [-0.422  7.418 -1.033]\n"
        "подъём:   2978 итераций, θ = [-0.422  7.418 -1.033]\n"
        "ℓ/n в максимуме: -0.1105, доля верных: 0.965\n"
        "вероятности первых трёх: [0.043 0.91  0.999]  при 10θ: [0. 1. 1.]\n"
    )


def standardized():
    F, y = expensive()
    return np.column_stack([np.ones(len(y)), (F - F.mean(axis=0)) / F.std(axis=0)]), y


def test_data_is_course_dataset():
    for a, b in zip(apartments(), apartments_full()):
        np.testing.assert_array_equal(a, b)


def test_weights_match_sklearn_without_penalty():
    X, y = standardized()
    theta, _ = newton(X, y)
    lr = LogisticRegression(C=np.inf, tol=1e-10, max_iter=10_000).fit(X[:, 1:], y)
    np.testing.assert_allclose(theta[1:], lr.coef_[0], atol=1e-3)
    assert abs(theta[0] - lr.intercept_[0]) < 1e-3


def test_newton_iterations_invariant_to_scaling_ascent_not():
    X, y = standardized()
    raw = X * np.array([1, 3.0, 0.2])  # другой масштаб признаков: обратимая замена вместе со столбцом единиц
    assert newton(raw, y)[1] == newton(X, y)[1]
    assert ascent(raw, y, alpha=2 / 9)[1] > 2 * ascent(X, y, alpha=2.0)[1]


def test_separable_data_has_no_maximum():
    X = np.column_stack([np.ones(6), [-3, -2, -1, 1, 2, 3]])
    y = np.array([0, 0, 0, 1, 1, 1.0])
    vals = [loglik(np.array([0, c]), X, y) for c in (1, 10, 100)]
    assert vals[0] < vals[1] < vals[2] < 0  # растёт к нулю, но не достигает


def test_site_widget_data_matches_generator():
    """Данные виджетов урока 1.4 (src/widgets/ml/logistic-plane и ascent-newton, data.json) — тот же генератор, что в ячейке."""
    import json
    from pathlib import Path

    F, y = expensive()
    for widget in ("logistic-plane", "ascent-newton"):
        data = json.loads((Path(__file__).resolve().parents[2] / f"src/widgets/ml/{widget}/data.json").read_text(encoding="utf-8"))
        assert data["area"] == F[:, 0].tolist() and data["metro"] == F[:, 1].tolist() and data["y"] == y.astype(int).tolist()
