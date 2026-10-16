"""Числа урока I.9: у [[2, 1], [1, 2]] собственные значения 1 и 3, Q ортогональна; у поворота λ = ±i."""

from la.eigen import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока I.9 (<PyCode src="la/eigen.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "λ = [1. 3.]\n"
        "QᵀQ = I: True\n"
        "A = QΛQᵀ: True\n"
        "поворот: [0.+1.j 0.-1.j]\n"
    )
