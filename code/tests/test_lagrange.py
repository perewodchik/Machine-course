"""Числа урока II.8: перебор направлений и eigh дают один и тот же максимум uᵀΣu и одно направление."""

from calculus.lagrange import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока II.8 (<PyCode src="calculus/lagrange.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "перебор: max uᵀΣu = 2.4507  u = [0.885 0.466]\n"
        "eigh:    λ_max     = 2.4507  q = [0.885 0.466]\n"
        "Σu = λu: True\n"
    )
