"""Числа урока III.13: H(p, q) = H(p) + KL(p ‖ q), KL несимметрична, минимум средней кросс-энтропии на выборке —
у эмпирических частот (оценка максимального правдоподобия), даже ниже, чем у истинного p."""

from prob.information import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока III.13 (<PyCode src="prob/information.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        'H(p) = 1.2799  H(p, q) = 1.3863  KL(p‖q) = 0.1064\n'
        'KL(q‖p) = 0.1218  — не то же самое\n'
        '    частоты: −среднее log q(x⁽ⁱ⁾) = 1.2911\n'
        ' истинное p: −среднее log q(x⁽ⁱ⁾) = 1.2938\n'
        'равномерное: −среднее log q(x⁽ⁱ⁾) = 1.3863\n'
    )
