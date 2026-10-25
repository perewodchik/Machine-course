"""Гессиан и классификация критических точек: код для урока II.4.

Регион вставляется в урок при сборке: ``<PyCode src="calculus/hessian.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока II.4; тест сверяет её вывод с уроком."""
    # region demo
    def f(p):
        x, y = p
        return x**3 - 3 * x + y**2  # критические точки: (1, 0) и (−1, 0)

    def hessian(f, p, h=1e-4):
        """Численный гессиан: вторые разности по каждой паре координат."""
        n = len(p)
        H = np.zeros((n, n))
        for i, j in np.ndindex(n, n):
            ei, ej = h * np.eye(n)[i], h * np.eye(n)[j]
            H[i, j] = (f(p + ei + ej) - f(p + ei - ej) - f(p - ei + ej) + f(p - ei - ej)) / (4 * h * h)
        return H

    for p in [np.array([1.0, 0.0]), np.array([-1.0, 0.0])]:
        lam = np.linalg.eigvalsh(hessian(f, p))
        kind = "минимум" if (lam > 0).all() else "максимум" if (lam < 0).all() else "седло"
        print(p, "λ(H) =", lam.round(3), "→", kind)
    # endregion
