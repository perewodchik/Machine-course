"""Числа урока III.10: выборочная ковариация AX + b совпадает с AΣAᵀ, а не с AΣ; Var(aᵀX) = aᵀΣa."""

from prob.random_vectors import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока III.10 (<PyCode src="prob/random_vectors.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        'выборочная Cov Y:\n'
        ' [[4.22 3.22]\n'
        ' [3.22 4.03]]\n'
        'A Σ Aᵀ:\n'
        ' [[4.2 3.2]\n'
        ' [3.2 4. ]]\n'
        'ошибка A Σ:\n'
        ' [[2.6 1.6]\n'
        ' [1.2 2. ]]\n'
        'Var(aᵀX): выборка 3.61  aᵀΣa = 3.6\n'
        'собственные числа Σ: [0.719 2.281]\n'
    )
