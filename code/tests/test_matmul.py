"""Числа урока I.3: `*` поэлементно, `@` матрично, AB ≠ BA; XᵀX — сумма внешних произведений по объектам."""

from la.matmul import _gram_cell, _star_cell


def test_star_cell_output(capsys):
    """Ячейка урока I.3 (<PyCode src="la/matmul.py#star" run />) печатает ровно это."""
    _star_cell()
    assert capsys.readouterr().out == (
        "A * B — поэлементно:\n[[0 2]\n [3 0]]\n"
        "A @ B — матричное:\n[[2 1]\n [4 3]]\n"
        "B @ A — другой порядок:\n[[3 4]\n [1 2]]\n"
    )


def test_gram_cell_output(capsys):
    """Ячейка урока I.3 (<PyCode src="la/matmul.py#gram" run />) печатает ровно это."""
    _gram_cell()
    assert capsys.readouterr().out == "форма X.T @ X: (3, 3)\nсумма по объектам совпала: True\n"
