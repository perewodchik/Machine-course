"""Числа урока 0.7: оценка Монте-Карло сходится к √(2π) с ошибкой порядка 1/√n."""

import numpy as np

from start.monte_carlo import _lesson_cell, monte_carlo


def test_estimate_converges():
    f = lambda x: x * x  # noqa: E731
    assert abs(monte_carlo(f, 0, 2, 1_000_000) - 8 / 3) < 0.01


def test_lesson_cell_output(capsys):
    """Ячейка урока 0.7 (<PyCode src="start/monte_carlo.py#estimate+demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "n =       100: 2.2583\n"
        "n =     10000: 2.4885\n"
        "n =   1000000: 2.5062\n"
        "√(2π) =       2.5066\n"
    )
    assert round(np.sqrt(2 * np.pi), 4) == 2.5066
