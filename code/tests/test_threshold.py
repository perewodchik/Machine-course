"""Числа урока 2.1 «Метрики классификации» курса «Основы ML» и виджета «Порог классификатора»."""

import json
from pathlib import Path

import numpy as np

from ml_basics.threshold import (
    bayes_threshold, best_threshold, confusion, make_scores, precision_recall, roc_auc, total_cost,
)

ROOT = Path(__file__).resolve().parents[2]


def test_values_shown_in_lesson():
    s, y = make_scores()
    assert (len(s), int(y.sum())) == (300, 84)  # 300 заявок, 84 дефолта (28%)
    assert round(roc_auc(s, y), 3) == 0.848
    c = confusion(s, y, 0.5)
    assert c == {"tp": 34, "fp": 10, "fn": 50, "tn": 206}
    p, r = precision_recall(c)
    assert (round(p, 3), round(r, 3)) == (0.773, 0.405)
    assert round((c["tp"] + c["tn"]) / len(s), 2) == 0.80  # accuracy при пороге 0.5
    assert round(1 - y.mean(), 2) == 0.72  # accuracy, если никому не отказывать
    # цена ошибок: пропущенный дефолт — 5, лишний отказ — 1
    assert total_cost(s, y, 1.001, 1, 5) == 420  # никому не отказывать
    assert total_cost(s, y, 0.5, 1, 5) == 260
    assert round(bayes_threshold(1, 5), 3) == 0.167
    assert total_cost(s, y, bayes_threshold(1, 5), 1, 5) == 125
    assert best_threshold(s, y, 1, 5) == (0.181, 121.0)
    # проверка в уроке: порог 0.5 → 0.7
    p7, r7 = precision_recall(confusion(s, y, 0.7))
    assert (round(p7, 3), round(r7, 3)) == (0.846, 0.131)


def test_auc_matches_rank_formula():
    """AUC через попарное сравнение совпадает с формулой Манна — Уитни по рангам (без ничьих в сравнении классов)."""
    s, y = make_scores()
    order = np.argsort(s, kind="mergesort")
    ranks = np.empty(len(s))
    ranks[order] = np.arange(1, len(s) + 1)
    for v in np.unique(s):  # средние ранги для одинаковых оценок
        ranks[s == v] = ranks[s == v].mean()
    n1, n0 = int(y.sum()), int((1 - y).sum())
    auc_rank = (ranks[y == 1].sum() - n1 * (n1 + 1) / 2) / (n1 * n0)
    assert np.isclose(roc_auc(s, y), auc_rank)


def test_exported_widget_data_is_fresh():
    """prototype/assets/data/threshold.js совпадает с генератором: виджет показывает те же данные, что урок."""
    text = (ROOT / "prototype/assets/data/threshold.js").read_text()
    payload = json.loads(text.split("=", 1)[1].strip().rstrip(";"))
    s, y = make_scores()
    assert payload["scores"] == s.tolist() and payload["y"] == y.tolist()
