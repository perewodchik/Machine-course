"""Учебные наборы данных: воспроизводимы, в разумных пределах, связь — та, о которой говорит урок."""

import numpy as np

from mlf.datasets import apartments


def test_apartments_reproducible_and_plausible():
    area, price = apartments()
    area2, price2 = apartments()
    assert np.array_equal(area, area2) and np.array_equal(price, price2)
    assert area.shape == price.shape == (16,)
    assert area.min() >= 28 and area.max() <= 110
    assert price.min() > 0
    # цена растёт с площадью: наклон МНК близок к заложенному 0.12 млн ₽ за м²
    slope = np.polyfit(area, price, 1)[0]
    assert 0.09 < slope < 0.15


def test_game_export_matches_dataset():
    """Игра «Подгони прямую» рисует ровно «Квартиры»: экспорт не разошёлся с генератором.

    Если тест упал — перегенерировать: python scripts/export_widget_data.py
    """
    import json
    from pathlib import Path

    data = json.loads((Path(__file__).resolve().parents[2] / "src/games/fit-line/data.json").read_text())
    area, price = apartments()
    assert data["area"] == area.tolist()
    assert data["price"] == price.tolist()

