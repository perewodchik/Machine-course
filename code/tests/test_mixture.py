"""Числа урока III.12: ответственность по формуле Байеса совпадает с долей на выборке; дисперсия смеси —
по полному матожиданию, а взвешенная сумма разбросана в разы меньше."""

from prob.mixture import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока III.12 (<PyCode src="prob/mixture.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        'P(z = 1 | x ≈ 0.5): по выборке 0.092  формула 0.088\n'
        'Var смеси: 4.07  формула: 4.06   Var взвешенной суммы: 0.62\n'
    )
