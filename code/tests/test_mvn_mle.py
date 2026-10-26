"""Числа урока IV.4: Σ̂ по формуле с внешними произведениями совпадает с np.cov(bias=True), а не с np.cov;
оценки GDA близки к истинным φ = 0.3, μ₁ − μ₀ = (2, 1), Σ."""

from stats.mvn_mle import _lesson_cell


def test_lesson_cell_output(capsys):
    """Ячейка урока IV.4 (<PyCode src="stats/mvn_mle.py#demo" run />) печатает ровно это."""
    _lesson_cell()
    assert capsys.readouterr().out == (
        'μ̂ = [ 1.035 -0.986]  Σ̂ = [[1.972, 0.829], [0.829, 1.032]]\n'
        'как np.cov(bias=True): True  как np.cov: False\n'
        'φ̂ = 0.298  μ̂₀ = [-0.03  0.  ]  μ̂₁ = [1.88 0.89]  Σ̂ = [[2.05, 0.83], [0.83, 1.0]]\n'
    )
