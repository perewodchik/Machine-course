"""Числа урока 1.2 «Основ ML» и сверка с scikit-learn: пакетный спуск сходится к весам LinearRegression (после пересчёта
со стандартизованных признаков) с точностью 1e-3; SGD с постоянным шагом — к облаку вокруг минимума, как SGDRegressor;
шаг больше 2/λmax расходится; данные ячейки — mlf.datasets.apartments_full."""

import numpy as np
from ml_basics.lms import _lesson_cell, apartments, gd
from sklearn.linear_model import LinearRegression, SGDRegressor

from mlf.datasets import apartments_full


def test_lesson_cell_output(capsys):
    """Ячейка урока 1.2 (<PyCode src="ml_basics/lms.py#data+demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "порог шага 2/λmax: 1.075, число обусловленности: 12.7\n"
        "градиент совпал с конечными разностями: True\n"
        "пакетный      J = 0.3192 (минимум 0.3192), |θ − θ*| = 0.0000\n"
        "SGD           J = 0.3258 (минимум 0.3192), |θ − θ*| = 0.0912\n"
        "мини-батч 32  J = 0.3208 (минимум 0.3192), |θ − θ*| = 0.0343\n"
        "веса на исходных признаках: [ 1.412  0.111  0.369  0.031 -0.06  -0.019]\n"
    )


def standardized():
    X, y = apartments()
    mu, s = X.mean(axis=0), X.std(axis=0)
    return X, y, mu, s, np.column_stack([np.ones(len(X)), (X - mu) / s])


def test_data_is_course_dataset():
    X1, y1 = apartments()
    X2, y2 = apartments_full()
    np.testing.assert_array_equal(X1, X2)
    np.testing.assert_array_equal(y1, y2)


def test_batch_gd_matches_linear_regression_on_original_features():
    X, y, mu, s, Z = standardized()
    theta = gd(Z, y, alpha=0.5, epochs=200)
    w, b = theta[1:] / s, theta[0] - np.sum(theta[1:] * mu / s)
    lr = LinearRegression().fit(X, y)
    np.testing.assert_allclose(w, lr.coef_, atol=1e-3)
    assert abs(b - lr.intercept_) < 1e-3


def test_sgd_constant_step_like_sgdregressor():
    _, y, _, _, Z = standardized()
    ours = gd(Z, y, alpha=0.01, epochs=20, batch=1)
    sk = SGDRegressor(penalty=None, learning_rate="constant", eta0=0.01, max_iter=20, tol=None, random_state=0).fit(Z[:, 1:], y)
    # обе — в облаке вокруг минимума: близко к LinearRegression, но не точно
    lr = LinearRegression().fit(Z[:, 1:], y)
    for coef in (ours[1:], sk.coef_):
        assert np.abs(coef - lr.coef_).max() < 0.2


def test_step_above_threshold_diverges():
    _, y, _, _, Z = standardized()
    lam = np.linalg.eigvalsh(Z.T @ Z / len(y)).max()
    ok = gd(Z, y, alpha=1.9 / lam, epochs=300)
    bad = gd(Z, y, alpha=2.1 / lam, epochs=300)
    def J(th):
        return 0.5 * np.mean((Z @ th - y) ** 2)

    assert J(ok) < 1
    assert not np.isfinite(J(bad)) or J(bad) > 1e6


def test_divergence_game_apartment_matrices():
    """Уровни 6–7 игры «Порог расходимости» (src/games/divergence/model.ts): APARTMENTS_H и APARTMENTS_STD_H."""
    X, _ = apartments_full()
    Z = np.column_stack([np.ones(len(X)), X[:, 0] / 10])
    H = Z.T @ Z / len(X)
    np.testing.assert_allclose([H[0, 0], H[0, 1], H[1, 1]], [1, 7.27, 60.29], atol=0.005)
    r = np.corrcoef(X[:, 0], X[:, 1])[0, 1]
    assert abs(r - 0.85) < 0.005
    # порог вырос примерно в 33 раза; для площади в м² λmax ≈ 6000
    assert 30 < (2 / (1 + r)) / (2 / np.linalg.eigvalsh(H).max()) < 36
    Zm = np.column_stack([np.ones(len(X)), X[:, 0]])
    assert 5500 < np.linalg.eigvalsh(Zm.T @ Zm / len(X)).max() < 6500
