"""Числа урока 0.6: центральная разность точнее прямой, а слишком маленький шаг портит обе."""

from start.numdiff import _lesson_cell, central, forward


def test_central_error_is_quadratic():
    """Для x³ в точке 1 центральная разность даёт 3 + h² — ровно, без остатка O(h³)."""
    f = lambda x: x * x * x  # noqa: E731
    assert abs(central(f, 1.0, 1e-2) - 3 - 1e-4) < 1e-12
    assert abs(forward(f, 1.0, 1e-2) - 3) > 100 * abs(central(f, 1.0, 1e-2) - 3)


def test_lesson_cell_output(capsys):
    """Ячейка урока 0.6 (<PyCode src="start/numdiff.py#diff+demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        "     h    прямая  центральная\n"
        " 1e-01   3.1e-01   1.0e-02\n"
        " 1e-02   3.0e-02   1.0e-04\n"
        " 1e-04   3.0e-04   1.0e-08\n"
        " 1e-06   3.0e-06   2.5e-11\n"
        " 1e-08   4.0e-09   7.1e-09\n"
        " 1e-10   2.5e-07   2.5e-07\n"
        " 1e-12   2.7e-04   1.0e-04\n"
    )
