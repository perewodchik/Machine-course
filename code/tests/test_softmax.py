"""Числа урока 1.5 «Основ ML»: вывод ячейки; перцептрон на разделимых данных останавливается без ошибок, как
Perceptron из scikit-learn; вероятности softmax после спуска совпадают с LogisticRegression(C=np.inf) до 1e-3;
при k = 2 softmax — логистическая регрессия с θ₁ − θ₂; данные — mlf.datasets.apartments_full."""

import numpy as np
from ml_basics.softmax import (
    _lesson_cell,
    apartments,
    ce_grad,
    perceptron,
    segments,
    softmax,
)
from sklearn.linear_model import LogisticRegression, Perceptron

from mlf.datasets import apartments_full


def test_lesson_cell_output(capsys):
    """Ячейка урока 1.5 (<PyCode src="ml_basics/softmax.py#data+tools+demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "эконом против бизнеса, ошибок по эпохам: [2, 0]\n"
        "бизнес против остальных, последние эпохи: [29, 27, 28, 29, 27]\n"
        "градиент совпал с конечными разностями: True\n"
        "J = 0.2702, доля верных: 0.870\n"
        "вероятности первой квартиры: [0.562 0.438 0.   ]  после сдвига всех θ_j: [0.562 0.438 0.   ]\n"
    )


def test_data_is_course_dataset():
    for a, b in zip(apartments(), apartments_full()):
        np.testing.assert_array_equal(a, b)


def test_perceptron_separable_like_sklearn():
    X, y = segments()
    m = y != 1
    theta, mistakes = perceptron(X[m], (y[m] == 2).astype(float))
    assert mistakes[-1] == 0
    assert np.mean((X[m] @ theta >= 0) == (y[m] == 2)) == 1.0
    sk = Perceptron(max_iter=1000, tol=None, random_state=0).fit(X[m][:, 1:], y[m] == 2)
    assert sk.score(X[m][:, 1:], y[m] == 2) == 1.0


def test_softmax_probabilities_match_sklearn():
    X, y = segments()
    Theta = np.zeros((3, 3))
    for _ in range(3000):
        Theta -= 2.0 * ce_grad(Theta, X, y)
    lr = LogisticRegression(C=np.inf, tol=1e-10, max_iter=10_000).fit(X[:, 1:], y)
    np.testing.assert_allclose(softmax(X @ Theta), lr.predict_proba(X[:, 1:]), atol=1e-3)


def test_binary_softmax_is_logistic():
    rng = np.random.default_rng(0)
    X, Theta = rng.normal(size=(10, 3)), rng.normal(size=(3, 2))
    p1 = softmax(X @ Theta)[:, 0]
    np.testing.assert_allclose(p1, 1 / (1 + np.exp(-X @ (Theta[:, 0] - Theta[:, 1]))))


def test_site_widget_data_matches_generator():
    """Данные виджетов урока 1.5 (src/widgets/ml/class-regions и perceptron, data.json) — тот же генератор."""
    import json
    from pathlib import Path

    X, y = segments()
    for widget in ("class-regions", "perceptron"):
        data = json.loads((Path(__file__).resolve().parents[2] / f"src/widgets/ml/{widget}/data.json").read_text(encoding="utf-8"))
        np.testing.assert_allclose(data["z1"], X[:, 1], atol=1e-6)
        np.testing.assert_allclose(data["z2"], X[:, 2], atol=1e-6)
        assert data["y"] == y.tolist()
