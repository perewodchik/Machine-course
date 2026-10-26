"""Числа урока III.5: E X² > (E X)², E log X < log E X, Var(X + X) = 4 Var X, а не 2 Var X."""

from prob.moments import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока III.5 (<PyCode src="prob/moments.py#demo" run />) печатает ровно это.

    Точно: E X² = 91/6 ≈ 15.167, (E X)² = 12.25, Var(X + Y) = 35/6 ≈ 5.833 для независимых, 4 · 35/12 ≈ 11.667 для Y = X.
    """
    _lesson_cell()
    assert capsys.readouterr().out == (
        "E X² = 15.183  (E X)² = 12.266\n"
        "E log X = 1.097  log E X = 1.253\n"
        "Var(X + Y), Y независим: 5.833\n"
        "Var(X + Y), Y = X:       11.67  ≠ Var X + Var Y = 5.835\n"
    )
