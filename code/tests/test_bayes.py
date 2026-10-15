"""Числа урока III.3: пример медицинского теста, сетка из 1000 человек и ячейка с симуляцией."""

from prob.bayes import _lesson_cell, counts, posterior, simulate


def test_values_shown_in_lesson():
    """1 % больных, тест находит 90 % больных и срабатывает у 9 % здоровых."""
    assert round(posterior(0.01, 0.9, 0.09), 4) == 0.0917
    # второй независимый положительный тест: апостериорная становится априорной
    assert round(posterior(posterior(0.01, 0.9, 0.09), 0.9, 0.09), 4) == 0.5025


def test_widget_counts_match_model():
    """Сетка виджета (src/widgets/prob/bayes-grid/model.ts) — те же 9, 1, 89, 901 человек."""
    assert counts(0.01, 0.9, 0.09) == {"tp": 9, "fn": 1, "fp": 89, "tn": 901}


def test_simulation_agrees_with_formula():
    sick, positive = simulate(200_000, 0.01, 0.9, 0.09, seed=3)
    assert abs(sick[positive].mean() - posterior(0.01, 0.9, 0.09)) < 0.01


def test_lesson_cell_output(capsys):
    """Ячейка урока III.3 (<PyCode src="prob/bayes.py#formula+demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "по формуле Байеса: 0.092\n"
        "по симуляции:      0.092\n"
        "положительных: 9880 из них больны: 905\n"
    )
