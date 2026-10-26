"""Числа урока 2.4 «Основ ML»: вывод ячейки; ошибки фолдов совпадают с cross_val_score(Ridge, cv=свои фолды) до
1e-10; стратифицированные фолды держат долю классов, как StratifiedKFold; формула «без одного» для гребневой без
штрафа на свободный член совпадает с n обучениями."""

import numpy as np
from ml_basics.cross_val import (
    _lesson_cell,
    apartments,
    cv_errors,
    kfold,
    ridge_fit,
    stratified,
)
from sklearn.linear_model import Ridge
from sklearn.model_selection import StratifiedKFold, cross_val_score

from mlf.datasets import apartments_full


def test_lesson_cell_output(capsys):
    """Ячейка урока 2.4 (<PyCode src="ml_basics/cross_val.py#data+tools+demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "   λ     CV-MSE   ± SE\n"
        "  0.1    0.649  0.102\n"
        "    1    0.648  0.092\n"
        "    3    0.661  0.079\n"
        "   10    0.764  0.081\n"
        "   30    1.167  0.172\n"
        "  100    3.021  0.446\n"
        "лучший λ = 1, по правилу одной SE — λ = 3\n"
        "положительных по фолдам: просто [4, 0, 6, 4, 3], стратифицированно [4, 4, 3, 3, 3]\n"
        "чистый шум: отбор по всей выборке — 0.86 верных, отбор внутри фолда — 0.42\n"
    )


def small():
    X, y = apartments()
    X, y = X[:100], y[:100]
    return (X - X.mean(axis=0)) / X.std(axis=0), y


def test_data_is_course_dataset():
    for a, b in zip(apartments(), apartments_full()):
        np.testing.assert_array_equal(a, b)


def test_fold_errors_match_cross_val_score():
    X, y = small()
    folds = kfold(len(y), 5)
    cv = [(np.setdiff1d(np.arange(len(y)), f), f) for f in folds]
    for lam in (0.1, 3.0, 30.0):
        ours = cv_errors(X, y, folds, lambda A, b, lam=lam: ridge_fit(A, b, lam))
        sk = -cross_val_score(Ridge(alpha=lam), X, y, cv=cv, scoring="neg_mean_squared_error")
        np.testing.assert_allclose(ours, sk, atol=1e-10)


def test_stratified_like_sklearn():
    y = (np.random.default_rng(3).random(200) < 0.11).astype(int)
    ours = sorted(int(y[f].sum()) for f in stratified(y, 5, seed=1))
    sk = sorted(int(y[te].sum()) for _, te in StratifiedKFold(5, shuffle=True, random_state=1).split(np.zeros(200), y))
    assert ours == sk
    assert max(ours) - min(ours) <= 1


def test_ridge_leave_one_out_formula():
    X, y = small()
    A = np.column_stack([np.ones(len(y)), X])
    D = np.diag([0, 1, 1, 1, 1, 1.0])
    lam = 3.0
    H = A @ np.linalg.solve(A.T @ A + lam * D, A.T)
    formula = np.mean(((y - H @ y) / (1 - np.diag(H))) ** 2)
    brute = []
    for i in range(len(y)):
        m = np.arange(len(y)) != i
        theta = np.linalg.solve(A[m].T @ A[m] + lam * D, A[m].T @ y[m])
        brute.append((y[i] - A[i] @ theta) ** 2)
    assert abs(formula - np.mean(brute)) < 1e-10


def test_site_widget_data_matches_generator():
    """Данные «Фолдов» (src/widgets/ml/folds/data.json) — первые 60 «Квартир» и звонков банка."""
    import json
    from pathlib import Path

    from mlf.datasets import bank_calls

    X, y = apartments_full()
    _, calls = bank_calls()
    data = json.loads((Path(__file__).resolve().parents[2] / "src/widgets/ml/folds/data.json").read_text(encoding="utf-8"))
    assert data["area"] == X[:60, 0].tolist() and data["price"] == y[:60].tolist()
    assert data["calls"] == calls[:60].astype(int).tolist()
