"""Числа урока IV.5: численные производные a(η) совпадают с выборочными средним и дисперсией y у Бернулли и Пуассона."""

from stats.expfam import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока IV.5 (<PyCode src="stats/expfam.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "Бернулли: a'(η) = 0.6900, среднее y = 0.6905;  a''(η) = 0.2139, дисперсия y = 0.2137\n"
        "Пуассон : a'(η) = 3.3201, среднее y = 3.3256;  a''(η) = 3.3201, дисперсия y = 3.3216\n"
    )
