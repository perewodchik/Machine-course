"""Зависимость без условия и независимость при условии: два броска одной из двух монет (урок III.2).

Регион вставляется в урок при сборке: ``<PyCode src="prob/conditional.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока III.2; тест сверяет её вывод с уроком."""
    # region demo
    rng = np.random.default_rng(1)
    n = 200_000
    biased = rng.uniform(size=n) < 0.5  # с вероятностью ½ берём кривую монету
    p_heads = np.where(biased, 0.9, 0.5)  # у кривой орёл в 90 % бросков
    h1 = rng.uniform(size=n) < p_heads  # первый бросок той же монеты
    h2 = rng.uniform(size=n) < p_heads  # второй бросок

    print("P(орёл₂)            ≈", h2.mean().round(3))
    print("P(орёл₂ | орёл₁)    ≈", h2[h1].mean().round(3))  # первый орёл намекает, что монета кривая
    for name, c in [("кривая", biased), ("честная", ~biased)]:
        print(f"монета {name}: P(орёл₂ | C) ≈ {h2[c].mean().round(3)}, P(орёл₂ | орёл₁, C) ≈ {h2[c & h1].mean().round(3)}")
    # endregion
