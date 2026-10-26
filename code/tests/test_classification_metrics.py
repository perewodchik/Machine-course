"""Числа урока 2.1 «Основ ML»: вывод ячейки; матрица ошибок, ROC, PR, AUC, AP, Брайер и кривая надёжности с нуля
совпадают с sklearn.metrics до 1e-12; AUC не меняется при возведении оценок в куб; данные — mlf.datasets.bank_calls
(синтетическая замена Bank Marketing до S7.02)."""

import numpy as np
from ml_basics.metrics import (
    _lesson_cell,
    auc_pairs,
    average_precision,
    bank_calls,
    confusion,
    curves,
    fit_logistic,
    reliability,
)
from sklearn.calibration import calibration_curve
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    precision_recall_curve,
    roc_auc_score,
    roc_curve,
)

from mlf.datasets import bank_calls as course_bank_calls


def test_lesson_cell_output(capsys):
    """Ячейка урока 2.1 (<PyCode src="ml_basics/metrics.py#data+tools+demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "доля откликов: 0.105; «никому не звонить» верно в 89.5% случаев\n"
        "порог 0.5: {'tp': 73, 'fp': 31, 'fn': 242, 'tn': 2654}, доля верных 0.909, точность 0.702, полнота 0.232\n"
        "AUC трапециями: 0.8094, по парам: 0.8094; AP: 0.4492\n"
        "Брайер: 0.0744, у оценок в кубе: 0.0898, AUC у куба: 0.8094\n"
        "порог t* = 0.05: цена 10700, при пороге 0.5: 23145\n"
        "надёжность (оценка → доля): 0.05→0.04 0.14→0.14 0.24→0.25 0.35→0.31 0.45→0.44\n"
    )


def scores():
    F, y = bank_calls()
    X = np.column_stack([np.ones(len(y)), (F - F.mean(axis=0)) / F.std(axis=0)])
    tr = np.arange(len(y)) < 7000
    return 1 / (1 + np.exp(-X[~tr] @ fit_logistic(X[tr], y[tr]))), y[~tr]


def test_data_is_course_dataset():
    for a, b in zip(bank_calls(), course_bank_calls()):
        np.testing.assert_array_equal(a, b)


def test_metrics_match_sklearn():
    s, y = scores()
    c = confusion(s, y, 0.5)
    tn, fp, fn, tp = confusion_matrix(y, s >= 0.5).ravel()
    assert (c["tp"], c["fp"], c["fn"], c["tn"]) == (tp, fp, fn, tn)
    fpr, tpr, recall, precision = curves(s, y)
    sk_fpr, sk_tpr, _ = roc_curve(y, s, drop_intermediate=False)
    np.testing.assert_allclose(fpr, sk_fpr, atol=1e-12)
    np.testing.assert_allclose(tpr, sk_tpr, atol=1e-12)
    sk_p, sk_r, _ = precision_recall_curve(y, s)
    np.testing.assert_allclose(precision, sk_p[:-1][::-1], atol=1e-12)
    np.testing.assert_allclose(recall, sk_r[:-1][::-1], atol=1e-12)
    assert abs(np.sum(np.diff(fpr) * (tpr[1:] + tpr[:-1]) / 2) - roc_auc_score(y, s)) < 1e-12
    assert abs(auc_pairs(s, y) - roc_auc_score(y, s)) < 1e-12
    assert abs(average_precision(recall, precision) - average_precision_score(y, s)) < 1e-12
    assert abs(np.mean((s - y) ** 2) - brier_score_loss(y, s)) < 1e-12
    mean, frac = reliability(s, y)
    sk_frac, sk_mean = calibration_curve(y, s, n_bins=10)
    np.testing.assert_allclose(mean, sk_mean, atol=1e-12)
    np.testing.assert_allclose(frac, sk_frac, atol=1e-12)


def test_cube_keeps_auc_and_spoils_brier():
    s, y = scores()
    assert abs(auc_pairs(s**3, y) - auc_pairs(s, y)) < 1e-12
    assert np.mean((s**3 - y) ** 2) > np.mean((s - y) ** 2)
