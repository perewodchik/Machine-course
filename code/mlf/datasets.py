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
