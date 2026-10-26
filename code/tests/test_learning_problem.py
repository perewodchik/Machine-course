"""Числа урока 1.1 «Основ ML» и сверка с scikit-learn: веса МНК — как у LinearRegression, RMSE и MAE — как у
sklearn.metrics; бейзлайн-среднее хуже линейной модели; ошибка на обучении не больше ошибки на тесте."""

import numpy as np
import pytest
from ml_basics.learning_problem import _lesson_cell, fit, mae, predict, rmse, split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error

from mlf.datasets import apartments_full


def test_lesson_cell_output(capsys):
    """Ячейка урока 1.1 (<PyCode src="ml_basics/learning_problem.py#tools+demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "бейзлайн:         RMSE 3.501, MAE 2.930\n"
        "по площади:       RMSE 1.215, MAE 0.984\n"
        "все признаки:     RMSE 0.818, MAE 0.655\n"
        "на обучении:      RMSE 0.795\n"
    )


def test_matches_sklearn():
    X, y = apartments_full()
    tr, te = split(len(y), test=0.2, seed=0)
    theta = fit(X[tr], y[tr])
    lr = LinearRegression().fit(X[tr], y[tr])
    assert theta[0] == pytest.approx(lr.intercept_, abs=1e-8)
    np.testing.assert_allclose(theta[1:], lr.coef_, atol=1e-10)
    pred = predict(theta, X[te])
    assert rmse(y[te], pred) == pytest.approx(np.sqrt(mean_squared_error(y[te], pred)))
    assert mae(y[te], pred) == pytest.approx(mean_absolute_error(y[te], pred))


def test_rmse_at_least_mae_and_split_disjoint():
    rng = np.random.default_rng(1)
    for _ in range(50):
        y, p = rng.normal(size=30), rng.normal(size=30)
        assert rmse(y, p) >= mae(y, p) - 1e-12
    tr, te = split(100, test=0.2, seed=3)
    assert len(te) == 20 and not set(tr) & set(te) and len(set(tr) | set(te)) == 100


def test_lesson_data_is_the_course_dataset():
    """Генератор в ячейке урока (без mlf: в браузере пакета нет) совпадает с mlf.datasets.apartments_full."""
    import inspect

    import ml_basics.learning_problem as lp

    src = inspect.getsource(lp._lesson_cell)
    ns: dict = {"np": np}
    body = src[src.index("    def apartments"):src.index("    X, y = apartments()")]
    exec("\n".join(line[4:] for line in body.splitlines()), ns)  # noqa: S102 — код урока, а не ввод пользователя
    X1, y1 = ns["apartments"]()
    X2, y2 = apartments_full()
    np.testing.assert_array_equal(X1, X2)
    np.testing.assert_array_equal(y1, y2)
