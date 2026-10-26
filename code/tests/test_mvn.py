"""Числа урока III.11: выборка через Холецкого воспроизводит Σ; внутри эллипсов уровня 1 и 2 — 1 − e^(−k²/2)
(39 % и 86 %); условное среднее по формуле μ₁ + Σ₁₂/Σ₂₂ (x₂ − μ₂)."""

import math

from prob.mvn import _lesson_cell


def test_level_fractions():
    """В двумерном случае (x − μ)ᵀΣ⁻¹(x − μ) ~ χ²₂: P(≤ k²) = 1 − e^(−k²/2)."""
    assert round(1 - math.exp(-0.5), 3) == 0.393
    assert round(1 - math.exp(-2), 3) == 0.865


def test_lesson_cell_output(capsys):
    """Ячейка урока III.11 (<PyCode src="prob/mvn.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        'выборочная Σ: [[2.01, 1.2], [1.2, 1.0]]\n'
        'внутри уровня 1: 0.392  уровня 2: 0.865\n'
        'E[X₁ | X₂ ≈ 0] по выборке: 2.21  формула: 2.2\n'
    )
