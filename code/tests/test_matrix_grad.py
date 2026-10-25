"""Числа урока II.3: конечные разности подтверждают (A + Aᵀ)x, Bᵀ и B⁻ᵀ и опровергают 2Ax для несимметричной A."""

from calculus.matrix_grad import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока II.3 (<PyCode src="calculus/matrix_grad.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "∇ xᵀAx = (A+Aᵀ)x: True\n"
        "∇ xᵀAx = 2Ax: False\n"
        "∇ tr(AB) = Bᵀ: True\n"
        "∇ log|det B| = B⁻ᵀ: True\n"
    )
