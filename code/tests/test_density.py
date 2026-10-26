"""Числа урока III.4: среднее индикатора ≈ P(A), гистограмма √X совпадает с 2y·e^(−y²), без множителя — нет."""

from prob.density import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока III.4 (<PyCode src="prob/density.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "среднее 1{X > 1}: 0.367  P(X > 1) = e⁻¹ = 0.3679\n"
        "наибольшее расхождение гистограммы и 2y·e^(−y²): 0.017\n"
        "без множителя 2y: 0.938\n"
    )
