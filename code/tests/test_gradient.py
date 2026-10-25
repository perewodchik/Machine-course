"""Числа урока II.1: градиент J(θ) на «Квартирах» в точке θ = (1, 0.1) — формула совпадает с численным."""

import numpy as np

from calculus.gradient import _lesson_cell
from mlf.datasets import apartments


def test_lesson_cell_output(capsys):
    """Ячейка урока II.1 (<PyCode src="calculus/gradient.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "∇J = [  -33.  -2719.8]\n"
        "численно: [  -33.  -2719.8]\n"
        "совпадают: True\n"
    )


def test_cell_uses_course_dataset():
    """Данные в ячейке — те же «Квартиры», что mlf.datasets.apartments; знак градиента говорит: θ мало."""
    area, y = apartments()
    X = np.column_stack([np.ones(16), area])
    grad = X.T @ (X @ np.array([1.0, 0.1]) - y)
    assert np.allclose(grad, [-33.0, -2719.8])
    assert (grad < 0).all()
