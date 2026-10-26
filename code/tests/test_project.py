"""Автопроверка проектов (S7.03): закрытая выборка ловит утечку, финальная оценка — одна, порог метрики работает."""

import numpy as np
import pytest

from mlf.check import CheckFailed
from mlf.datasets import apartments
from mlf.project import LeakError, Project, Sealed, rmse, split


def data():
    area, price = apartments(200, seed=11)
    return np.c_[np.ones_like(area), area], price


def test_split_sizes_and_sealed():
    X, y = data()
    (_, ytr), (_, yva), test = split(X, y, seed=1)
    assert (len(ytr), len(yva), len(test)) == (120, 40, 40)
    assert isinstance(test, Sealed) and not test.opened


@pytest.mark.parametrize("leak", [lambda t: t.X, lambda t: np.asarray(t), lambda t: list(t)])
def test_touching_test_before_final_is_a_leak(leak):
    """Подложенная утечка: модель «подсматривает» в тест до финальной оценки."""
    X, y = data()
    _, _, test = split(X, y, seed=1)
    with pytest.raises(LeakError, match="закрыта|нельзя"):
        leak(test)
    assert not test.opened


def test_final_threshold_and_single_use():
    X, y = data()
    (Xtr, ytr), _, test = split(X, y, seed=1)
    theta = np.linalg.lstsq(Xtr, ytr, rcond=None)[0]
    p = Project("демо", test, threshold=1.2)
    score = p.final(lambda Z: Z @ theta)
    assert score < 1.2 and test.opened
    with pytest.raises(LeakError, match="уже была"):
        p.final(lambda Z: Z @ theta)


def test_final_below_threshold_fails_with_message():
    X, y = data()
    _, _, test = split(X, y, seed=1)
    with pytest.raises(CheckFailed, match="нужно ≤"):
        Project("демо", test, threshold=0.1).final(lambda Z: np.full(len(Z), 10.0))


def test_rmse():
    assert rmse(np.array([1.0, 3.0]), np.array([2.0, 2.0])) == pytest.approx(1.0)
