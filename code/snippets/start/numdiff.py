"""Численная проверка производной: код для урока 0.6.

Регионы вставляются в урок при сборке (``<PyCode src="start/numdiff.py#diff+demo" run />``).
Функция в примере — x · x · x: только сложения и умножения, поэтому ошибки округления одинаковы
в Pyodide и в CPython, и тест сверяет вывод ячейки до последней цифры.
"""


# region diff
def forward(f, x, h):
    """Прямая разность, ошибка ~ h."""
    return (f(x + h) - f(x)) / h


def central(f, x, h):
    """Центральная, ошибка ~ h²."""
    return (f(x + h) - f(x - h)) / (2 * h)
# endregion


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока 0.6; тест сверяет её вывод с уроком."""
    # region demo
    def f(x):
        return x * x * x  # f'(1) = 3

    print("     h    прямая  центральная")
    for h in [1e-1, 1e-2, 1e-4, 1e-6, 1e-8, 1e-10, 1e-12]:
        print(f"{h:6.0e}  {abs(forward(f, 1.0, h) - 3):8.1e}  {abs(central(f, 1.0, h) - 3):8.1e}")
    # endregion
