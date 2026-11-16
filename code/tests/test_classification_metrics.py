"""Числа урока 2.1 «Основ ML»: вывод ячейки; матрица ошибок, ROC, PR, AUC, AP, Брайер и кривая надёжности с нуля
совпадают с sklearn.metrics до 1e-12; AUC не меняется при возведении оценок в куб; данные — подвыборка Bank Marketing
public/data/bank_marketing-10k.csv (S7.02): ячейка читает её по относительному пути data/…, как в браузере."""

from pathlib import Path

import numpy as np
import pytest
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

from mlf import datasets

PUBLIC = Path(__file__).resolve().parents[2] / "public"


@pytest.fixture(autouse=True)
def site_root(monkeypatch):
    """Ячейка читает data/bank_marketing-10k.csv: в браузере его кладёт воркер, здесь — корень сайта public/."""
    monkeypatch.chdir(PUBLIC)


def test_lesson_cell_output(capsys):
    """Ячейка урока 2.1 (<PyCode src="ml_basics/metrics.py#data+tools+demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "доля откликов: 0.116; «никому не звонить» верно в 88.4% случаев\n"
        "порог 0.5: {'tp': 65, 'fp': 33, 'fn': 282, 'tn': 2620}, доля верных 0.895, точность 0.663, полнота 0.187\n"
        "AUC трапециями: 0.7361, по парам: 0.7361; AP: 0.3653\n"
        "Брайер: 0.0884, у оценок в кубе: 0.1048, AUC у куба: 0.7361\n"
        "порог t* = 0.05: цена 12040, при пороге 0.5: 26955\n"
        "надёжность (оценка → доля): 0.05→0.06 0.14→0.13 0.21→0.30 0.37→0.20 0.48→0.43\n"
    )


def scores():
    F, y = bank_calls()
    X = np.column_stack([np.ones(len(y)), (F - F.mean(axis=0)) / F.std(axis=0)])
    tr = np.random.default_rng(0).permutation(len(y)) < 7000
    return 1 / (1 + np.exp(-X[~tr] @ fit_logistic(X[tr], y[tr]))), y[~tr]


def test_data_is_bank_marketing_subsample():
    """Те же звонки, что в mlf.datasets.bank_marketing(): каждая строка подвыборки есть в полном наборе."""
    F, y = bank_calls()
    assert F.shape == (10_000, 8) and round(y.mean(), 4) == 0.1154
    b = datasets.bank_marketing()
    full = set(zip(b["age"].tolist(), b["balance"].tolist(), b["campaign"].tolist(), b["previous"].tolist(), (b["y"] == "yes").tolist()))
    assert all((int(r[0]), int(r[1]), int(r[2]), int(r[3]), bool(t)) in full for r, t in zip(F, y))


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
