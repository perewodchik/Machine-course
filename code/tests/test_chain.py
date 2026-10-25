"""Числа урока II.2: при θ = (0.5, 1), x = (2, 1), y = 3 — L = 1 и ∇θL = (−4, −2), как на рисунке 1."""

from calculus.chain import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока II.2 (<PyCode src="calculus/chain.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "L = 1.0  ∇θL = [-4. -2.]\n"
        "численно: [-4. -2.]\n"
        "J_f = [[1.0, 0.5], [1.0, 1.0]]\n"
    )
