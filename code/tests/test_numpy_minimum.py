"""Числа урока 0.8 и лабораторной «NumPy за час»: цикл и векторное выражение дают одну и ту же J."""

import numpy as np

from start.numpy_minimum import _lesson_cell, loss_loop, loss_vec, make_data


def test_loop_equals_vectorized():
    X, y, theta = make_data(n=50, d=4, seed=3)
    assert np.isclose(loss_loop(X, y, theta), loss_vec(X, y, theta))


def test_lesson_cell_output(capsys):
    """Ячейка урока 0.8 (<PyCode src="start/numpy_minimum.py#loop+vectorized+demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "X: (500, 3)  y: (500,)  theta: (3,)\n"
        "цикл:     66.8135\n"
        "векторно: 66.8135\n"
    )
