import numpy as np

from la.normal_equations import loss, make_data, normal_equations


def test_matches_lstsq():
    X, y = make_data()
    theta = normal_equations(X, y)
    assert np.allclose(theta, np.linalg.lstsq(X, y, rcond=None)[0])


def test_values_shown_in_lesson():
    """Числа в уроке V.1 (рисунок 1 и ячейка кода) должны совпадать с кодом."""
    X, y = make_data()
    theta = normal_equations(X, y)
    assert np.allclose(theta.round(3), [0.798, 0.548])
    assert round(loss(np.array([2.5, 0.25]), X, y), 2) == 5.23


def test_minimum_is_global():
    X, y = make_data()
    theta = normal_equations(X, y)
    rng = np.random.default_rng(0)
    assert all(loss(theta, X, y) <= loss(theta + rng.normal(size=2), X, y) for _ in range(100))
