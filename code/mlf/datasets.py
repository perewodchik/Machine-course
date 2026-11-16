"""Учебные наборы данных курса: синтетические (воспроизводимые по seed) и настоящие (S7.02, ADR 0006).

«Квартиры» — площадь (м²) и цена (млн ₽) квартир: проходят через модули 0, I и II (урок 0.1, капстоуны I.12 и II).
Числа придуманы: цена растёт с площадью линейно, плюс шум; округлены, как в объявлениях.

Настоящие наборы лежат в пакете (``mlf/data/*.csv.gz``) и читаются без интернета; при чтении сверяется sha256.
Собирает их ``scripts/fetch_datasets.py`` из источников в ``SOURCES``; лицензии — в ADR 0006.
- ``bank_marketing()`` — Bank Marketing (UCI, CC BY 4.0): 45 211 звонков банка, отклик на вклад (проект P2).
- ``house_sales()`` — King County House Sales (OpenML 42092, CC0): 21 613 продаж домов (проект P1).
"""

from __future__ import annotations

import csv
import gzip
import hashlib
import io
from pathlib import Path

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


# Просмотры объявлений «Квартир» за неделю (урок 1.6 «Основ ML»): счётчик, порождённый пуассоновской моделью.
AD_FEATURES = ("фото", "цена к медиане района", "площадь, м²")


def ad_views(n: int = 2000, seed: int = 2030) -> tuple[np.ndarray, np.ndarray]:
    """X — n × 3 (``AD_FEATURES``), y — просмотры за неделю: y ~ Poisson(λ),
    log λ = 0.4 + 0.12 · (фото − 5) − 2.5 · (цена к медиане − 1) + 0.01 · (площадь − 70)."""
    rng = np.random.default_rng(seed)
    photos = rng.integers(0, 16, size=n).astype(float)
    rel = np.round(np.clip(rng.normal(1, 0.15, size=n), 0.6, 1.5), 2)
    area = np.round(rng.uniform(25, 120, size=n))
    eta = 0.4 + 0.12 * (photos - 5) - 2.5 * (rel - 1) + 0.01 * (area - 70)
    return np.column_stack([photos, rel, area]), rng.poisson(np.exp(eta)).astype(float)



# --- Настоящие наборы (S7.02) ----------------------------------------------------------------------------------

DATA_DIR = Path(__file__).resolve().parent / "data"

# raw_sha256 — файл источника, sha256 — наш CSV (до gzip), subsample_sha256 — public/data/<набор>-10k.csv.
SOURCES: dict[str, dict[str, str]] = {
    "bank_marketing": {
        "title": "Bank Marketing",
        "url": "https://archive.ics.uci.edu/static/public/222/bank+marketing.zip",
        "file": "bank.zip → bank-full.csv",
        "license": "CC BY 4.0",
        "citation": "Moro S., Rita P., Cortez P. Bank Marketing. UCI Machine Learning Repository, 2014. "
        "https://doi.org/10.24432/C5K306",
        "raw_sha256": "e0bf5f5de5b846e2f18e9d90606637267d46dfa260e0f17bb12e605db5efbeb4",
        "sha256": "b44507c26634736d4a0619ec2d7c4b6ff56a2c63cbeb5176d3134e7b25e416f0",
        "subsample_sha256": "dd44ad1dbbd3cebf8bf882fda7c9ee71d32b1ce14c9d537d466fb4bd3e6770dd",
    },
    "house_sales": {
        "title": "King County House Sales",
        "url": "https://api.openml.org/data/v1/get_csv/21578898",
        "file": "OpenML 42092 (house_sales, версия 2)",
        "license": "CC0 1.0 (общественное достояние)",
        "citation": "House Sales in King County, USA. OpenML, набор 42092; исходно — Kaggle, harlfoxem, 2016.",
        "raw_sha256": "bf899c19419051ed74099bcd1ce3405cdaf10e5ca31c451b5999c5c2df37decf",
        "sha256": "3eea3fd2e282bc67d125cb34902ec709556d2d10306d05852e4a81fca25cf79e",
        "subsample_sha256": "ffee489ff201d5a34ca68bed67f8e7b19b5fa27bcd12143232356320575ba02c",
    },
}

# Описания столбцов для ученика. Категориальные столбцы остаются строками.
BANK_COLUMNS = {
    "age": "возраст, лет",
    "job": "профессия",
    "marital": "семейное положение",
    "education": "образование",
    "default": "есть просроченный кредит",
    "balance": "средний годовой остаток, евро",
    "housing": "есть ипотека",
    "loan": "есть потребительский кредит",
    "contact": "тип связи",
    "day": "день месяца последнего звонка",
    "month": "месяц последнего звонка",
    "duration": "длительность последнего звонка, с — известна только после звонка: утечка (проект P2)",
    "campaign": "звонков клиенту в этой кампании",
    "pdays": "дней с прошлой кампании (−1 — не звонили)",
    "previous": "звонков до этой кампании",
    "poutcome": "итог прошлой кампании",
    "y": "открыл ли вклад (yes / no)",
}

HOUSE_COLUMNS = {
    "id": "номер дома (один дом может продаваться дважды)",
    "date": "дата продажи",
    "price": "цена, $",
    "bedrooms": "спален",
    "bathrooms": "санузлов (0.5 — без душа)",
    "sqft_living": "жилая площадь, кв. футы",
    "sqft_lot": "участок, кв. футы",
    "floors": "этажей",
    "waterfront": "на берегу (0 / 1)",
    "view": "вид, 0–4",
    "condition": "состояние, 1–5",
    "grade": "класс постройки, 1–13",
    "sqft_above": "площадь над землёй, кв. футы",
    "sqft_basement": "площадь подвала, кв. футы",
    "yr_built": "год постройки",
    "yr_renovated": "год ремонта (0 — не было)",
    "zipcode": "почтовый индекс",
    "lat": "широта",
    "long": "долгота",
    "sqft_living15": "жилая площадь 15 ближайших соседей, кв. футы",
    "sqft_lot15": "участок 15 ближайших соседей, кв. футы",
}

_TEXT_COLUMNS = {"job", "marital", "education", "default", "housing", "loan", "contact", "month", "poutcome", "y", "date"}

SQFT_TO_M2 = 0.09290304


class DataIntegrityError(RuntimeError):
    """Файл набора не совпал с контрольной суммой."""


def read_csv(name: str) -> tuple[list[str], list[list[str]]]:
    """Заголовок и строки набора ``name`` из ``mlf/data``; sha256 сверяется с ``SOURCES``."""
    body = gzip.decompress((DATA_DIR / f"{name}.csv.gz").read_bytes())
    if hashlib.sha256(body).hexdigest() != SOURCES[name]["sha256"]:
        raise DataIntegrityError(
            f"Файл mlf/data/{name}.csv.gz повреждён или изменён: контрольная сумма не совпала. "
            "Переустановите пакет mlf или пересоберите данные: python scripts/fetch_datasets.py"
        )
    rows = list(csv.reader(io.StringIO(body.decode("utf-8"))))
    return rows[0], rows[1:]


def _columns(name: str) -> dict[str, np.ndarray]:
    header, rows = read_csv(name)
    cols = list(zip(*rows))
    out: dict[str, np.ndarray] = {}
    for c, values in zip(header, cols):
        if c in _TEXT_COLUMNS:
            out[c] = np.array(values)
        elif any("." in v for v in values):
            out[c] = np.array(values, dtype=float)
        else:
            out[c] = np.array(values, dtype=np.int64)
    return out


def bank_marketing() -> dict[str, np.ndarray]:
    """Bank Marketing (UCI, CC BY 4.0): 45 211 звонков португальского банка в 2008–2010 годах.

    Словарь столбцов (``BANK_COLUMNS``): числа — массивы int, категории — массивы строк; цель — ``y`` («yes» у 11.7 %).
    Столбец ``duration`` известен только после звонка: в модели, которая решает, кому звонить, он — утечка.
    """
    return _columns("bank_marketing")


def house_sales() -> dict[str, np.ndarray]:
    """King County House Sales (OpenML 42092, CC0): 21 613 продаж домов в округе Кинг (Сиэтл), май 2014 — май 2015.

    Словарь столбцов (``HOUSE_COLUMNS``): цена — ``price`` в долларах, площади — в квадратных футах
    (``SQFT_TO_M2`` переводит в м²), дата — строка ГГГГ-ММ-ДД. Один дом (``id``) иногда продан дважды.
    """
    return _columns("house_sales")


def as_frame(columns: dict[str, np.ndarray]):
    """Тот же набор как ``pandas.DataFrame`` (pandas есть в Colab; сам пакет mlf от него не зависит)."""
    import pandas as pd

    return pd.DataFrame(columns)
