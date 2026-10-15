"""Числа урока 0.5 и игры «Underflow»: ноль во float64, сумма логарифмов, log-sum-exp."""

import numpy as np

from start.underflow import _lesson_cell, logsumexp


def test_half_underflows_at_1075():
    """0.5ⁿ = 2⁻ⁿ: 2⁻¹⁰⁷⁴ — наименьшее положительное число float64, на n = 1075 — ноль (как в игре)."""
    assert 0.5**1074 == np.nextafter(0, 1)
    assert 0.5**1075 == 0.0
    assert np.prod(np.full(1074, 0.5)) > 0


def test_logsumexp_matches_direct_formula_when_it_fits():
    z = np.array([-1.0, 0.5, 2.0])
    assert np.isclose(logsumexp(z), np.log(np.sum(np.exp(z))))


def test_lesson_cell_output(capsys):
    """Ячейка урока 0.5 (<PyCode src="start/underflow.py#logsumexp+demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "произведение: 0.0\n"
        "сумма логарифмов: -762.46\n"
        "log Σ exp напрямую: inf\n"
        "log Σ exp со сдвигом: 1002.4076\n"
    )


def test_sigmoid_table_in_lesson():
    """Таблица значений сигмоиды в уроке 0.5 и симметрия g(−z) = 1 − g(z)."""
    g = lambda z: 1 / (1 + np.exp(-z))  # noqa: E731
    assert [round(float(g(z)), 3) for z in (-4, -2, 0, 2, 4)] == [0.018, 0.119, 0.5, 0.881, 0.982]
    assert np.isclose(g(-2), 1 - g(2))
