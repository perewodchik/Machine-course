"""Числа урока III.7: scale — это σ, правило 68–95–99.7 на выборке, отсутствие памяти у показательного."""

from prob.continuous import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока III.7 (<PyCode src="prob/continuous.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "дисперсия выборки: scale=2 → 4.01  scale=4 → 16.05\n"
        "доля внутри ±1σ: 0.682\n"
        "доля внутри ±2σ: 0.9545\n"
        "доля внутри ±3σ: 0.9971\n"
        "P(T > 1) = 0.368   P(T > 3 | T > 2) = 0.37\n"
    )
