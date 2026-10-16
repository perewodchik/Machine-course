"""Числа урока I.2: нормы вектора (3, −4) и матрицы, средний |cos| случайных векторов падает с размерностью."""

from la.norms import _angles_cell, _norms_cell


def test_norms_cell_output(capsys):
    """Ячейка урока I.2 (<PyCode src="la/norms.py#norms" run />) печатает ровно это."""
    _norms_cell()
    assert capsys.readouterr().out == "ℓ1: 7.0\nℓ2: 5.0\nℓ∞: 4.0\nФробениус: 5.0\n"


def test_angles_cell_output(capsys):
    """Ячейка урока I.2 (<PyCode src="la/norms.py#angles" run />) печатает ровно это."""
    _angles_cell()
    assert capsys.readouterr().out == (
        "d =    2: средний |cos| = 0.654\n"
        "d =   10: средний |cos| = 0.258\n"
        "d =  100: средний |cos| = 0.081\n"
        "d = 1000: средний |cos| = 0.026\n"
    )
