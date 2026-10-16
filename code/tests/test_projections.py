"""Числа урока I.8: проекция y = (1, 0.5, 2) на плоскость столбцов, P² = P, Pᵀ = P, QQᵀ = P."""

from la.projections import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока I.8 (<PyCode src="la/projections.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "ŷ = [1.417 0.917 1.167]\n"
        "остаток ⟂ столбцам: True\n"
        "P² = P: True   Pᵀ = P: True\n"
        "QᵀQ = I: True   QQᵀ = P: True\n"
    )
