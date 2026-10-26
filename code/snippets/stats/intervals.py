"""Доверительный интервал по ЦПТ и бутстрэпу, p-значение и множественные сравнения (урок IV.8★).

Регион вставляется в урок при сборке: ``<PyCode src="stats/intervals.py#demo" run />``.
"""

import math

import numpy as np


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока IV.8★; тест сверяет её вывод с уроком."""
    # region demo
    rng = np.random.default_rng(3)
    mu, sigma, n = 5.0, 2.0, 25

    # покрытие: 10 000 выборок, интервал x̄ ± 1.96 σ/√n
    means = rng.normal(mu, sigma, size=(10_000, n)).mean(axis=1)
    covered = np.abs(means - mu) <= 1.96 * sigma / np.sqrt(n)
    print(f"накрыли μ: {covered.mean():.3f}")

    # бутстрэп: интервал для медианы скошенной выборки — перевыборка с возвращением
    x = rng.exponential(scale=3.0, size=40)
    boot = np.median(rng.choice(x, size=(5000, x.size), replace=True), axis=1)
    lo, hi = np.quantile(boot, [0.025, 0.975])
    print(f"медиана {np.median(x):.3f}, бутстрэп-интервал 95 %: [{lo:.3f}, {hi:.3f}]")

    # p-значение: H0 μ = 5, двусторонний z-тест
    sample = rng.normal(5.8, sigma, size=n)
    z = (sample.mean() - 5.0) / (sigma / math.sqrt(n))
    p = 2 * (1 - 0.5 * (1 + math.erf(abs(z) / math.sqrt(2))))
    print(f"x̄ = {sample.mean():.3f}, Z = {z:.3f}, p = {p:.4f}")

    # 20 проверок при верных H0: доля опытов хотя бы с одной «значимой»
    zs = rng.normal(size=(10_000, 20))
    print(f"хотя бы одна ложная тревога: {(np.abs(zs) > 1.96).any(axis=1).mean():.3f}, с Бонферрони: {(np.abs(zs) > 3.02).any(axis=1).mean():.3f}")
    # endregion
