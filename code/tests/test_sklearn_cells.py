"""Ячейки сверки со scikit-learn в уроках 1.1–1.6 «Основ ML» (S7.12): вывод совпадает с текстом урока.

Ячейки идут в браузере на scikit-learn из Pyodide (1.8), здесь — на установленной версии: вывод выбран так, чтобы
не зависеть от версии (совпадение с допуском, а не крошечные разницы), — числа в нём те, что называет урок.
"""

import pytest

pytest.importorskip("sklearn")

from ml_basics import features_lwr, glm, learning_problem, lms, logistic, softmax

EXPECTED = {
    learning_problem: (
        "веса совпали с LinearRegression: True\n"
        "RMSE: наш 0.8181, sklearn 0.8181\n"
        "MAE:  наш 0.6548, sklearn 0.6548\n"
    ),
    lms: (
        "пакетный спуск совпал с LinearRegression до 10⁻³: True\n"
        "SGD — в облаке вокруг минимума (ближе 0.2): True наш, True SGDRegressor\n"
    ),
    features_lwr: (
        "признаки совпали с PolynomialFeatures: True\n"
        "степень 2: RMSE вал. наша 19.20, sklearn 19.20\n"
        "степень 4: RMSE вал. наша 11.98, sklearn 11.98\n"
        "степень 9: RMSE вал. наша 12.52, sklearn 12.52\n"
    ),
    logistic: (
        "Ньютон:            [-0.422  7.418 -1.033]\n"
        "LogisticRegression: [-0.422  7.418 -1.033]\n"
        "по умолчанию (C=1): [-0.178  4.041 -0.574]\n"
    ),
    softmax: (
        "Perceptron из sklearn на разделимых классах, доля верных: 1.0\n"
        "вероятности softmax совпали с LogisticRegression до 10⁻³: True\n"
    ),
    glm: (
        "Ньютон:           [ 1.506  0.122 -2.42   0.01 ]\n"
        "PoissonRegressor: [ 1.506  0.122 -2.42   0.01 ]\n"
        "по умолчанию:     [-0.707  0.119 -0.144  0.011]\n"
    ),
}


@pytest.mark.parametrize("module", list(EXPECTED), ids=lambda m: m.__name__.split(".")[-1])
def test_sklearn_cell_output(module, capsys):
    module._sklearn_cell()
    assert capsys.readouterr().out == EXPECTED[module]
