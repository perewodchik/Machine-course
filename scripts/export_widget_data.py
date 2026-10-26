"""Экспорт данных виджетов из сниппетов уроков: одни и те же числа в Python, в тексте урока и в виджете.

Запуск: python scripts/export_widget_data.py   (пишет prototype/assets/data/*.js и data.json виджетов сайта)
Тесты code/tests/test_threshold.py, test_normal_equations.py, test_features_lwr.py, test_logistic.py, test_softmax.py, test_glm.py, test_regularization.py и test_cross_val.py проверяют, что экспорт не разошёлся с генератором.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "code" / "snippets"))
sys.path.insert(0, str(ROOT / "code"))

from la.normal_equations import make_data  # noqa: E402
from ml_basics.logistic import expensive  # noqa: E402
from ml_basics.softmax import segments  # noqa: E402
from ml_basics.threshold import make_scores  # noqa: E402
from mlf.datasets import ad_views, apartments, apartments_full, bank_calls, metro_prices  # noqa: E402

OUT = ROOT / "prototype" / "assets" / "data"
# данные виджетов сайта: лежат рядом с виджетом, импортируются как JSON
SITE = {
    "fit-line": ROOT / "src" / "widgets" / "la" / "fit-line" / "data.json",
    "fit-line-game": ROOT / "src" / "games" / "fit-line" / "data.json",
    "threshold": ROOT / "src" / "widgets" / "ml" / "threshold" / "data.json",
    "flexibility": ROOT / "src" / "widgets" / "ml" / "flexibility" / "data.json",
    "logistic": ROOT / "src" / "widgets" / "ml" / "logistic-plane" / "data.json",
    "ascent-newton": ROOT / "src" / "widgets" / "ml" / "ascent-newton" / "data.json",
    "class-regions": ROOT / "src" / "widgets" / "ml" / "class-regions" / "data.json",
    "perceptron": ROOT / "src" / "widgets" / "ml" / "perceptron" / "data.json",
    "glm-builder": ROOT / "src" / "widgets" / "ml" / "glm-builder" / "data.json",
    "reg-path": ROOT / "src" / "widgets" / "ml" / "reg-path" / "data.json",
    "folds": ROOT / "src" / "widgets" / "ml" / "folds" / "data.json",
}


def threshold_payload() -> dict:
    scores, y = make_scores()
    return {"source": "code/snippets/ml_basics/threshold.py#data", "scores": scores.tolist(), "y": y.tolist()}


def fit_line_payload() -> dict:
    X, y = make_data()
    return {"source": "code/snippets/la/normal_equations.py#data", "x": X[:, 1].tolist(), "y": y.tolist()}


def apartments_payload() -> dict:
    area, price = apartments()
    return {"source": "code/mlf/datasets.py#apartments", "area": area.tolist(), "price": price.tolist()}


def metro_payload() -> dict:
    x, y = metro_prices()
    # разбиение — как в ячейке урока 1.3 (code/snippets/ml_basics/features_lwr.py): первые 56 из permutation(seed 0)
    train = sorted(np.random.default_rng(0).permutation(len(x))[:56].tolist())
    return {"source": "code/mlf/datasets.py#metro_prices", "x": x.tolist(), "y": y.tolist(), "train": train}


def logistic_payload() -> dict:
    F, y = expensive()
    return {"source": "code/snippets/ml_basics/logistic.py#data", "area": F[:, 0].tolist(), "metro": F[:, 1].tolist(), "y": y.astype(int).tolist()}


def segments_payload() -> dict:
    X, y = segments()
    return {"source": "code/snippets/ml_basics/softmax.py#data", "z1": np.round(X[:, 1], 6).tolist(), "z2": np.round(X[:, 2], 6).tolist(), "y": y.tolist()}


def glm_payload() -> dict:
    """Четыре набора для «Конструктора GLM» (урок 1.6): цена, «дороже медианы» и сегмент от площади — первые
    200 «Квартир»; просмотры от числа фото — первые 200 объявлений."""
    X, price = apartments_full()
    area, p200 = X[:200, 0], price[:200]
    seg = np.digitize(price, np.quantile(price, [1 / 3, 2 / 3]))[:200]
    F, views = ad_views()
    return {
        "source": "code/mlf/datasets.py#apartments_full, ad_views",
        "normal": {"x": area.tolist(), "y": p200.tolist()},
        "bernoulli": {"x": area.tolist(), "y": (p200 > np.median(price)).astype(int).tolist()},
        "poisson": {"x": F[:200, 0].tolist(), "y": views[:200].astype(int).tolist()},
        "categorical": {"x": area.tolist(), "y": seg.tolist()},
    }


def reg_path_payload() -> dict:
    """Первые 300 «Квартир» для «Пути регуляризации» (урок 2.3): 200 — обучение, 100 — валидация."""
    X, price = apartments_full()
    return {"source": "code/mlf/datasets.py#apartments_full", "X": X[:300].tolist(), "y": price[:300].tolist()}


def folds_payload() -> dict:
    """«Фолды» (урок 2.4): площадь и цена первых 60 «Квартир», отклики первых 60 звонков банка."""
    X, price = apartments_full()
    _, calls = bank_calls()
    return {"source": "code/mlf/datasets.py#apartments_full, bank_calls", "area": X[:60, 0].tolist(), "price": price[:60].tolist(), "calls": calls[:60].astype(int).tolist()}


def render(name: str, payload: dict) -> str:
    return f"// Сгенерировано scripts/export_widget_data.py — не править руками\nwindow.{name} = {json.dumps(payload, ensure_ascii=False)};\n"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "threshold.js").write_text(render("THRESHOLD_DATA", threshold_payload()))
    print("prototype/assets/data/threshold.js")
    for name, payload in (("fit-line", fit_line_payload()), ("fit-line-game", apartments_payload()), ("threshold", threshold_payload()), ("flexibility", metro_payload()), ("logistic", logistic_payload()), ("ascent-newton", logistic_payload()), ("class-regions", segments_payload()), ("perceptron", segments_payload()), ("glm-builder", glm_payload()), ("reg-path", reg_path_payload()), ("folds", folds_payload())):
        path = SITE[name]
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
        print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()
