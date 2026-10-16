"""Числа урока I.6: ранги A и [A | b] решают, есть ли решения; вырожденную систему solve не решает."""

from la.systems import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока I.6 (<PyCode src="la/systems.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "b = [2, 4] rank A = 1 rank [A|b] = 1\n"
        "b = [2, 1] rank A = 1 rank [A|b] = 2\n"
        "solve: Singular matrix\n"
        "решение: [0. 1.]\n"
    )
