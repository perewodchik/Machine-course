"""check.matches: функция ученика против эталона на данных разных размеров, минимальный контрпример в сообщении."""

import numpy as np
import pytest

from mlf import check
from mlf.check import CheckFailed


def reference(X, y):
    return np.linalg.lstsq(X, y, rcond=None)[0]


def test_correct_solution_passes():
    def solve(X, y):
        return np.linalg.lstsq(X, y, rcond=None)[0]

    check.matches(solve, reference, name="решение")


def test_bug_on_single_object_reports_n_1():
    """Типичная ошибка: среднее как сумма на (n − 1). Минимальный контрпример — один объект."""

    with pytest.raises(CheckFailed, match=r"ошибается при n = 1"):
        check.matches(lambda X, y: y.sum() / (len(y) - 1), lambda X, y: y.mean(), name="среднее")


def test_bug_on_single_feature_reports_d_1():
    """Типичная ошибка: признак взят как X[:, 1], будто столбцов всегда два."""

    with pytest.raises(CheckFailed, match=r"падает при n = 1, d = 1 .*IndexError"):
        check.matches(lambda X, y: X[:, 1] * 0 + y, lambda X, y: y, name="предсказание")


def test_wrong_shape_is_named():
    def solve(X, y):
        return np.linalg.lstsq(X, y, rcond=None)[0].reshape(-1, 1)

    with pytest.raises(CheckFailed, match=r"возвращает форму \(1, 1\), а нужна \(1,\)"):
        check.matches(solve, reference, name="решение")


def test_crash_is_reported_with_minimal_example():
    def solve(X, y):
        return np.linalg.solve(X.T @ X, X.T @ y)  # падает на вырожденной XᵀX, где lstsq работает

    with pytest.raises(CheckFailed, match=r"Решение падает при n = 1, d = 1 — аргументы: \[\[0\.\]\], \[0\.\]: LinAlgError"):
        check.matches(solve, reference, name="решение")


def test_custom_inputs():
    from hypothesis import strategies as st

    def inputs(draw):
        return (draw(st.integers(0, 20)),)

    with pytest.raises(CheckFailed, match=r"аргументах 0"):
        check.matches(lambda k: 1 / k if k else float("inf"), lambda k: float(k), inputs=inputs, name="функция")
