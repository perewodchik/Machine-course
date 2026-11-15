"""Числа урока 2.5 «Основ ML»: вывод ячейки; кривые обучения с нуля совпадают с learning_curve на тех же разбиениях
до 1e-10; формула ошибок обучения и теста МНК σ²(1 ∓ d/n) подтверждается симуляцией; данные — apartments_full."""

import numpy as np
from ml_basics.ml_practice import _lesson_cell, apartments, cv_mse, learning_curve
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import KFold, cross_val_score
from sklearn.model_selection import learning_curve as sk_learning_curve

from mlf.datasets import apartments_full


def test_lesson_cell_output(capsys):
    """Ячейка урока 2.5 (<PyCode src="ml_basics/ml_practice.py#data+tools+demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "только площадь  обучение: 0.97 1.21 1.13 1.16 1.28 1.31 | валидация: 1.55 1.33 1.33 1.33 1.32 1.32\n"
        "все признаки    обучение: 0.17 0.33 0.55 0.54 0.62 0.66 | валидация: 1.99 1.48 0.86 0.75 0.67 0.67\n"
        "срезы площади: доля [0.25 0.36 0.22 0.18] MSE [0.73 0.71 0.7  0.82] вклад [0.182 0.253 0.15  0.148]\n"
        "без этажа: ΔMSE = 0.048 ± 0.012\n"
        "без метро: ΔMSE = 0.434 ± 0.030\n"
        "с «ценой за м²»: CV-MSE 0.1931 против 0.667 без неё\n"
    )


def test_data_is_course_dataset():
    for a, b in zip(apartments(), apartments_full()):
        np.testing.assert_array_equal(a, b)


def test_learning_curve_matches_sklearn():
    X, y = apartments()
    X, y = X[:1000], y[:1000]
    sizes = [10, 50, 400, 800]
    tr, va = learning_curve(X, y, sizes)
    _, sk_tr, sk_va = sk_learning_curve(LinearRegression(), X, y, train_sizes=sizes, cv=KFold(5), scoring="neg_mean_squared_error")
    np.testing.assert_allclose(tr, -sk_tr.mean(axis=1), atol=1e-10)
    np.testing.assert_allclose(va, -sk_va.mean(axis=1), atol=1e-10)
    np.testing.assert_allclose(cv_mse(X, y), -cross_val_score(LinearRegression(), X, y, cv=KFold(5), scoring="neg_mean_squared_error"), atol=1e-10)


def test_ols_train_test_gap():
    """МНК, истина в классе, фиксированные x: E[ошибка обучения] = σ²(1 − d/n), на новых ответах — σ²(1 + d/n)."""
    rng = np.random.default_rng(0)
    n, d, sigma = 40, 5, 1.0
    X = np.column_stack([np.ones(n), rng.normal(size=(n, d - 1))])
    H = X @ np.linalg.solve(X.T @ X, X.T)
    tr, te = [], []
    for _ in range(4000):
        y = X @ np.ones(d) + rng.normal(0, sigma, n)
        fit = H @ y
        tr.append(np.mean((y - fit) ** 2))
        te.append(np.mean((X @ np.ones(d) + rng.normal(0, sigma, n) - fit) ** 2))
    assert abs(np.mean(tr) - sigma**2 * (1 - d / n)) < 0.02
    assert abs(np.mean(te) - sigma**2 * (1 + d / n)) < 0.02
