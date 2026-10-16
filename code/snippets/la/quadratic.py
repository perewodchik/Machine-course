"""Квадратичные формы и положительная определённость в NumPy: код для урока I.10.

Регион вставляется в урок при сборке: ``<PyCode src="la/quadratic.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока I.10; тест сверяет её вывод с уроком."""
    # region demo
    A = np.array([[2.0, 0.5], [0.5, 1.0]])  # заготовка «эллипсы» с рисунка 1
    lam, Q = np.linalg.eigh(A)
    print("λ =", lam.round(3))
    print("A ≻ 0:", bool(np.all(lam > 0)))
    print("полуоси уровня 1:", (1 / np.sqrt(lam)).round(3))

    S = Q @ np.diag(np.sqrt(lam)) @ Q.T  # корень A^{1/2}
    print("(A^½)² = A:", np.allclose(S @ S, A))
    L = np.linalg.cholesky(A)  # A = L Lᵀ, L нижнетреугольная
    print("L Lᵀ = A:", np.allclose(L @ L.T, A))

    X = np.array([[1.0, 2.0], [0.0, 1.0], [3.0, -1.0]])  # три объекта, два признака
    K = X @ X.T  # матрица Грама 3 × 3
    print(f"λ(K) ≥ 0: {bool(np.all(np.linalg.eigvalsh(K) > -1e-9))}, ранг K = {np.linalg.matrix_rank(K)}")

    try:
        np.linalg.cholesky(np.array([[1.0, 2.0], [2.0, 1.0]]))
    except np.linalg.LinAlgError as err:
        print("[[1, 2], [2, 1]]:", err)
    # endregion
