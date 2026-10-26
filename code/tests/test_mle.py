"""Числа урока IV.3: произведение тысячи вероятностей — 0.0, сумма логарифмов конечна; максимум ℓ(λ) на сетке
совпадает с x̄ с точностью до шага сетки."""

from stats.mle import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока IV.3 (<PyCode src="stats/mle.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        'произведение вероятностей: 0.0\n'
        'сумма логарифмов: -1915.63\n'
        'максимум на сетке: λ = 3.02   формула x̄ = 3.015\n'
    )
