"""Числа урока I.5: tr(AB) = tr(BA) при разных размерах AB и BA; xᵀMx = xᵀSx = tr(Mxxᵀ)."""

from la.trace import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока I.5 (<PyCode src="la/trace.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "AB: (2, 2) след -1\n"
        "BA: (3, 3) след -1\n"
        "x^T M x = 1\n"
        "x^T S x = 1.0\n"
        "tr(M x x^T) = 1\n"
    )
