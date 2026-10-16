"""Числа урока I.10: у [[2, 0.5], [0.5, 1]] собственные значения 0.793 и 2.207, полуоси уровня 1 — 1/√λ."""

import numpy as np

from la.quadratic import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока I.10 (<PyCode src="la/quadratic.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "λ = [0.793 2.207]\n"
        "A ≻ 0: True\n"
        "полуоси уровня 1: [1.123 0.673]\n"
        "(A^½)² = A: True\n"
        "L Lᵀ = A: True\n"
        "λ(K) ≥ 0: True, ранг K = 2\n"
        "[[1, 2], [2, 1]]: Matrix is not positive definite\n"
    )


def test_lesson_numbers():
    """Числа из текста урока: λ = (3 ± √2)/2 у заготовки «эллипсы», −1 и 3 у [[1, 2], [2, 1]], 1 ± 2i у поворота со сжатием."""
    assert np.allclose(np.linalg.eigvalsh([[2.0, 0.5], [0.5, 1.0]]), [(3 - np.sqrt(2)) / 2, (3 + np.sqrt(2)) / 2])
    assert np.allclose(np.linalg.eigvalsh([[1.0, 2.0], [2.0, 1.0]]), [-1.0, 3.0])
    assert np.allclose(sorted(np.linalg.eigvals([[1.0, 2.0], [-2.0, 1.0]]), key=lambda z: z.imag), [1 - 2j, 1 + 2j])
