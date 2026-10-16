"""Числа урока I.11: у сдвига σ = 1.618 и 0.618 (золотое сечение), у B — √60 и 0.2, x⁺ уравнения x₁ + x₂ = 2 — (1, 1)."""

import numpy as np

from la.svd import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока I.11 (<PyCode src="la/svd.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "σ = [1.618 0.618]\n"
        "A = U S Vᵀ: True\n"
        "σ² = λ(AᵀA): True\n"
        "σ(B) = [7.746 0.2   0.   ]\n"
        "‖B − B₁‖_F = 0.2\n"
        "x⁺ = [1. 1.]\n"
        "lstsq: [1. 1.]\n"
    )


def test_lesson_numbers():
    """Числа из текста урока: σ сдвига — (√5 ± 1)/2, у него же оба λ = 1; σ₁(B) = √60; у diag(3, −2) σ = 3 и 2."""
    s = np.linalg.svd([[1.0, 1.0], [0.0, 1.0]], compute_uv=False)
    assert np.allclose(s, [(np.sqrt(5) + 1) / 2, (np.sqrt(5) - 1) / 2])
    assert np.allclose(np.linalg.eigvals([[1.0, 1.0], [0.0, 1.0]]), [1.0, 1.0])
    assert np.isclose(np.linalg.svd(np.outer([1, 2, 3, 4], [1, 0, 1]), compute_uv=False)[0], np.sqrt(60))
    assert np.allclose(np.linalg.svd(np.diag([3.0, -2.0]), compute_uv=False), [3.0, 2.0])
