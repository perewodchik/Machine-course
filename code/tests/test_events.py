"""Числа урока III.1: частота A ∪ B на ста тысячах бросков совпадает с включениями-исключениями, 2/3."""

from prob.events import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока III.1 (<PyCode src="prob/events.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "частота A ∪ B: 0.6667\n"
        "P(A) + P(B) − P(A ∩ B): 0.6667\n"
        "P(A) + P(B) без вычитания: 0.9167\n"
    )
