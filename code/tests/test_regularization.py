"""Числа урока 2.3 «Основ ML»: вывод ячейки; гребневая с центрированием совпадает с Ridge(alpha=λ) до 1e-8, лассо
покоординатным спуском — с Lasso(alpha=λ, tol=1e-10) до 1e-6 и с lasso_path; при ортонормированных признаках —
деление на 1 + λ и мягкий порог; XᵀX + λI обратима при d > n."""

import numpy as np
from ml_basics.regularization import _lesson_cell, apartments, lasso, ridge, soft
from sklearn.linear_model import Lasso, Ridge, lasso_path

from mlf.datasets import apartments_full


def test_lesson_cell_output(capsys):
    """Ячейка урока 2.3 (<PyCode src="ml_basics/regularization.py#data+tools+demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "лассо λ = 0.01: ненулевых весов 22 из 25, шумовых 17, RMSE на проверке 0.791\n"
        "лассо λ = 0.05: ненулевых весов  5 из 25, шумовых  0, RMSE на проверке 0.787\n"
        "лассо λ =  0.2: ненулевых весов  5 из 25, шумовых  0, RMSE на проверке 0.874\n"
        "гребневая λ = 10: ненулевых весов 25 из 25, наибольший шумовой |θ| = 0.051\n"
        "входят в модель по очереди: площадь (3.23), комнат (0.73), метро (0.67), возраст (0.36), этаж (0.21)\n"
    )


def data():
    X, y = apartments()
    Z = (X - X.mean(axis=0)) / X.std(axis=0)
    return Z[:500], y[:500]


def test_data_is_course_dataset():
    for a, b in zip(apartments(), apartments_full()):
        np.testing.assert_array_equal(a, b)


def test_ridge_matches_sklearn():
    Z, y = data()
    for lam in (0.1, 5.0, 100.0):
        b, theta = ridge(Z, y, lam)
        sk = Ridge(alpha=lam).fit(Z, y)
        np.testing.assert_allclose(theta, sk.coef_, atol=1e-8)
        assert abs(b - sk.intercept_) < 1e-8


def test_lasso_matches_sklearn_and_path():
    Z, y = data()
    for lam in (0.01, 0.1, 0.5):
        b, theta = lasso(Z, y, lam)
        sk = Lasso(alpha=lam, tol=1e-10, max_iter=100_000).fit(Z, y)
        np.testing.assert_allclose(theta, sk.coef_, atol=1e-6)
        assert abs(b - sk.intercept_) < 1e-6
    alphas, coefs, _ = lasso_path(Z - Z.mean(axis=0), y - y.mean(), alphas=[0.5, 0.1, 0.01], tol=1e-12, max_iter=100_000)
    for a, c in zip(alphas, coefs.T):
        np.testing.assert_allclose(lasso(Z, y, a)[1], c, atol=1e-6)


def test_orthonormal_shrinkage_and_soft_threshold():
    rng = np.random.default_rng(0)
    Q, _ = np.linalg.qr(rng.normal(size=(50, 3)))
    Q = Q - Q.mean(axis=0)  # центрируем и снова ортонормируем
    Q, _ = np.linalg.qr(Q)
    ols = np.array([3, 0.5, -1.2])
    y = Q @ ols
    np.testing.assert_allclose(ridge(Q, y, 1.0)[1], ols / 2, atol=1e-10)
    # лассо в форме ½‖Xθ − y‖² + λ‖θ‖₁ при XᵀX = I — мягкий порог; Lasso делит на n, поэтому alpha = λ/n
    np.testing.assert_allclose(lasso(Q, y, 1.0 / 50)[1], soft(ols, 1.0), atol=1e-8)
    np.testing.assert_allclose(soft(ols, 1.0), [2, 0, -0.2], atol=1e-12)


def test_ridge_invertible_when_d_greater_than_n():
    X = np.random.default_rng(1).normal(size=(10, 30))
    Xc = X - X.mean(axis=0)
    assert np.linalg.matrix_rank(Xc.T @ Xc) < 30
    assert np.linalg.eigvalsh(Xc.T @ Xc + 0.1 * np.eye(30)).min() >= 0.1 - 1e-9


def test_site_widget_data_matches_generator():
    """Данные «Пути регуляризации» (src/widgets/ml/reg-path/data.json) — первые 300 «Квартир»."""
    import json
    from pathlib import Path

    X, y = apartments_full()
    data = json.loads((Path(__file__).resolve().parents[2] / "src/widgets/ml/reg-path/data.json").read_text(encoding="utf-8"))
    assert data["X"] == X[:300].tolist() and data["y"] == y[:300].tolist()
