"""Числа урока I.7: solve и inv дают одно решение; det(AB) = det A · det B."""

from la.inverse import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока I.7 (<PyCode src="la/inverse.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "x = [0.1 0.6] совпало: True\n"
        "det A = 10.0  det B = -1.0\n"
        "det AB = -10.0\n"
    )
