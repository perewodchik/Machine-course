"""Данные капстоуна модуля III: копия генератора в сниппете совпадает с mlf.datasets; слово «аукцион» не встречается
у проданных в обучающей части, но есть у них в отложенной — без сглаживания Лапласа потеря бесконечна."""

import numpy as np

from mlf.datasets import ADS_WORDS, apartment_ads
from prob import naive_bayes as nb


def test_snippet_matches_dataset():
    X, y = apartment_ads()
    assert np.array_equal(X, nb.X) and np.array_equal(y, nb.y)
    assert nb.WORDS == ADS_WORDS
    assert nb.X_train.shape == (400, 7) and nb.X_test.shape == (200, 7)


def test_zero_count_word():
    auction = ADS_WORDS.index("аукцион")
    assert nb.X_train[nb.y_train == 1, auction].sum() == 0
    assert nb.X_train[nb.y_train == 0, auction].sum() > 0
    # а в отложенной части оно есть и у проданных: без сглаживания на них модель ошибётся бесконечно уверенно
    assert nb.X_test[nb.y_test == 1, auction].sum() > 0
