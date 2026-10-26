"""Числа урока III.8: ошибка Монте-Карло порядка σ/√n, ЦПТ для суммы 30 показательных величин."""

import math

from prob.limits import _lesson_cell


def test_exact_integral():
    """Эталон в ячейке — ∫₀¹ e^(−x²) dx = √π/2 · erf(1)."""
    assert abs(math.sqrt(math.pi) / 2 * math.erf(1) - 0.746824) < 1e-6


def test_lesson_cell_output(capsys):
    """Ячейка урока III.8 (<PyCode src="prob/limits.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "n =     100: оценка 0.70954, ошибка 0.03728, σ/√n = 0.02121\n"
        "n =   10000: оценка 0.74720, ошибка 0.00038, σ/√n = 0.00201\n"
        "n = 1000000: оценка 0.74668, ошибка 0.00015, σ/√n = 0.00020\n"
        "k =  1: доля |Z| ≤ 1 — 0.864, доля Z > 2 — 0.0492\n"
        "k = 30: доля |Z| ≤ 1 — 0.684, доля Z > 2 — 0.0313\n"
    )
