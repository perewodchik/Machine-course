"""Числа урока IV.1: опечатка в одной цене сдвигает среднее и s в разы, медиана и IQR почти не меняются;
генератор цен в ячейке совпадает с mlf.datasets.apartments."""

import inspect

import numpy as np

from mlf.datasets import apartments
from stats import descriptive
from stats.descriptive import _lesson_cell


def test_prices_match_dataset():
    """Ячейка строит те же цены, что и mlf.datasets.apartments (seed 2026, 16 квартир)."""
    src = inspect.getsource(descriptive._lesson_cell)
    assert "default_rng(2026)" in src and "size=16" in src
    rng = np.random.default_rng(2026)
    area = np.round(rng.uniform(28, 110, size=16))
    price = np.round(1.5 + 0.12 * area + rng.normal(0, 0.9, size=16), 1)
    assert np.array_equal(price, apartments()[1])


def test_lesson_cell_output(capsys):
    """Ячейка урока IV.1 (<PyCode src="stats/descriptive.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        'цены:       x̄ = 10.70, медиана = 10.80, s = 2.89, IQR = 4.78\n'
        'с опечаткой: x̄ = 49.68, медиана = 11.75, s = 154.77, IQR = 4.38\n'
        'np.std по умолчанию делит на n: 2.801  ddof=1 — на n − 1: 2.893\n'
    )
