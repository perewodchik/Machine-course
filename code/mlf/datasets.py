"""Учебные наборы данных курса: синтетические, воспроизводимые по seed.

«Квартиры» — площадь (м²) и цена (млн ₽) квартир: проходят через модули 0, I и II (урок 0.1, капстоуны I.12 и II).
Числа придуманы: цена растёт с площадью линейно, плюс шум; округлены, как в объявлениях.
"""

from __future__ import annotations

import numpy as np


def apartments(n: int = 16, seed: int = 2026) -> tuple[np.ndarray, np.ndarray]:
    """Площадь, м² (целые, 28–110) и цена, млн ₽ (с точностью 0.1): цена ≈ 1.5 + 0.12 · площадь + шум."""
    rng = np.random.default_rng(seed)
    area = np.round(rng.uniform(28, 110, size=n))
    price = np.round(1.5 + 0.12 * area + rng.normal(0, 0.9, size=n), 1)
    return area, price


# Слова объявлений «Квартир» для наивного Байеса (капстоун модуля III): метка — продалась ли квартира за неделю.
ADS_WORDS = ("метро", "ремонт", "срочно", "торг", "новостройка", "без посредников", "аукцион")
_ADS_PHI_Y = 0.35
_ADS_PHI_1 = (0.70, 0.60, 0.50, 0.40, 0.30, 0.50, 0.01)
_ADS_PHI_0 = (0.40, 0.30, 0.10, 0.30, 0.30, 0.45, 0.04)


def apartment_ads(n: int = 600, seed: int = 2027) -> tuple[np.ndarray, np.ndarray]:
    """Объявления о квартирах: X — n × 7 из 0 и 1 (есть ли слово ``ADS_WORDS[j]``), y — продалась ли за неделю.

    Порождены моделью наивного Байеса: y ~ Bernoulli(0.35), слова независимы при известном y. Слово «аукцион»
    у быстро проданных редкое (1 %): в первых 400 объявлениях его у них нет, а в остальных 200 оно встречается
    дважды — на нём видно, зачем нужно сглаживание Лапласа. Seed подобран под это.
    """
    rng = np.random.default_rng(seed)
    y = (rng.random(n) < _ADS_PHI_Y).astype(int)
    phi = np.where(y[:, None] == 1, np.array(_ADS_PHI_1), np.array(_ADS_PHI_0))
    X = (rng.random((n, len(ADS_WORDS))) < phi).astype(int)
    return X, y


# «Квартиры» с признаками для курса «Основы ML» (урок 1.1 и проект P1): цена — линейная по признакам плюс шум.
APARTMENT_FEATURES = ("площадь, м²", "комнат", "этаж", "до метро, мин", "возраст дома, лет")


def apartments_full(n: int = 2000, seed: int = 2028) -> tuple[np.ndarray, np.ndarray]:
    """n квартир: X — n × 5 (``APARTMENT_FEATURES``), y — цена, млн ₽ с точностью 0.01.

    Цена ≈ 1.5 + 0.11 · площадь + 0.4 · комнат + 0.03 · этаж − 0.06 · до метро − 0.02 · возраст + шум (σ = 0.8).
    Комнат больше у больших квартир: признаки коррелируют, как в настоящих объявлениях.
    """
    rng = np.random.default_rng(seed)
    area = np.round(rng.uniform(25, 120, size=n))
    rooms = np.clip(np.round(area / 30 + rng.normal(0, 0.5, size=n)), 1, 5)
    floor = rng.integers(1, 26, size=n).astype(float)
    metro = np.round(rng.uniform(2, 40, size=n))
    age = np.round(rng.uniform(0, 70, size=n))
    X = np.column_stack([area, rooms, floor, metro, age])
    price = 1.5 + 0.11 * area + 0.4 * rooms + 0.03 * floor - 0.06 * metro - 0.02 * age + rng.normal(0, 0.8, size=n)
    return X, np.round(price, 2)


def metro_prices(n: int = 80, seed: int = 2029) -> tuple[np.ndarray, np.ndarray]:
    """Цена квадратного метра (тыс. ₽, целые) от пешего пути до метро (мин, с точностью 0.5) — урок 1.3 «Основ ML».

    Зависимость нелинейная: у самого метро цена падает быстро, дальше — медленно, а около 28 минут — горб
    у нового транспортного узла. Цена ≈ 200 + 150 · exp(−x/6) + 25 · exp(−((x − 28)/4)²) + шум (σ = 10).
    """
    rng = np.random.default_rng(seed)
    x = np.round(rng.uniform(1, 40, size=n) * 2) / 2
    y = 200 + 150 * np.exp(-x / 6) + 25 * np.exp(-(((x - 28) / 4) ** 2)) + rng.normal(0, 10, size=n)
    return x, np.round(y)
