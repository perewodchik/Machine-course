"""Числа урока II.6: обусловленность сырой и стандартизованной площади, расходимость выше порога, SGD."""

from calculus import gd
from calculus.gd import _lesson_cell, _sgd_cell
from mlf.datasets import apartments


def test_data_matches_package():
    """Генератор в сниппете совпадает с mlf.datasets.apartments: урок и лабораторная видят одни числа."""
    area, y = apartments()
    assert (gd.area == area).all() and (gd.y == y).all()


def test_lesson_cell_output(capsys):
    """Ячейка урока II.6 (<PyCode src="calculus/gd.py#data+demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "площадь в м²: порог η < 0.00032, обусловленность 91118, за 20000 шагов не сошёлся\n"
        "стандартизованная: порог η < 2, обусловленность 1, шагов 1\n"
        "η = 2.1: [-176.  -44.]\n"
    )


def test_sgd_cell_output(capsys):
    """Вторая ячейка урока II.6 (<PyCode src="calculus/gd.py#data+sgd" run />)."""
    _sgd_cell()
    assert capsys.readouterr().out == (
        "шагов SGD: 320  из них J выросла: 122\n"
        "J: старт 61.17 → после 20 эпох 0.345\n"
        "θ = [10.74  2.62]  решение: [10.7   2.68]\n"
    )
