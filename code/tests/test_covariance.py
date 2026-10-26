"""Числа урока III.9: X и X² некоррелированы, но зависимы; полное матожидание на симуляции."""

from prob.covariance import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока III.9 (<PyCode src="prob/covariance.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "корреляция X и X²: -0.004\n"
        "P(Y > 0.5) = 0.293   P(Y > 0.5 | X > 0.8) = 1.0\n"
        "E T по выборке: 2.19   0.7 · 1 + 0.3 · 5 = 2.2\n"
    )
