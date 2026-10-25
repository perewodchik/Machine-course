"""Сингулярное разложение, малоранговое приближение и псевдообратная в NumPy: код для урока I.11.

Регион вставляется в урок при сборке: ``<PyCode src="la/svd.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока I.11; тест сверяет её вывод с уроком."""
    # region demo
    A = np.array([[1.0, 1.0], [0.0, 1.0]])  # сдвиг с рисунка 1
    U, s, Vt = np.linalg.svd(A)
    print("σ =", s.round(3))
    print("A = U S Vᵀ:", np.allclose(U @ np.diag(s) @ Vt, A))
    print("σ² = λ(AᵀA):", np.allclose(s**2, np.linalg.eigvalsh(A.T @ A)[::-1]))

    # ранг 2: крупное слагаемое и мелкое, столбцы и строки слагаемых ортогональны
    B = np.outer([1, 2, 3, 4], [1, 0, 1]) + 0.1 * np.outer([1, -1, -1, 1], [0, 1, 0])
    U, s, Vt = np.linalg.svd(B)
    print("σ(B) =", s.round(3))
    B1 = s[0] * np.outer(U[:, 0], Vt[0])  # приближение ранга 1
    print("‖B − B₁‖_F =", round(float(np.linalg.norm(B - B1)), 3))

    a = np.array([[1.0, 1.0]])  # одно уравнение x₁ + x₂ = 2
    b = np.array([2.0])
    print("x⁺ =", (np.linalg.pinv(a) @ b).round(3))
    print("lstsq:", np.linalg.lstsq(a, b, rcond=None)[0].round(3))
    # endregion
