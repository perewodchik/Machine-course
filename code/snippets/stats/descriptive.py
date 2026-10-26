"""Описательные статистики цен «Квартир» и одна опечатка: среднее и s уезжают, медиана и IQR стоят (урок IV.1).

Регион вставляется в урок при сборке: ``<PyCode src="stats/descriptive.py#demo" run />``. Генератор цен повторяет
``mlf.datasets.apartments`` (в браузере пакета нет); тест сверяет их.
"""

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока IV.1; тест сверяет её вывод с уроком."""
    # region demo
    rng = np.random.default_rng(2026)
    area = np.round(rng.uniform(28, 110, size=16))
    price = np.round(1.5 + 0.12 * area + rng.normal(0, 0.9, size=16), 1)  # «Квартиры», млн ₽

    def describe(x):
        q1, q3 = np.quantile(x, [0.25, 0.75])
        return f"x̄ = {x.mean():.2f}, медиана = {np.median(x):.2f}, s = {x.std(ddof=1):.2f}, IQR = {q3 - q1:.2f}"

    print("цены:      ", describe(price))
    typo = price.copy()
    typo[0] = price[0] * 100  # опечатка: забыли десятичную точку
    print("с опечаткой:", describe(typo))
    print("np.std по умолчанию делит на n:", price.std().round(3), " ddof=1 — на n − 1:", price.std(ddof=1).round(3))
    # endregion
