"""Гауссов интеграл численно: прямо, через двойной интеграл и в полярных координатах (урок II.10).

Регион вставляется в урок при сборке: ``<PyCode src="calculus/integrals.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока II.10; тест сверяет её вывод с уроком."""
    # region demo
    x = np.linspace(-10, 10, 2001)
    I = np.trapezoid(np.exp(-x**2 / 2), x)  # хвосты за |x| > 10 пренебрежимо малы
    print("I        =", I.round(6), " √(2π) =", round(np.sqrt(2 * np.pi), 6))

    X, Y = np.meshgrid(x, x)
    I2 = np.trapezoid(np.trapezoid(np.exp(-(X**2 + Y**2) / 2), x), x)  # двойной интеграл по плоскости
    print("I²       =", I2.round(6), " 2π =", round(2 * np.pi, 6))

    r = np.linspace(0, 12, 20001)
    with_r = 2 * np.pi * np.trapezoid(np.exp(-r**2 / 2) * r, r)  # якобиан полярных координат — r
    without_r = 2 * np.pi * np.trapezoid(np.exp(-r**2 / 2), r)  # типичная ошибка
    print("полярные =", with_r.round(6), " без r:", without_r.round(6))
    # endregion
