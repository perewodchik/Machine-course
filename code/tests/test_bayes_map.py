"""Числа урока IV.6: Beta(2, 2) после трёх орлов — Beta(5, 2), MAP = (k + 1)/(n + 2) — сглаживание Лапласа;
спуск по −log p(θ | данные) приходит к ridge с λ = σ²/τ², и веса ridge по модулю меньше МНК."""

from stats.bayes_map import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока IV.6 (<PyCode src="stats/bayes_map.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        'апостериорное Beta(5, 2): MLE 1.000, MAP 0.800, среднее 0.714\n'
        'MAP спуском: [ 1.1104 -1.3396 -0.0904]  ridge: [ 1.1104 -1.3396 -0.0904]  МНК: [ 1.3477 -1.8716 -0.103 ]\n'
    )
