"""Числа урока I.1: зависимые векторы дают ранг 2, независимые — 3."""

from la.span import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока I.1 (<PyCode src="la/span.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == "ранг [v1 v2 v3] = 2\nранг [v1 v2 e3] = 3\n"
