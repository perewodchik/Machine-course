"""Числа урока II.4: у f = x³ − 3x + y² в (1, 0) гессиан diag(6, 2) — минимум, в (−1, 0) — diag(−6, 2), седло."""

from calculus.hessian import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока II.4 (<PyCode src="calculus/hessian.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "[1. 0.] λ(H) = [2. 6.] → минимум\n"
        "[-1.  0.] λ(H) = [-6.  2.] → седло\n"
    )
