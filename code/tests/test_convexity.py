"""Числа урока II.5: гессиан логистической потери XᵀDX положительно определён, хорды не уходят под график."""

from calculus.convexity import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока II.5 (<PyCode src="calculus/convexity.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "все λ(H) > 0 в 1000 точках: True\n"
        "хорда ниже графика: 0 раз из 500\n"
    )
