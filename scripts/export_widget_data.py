"""Экспорт данных виджетов из сниппетов уроков: одни и те же числа в Python, в тексте урока и в виджете.

Запуск: python scripts/export_widget_data.py   (пишет prototype/assets/data/*.js и data.json виджетов сайта)
Тесты code/tests/test_threshold.py и test_normal_equations.py проверяют, что экспорт не разошёлся с генератором.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "code" / "snippets"))
sys.path.insert(0, str(ROOT / "code"))

from la.normal_equations import make_data  # noqa: E402
from ml_basics.threshold import make_scores  # noqa: E402
from mlf.datasets import apartments  # noqa: E402

OUT = ROOT / "prototype" / "assets" / "data"
# данные виджетов сайта: лежат рядом с виджетом, импортируются как JSON
SITE = {
    "fit-line": ROOT / "src" / "widgets" / "la" / "fit-line" / "data.json",
    "fit-line-game": ROOT / "src" / "games" / "fit-line" / "data.json",
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


def render(name: str, payload: dict) -> str:
    return f"// Сгенерировано scripts/export_widget_data.py — не править руками\nwindow.{name} = {json.dumps(payload, ensure_ascii=False)};\n"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "threshold.js").write_text(render("THRESHOLD_DATA", threshold_payload()))
    print("prototype/assets/data/threshold.js")
    for name, payload in (("fit-line", fit_line_payload()), ("fit-line-game", apartments_payload())):
        path = SITE[name]
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
        print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()
