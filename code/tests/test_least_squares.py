"""Числа капстоуна I.12: θ̂ = (0.852, 0.129) на «Квартирах», 10.52 млн ₽ за 75 м², при площади в футах — ранг 2."""

import numpy as np

from la.least_squares import _dependent_cell, _lesson_cell, apartments
from mlf.datasets import apartments as dataset


def test_snippet_data_is_the_course_dataset():
    """Копия генератора в сниппете (для браузера) совпадает с mlf.datasets.apartments."""
    for got, want in zip(apartments(), dataset()):
        assert np.array_equal(got, want)


def test_lesson_cell_output(capsys):
    """Ячейка урока I.12 (<PyCode src="la/least_squares.py#data+demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "θ̂ = [0.852 0.129]\n"
        "как у lstsq: True\n"
        "Xᵀr ≈ 0: True  сумма остатков: 0.0\n"
        "квартира 75 м²: 10.52 млн ₽\n"
    )


def test_dependent_cell_output(capsys):
    """Вторая ячейка (<PyCode src="la/least_squares.py#dup" run />): зависимый столбец, решение наименьшей нормы."""
    _dependent_cell()
    assert capsys.readouterr().out == (
        "ранг X3: 2 из 3\n"
        "θ⁺ = [0.8525 0.0011 0.0119]\n"
        "ŷ тот же: True\n"
        "как у lstsq: True\n"
    )


def test_lesson_numbers():
    """Числа из текста урока: средняя площадь 76.375 м², след проекции 2, вес площади делится как 1 : 10.764."""
    area, y = dataset()
    assert area.mean() == 76.375
    X = np.column_stack([np.ones_like(area), area])
    P = X @ np.linalg.solve(X.T @ X, X.T)
    assert np.isclose(np.trace(P), 2.0)
    assert np.allclose(P @ P, P)
    theta3 = np.linalg.pinv(np.column_stack([X, 10.764 * area])) @ y
    assert np.isclose(theta3[2] / theta3[1], 10.764)
