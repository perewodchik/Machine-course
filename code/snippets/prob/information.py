"""Энтропия, кросс-энтропия, KL на числах: несимметричность KL, минимум кросс-энтропии — частоты (урок III.13).

Регион вставляется в урок при сборке: ``<PyCode src="prob/information.py#demo" run />``.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока III.13; тест сверяет её вывод с уроком."""
    # region demo
    def H(p):
        p = p[p > 0]
        return -np.sum(p * np.log(p))

    def CE(p, q):
        return -np.sum(p * np.log(q))

    p = np.array([0.4, 0.3, 0.2, 0.1])
    q = np.array([0.25, 0.25, 0.25, 0.25])
    print("H(p) =", H(p).round(4), " H(p, q) =", CE(p, q).round(4), " KL(p‖q) =", (CE(p, q) - H(p)).round(4))
    print("KL(q‖p) =", (CE(q, p) - H(q)).round(4), " — не то же самое")

    # минимум кросс-энтропии по модели q — эмпирические частоты: это и есть максимум правдоподобия
    rng = np.random.default_rng(0)
    x = rng.choice(4, size=1000, p=p)
    freq = np.bincount(x, minlength=4) / len(x)
    for name, model in [("частоты", freq), ("истинное p", p), ("равномерное", q)]:
        print(f"{name:>11}: −среднее log q(x⁽ⁱ⁾) = {-np.mean(np.log(model[x])):.4f}")
    # endregion
