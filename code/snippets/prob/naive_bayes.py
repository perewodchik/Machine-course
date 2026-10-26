"""Наивный Байес на объявлениях «Квартир»: данные для капстоуна модуля III (лабораторная prob/naive_bayes_apartments).

В браузере пакета ``mlf`` нет, поэтому генератор данных повторён здесь; тест сверяет его с ``mlf.datasets.apartment_ads``.
"""

import numpy as np


# region data
WORDS = ("метро", "ремонт", "срочно", "торг", "новостройка", "без посредников", "аукцион")


def apartment_ads(n: int = 600, seed: int = 2027):
    """Объявления: X — n × 7 из 0 и 1 (есть ли слово), y — продалась ли квартира за неделю."""
    rng = np.random.default_rng(seed)
    y = (rng.random(n) < 0.35).astype(int)
    phi1 = np.array([0.70, 0.60, 0.50, 0.40, 0.30, 0.50, 0.01])
    phi0 = np.array([0.40, 0.30, 0.10, 0.30, 0.30, 0.45, 0.04])
    phi = np.where(y[:, None] == 1, phi1, phi0)
    X = (rng.random((n, len(WORDS))) < phi).astype(int)
    return X, y


X, y = apartment_ads()
X_train, y_train, X_test, y_test = X[:400], y[:400], X[400:], y[400:]
# endregion
