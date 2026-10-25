"""Числа урока II.10: гауссов интеграл тремя способами и ошибка без якобиана r."""

from calculus.integrals import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока II.10 (<PyCode src="calculus/integrals.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "I        = 2.506628  √(2π) = 2.506628\n"
        "I²       = 6.283185  2π = 6.283185\n"
        "полярные = 6.283185  без r: 7.874805\n"
    )
