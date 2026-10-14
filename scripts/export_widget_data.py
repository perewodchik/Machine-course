"""Экспорт данных виджетов из сниппетов уроков: одни и те же числа в Python, в тексте урока и в виджете.

Запуск: python scripts/export_widget_data.py   (пишет prototype/assets/data/*.js)
Тест code/tests/test_threshold.py проверяет, что экспорт не разошёлся с генератором.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "code" / "snippets"))

from ml_basics.threshold import make_scores  # noqa: E402

OUT = ROOT / "prototype" / "assets" / "data"


def threshold_payload() -> dict:
    scores, y = make_scores()
    return {"source": "code/snippets/ml_basics/threshold.py#data", "scores": scores.tolist(), "y": y.tolist()}


def render(name: str, payload: dict) -> str:
    return f"// Сгенерировано scripts/export_widget_data.py — не править руками\nwindow.{name} = {json.dumps(payload, ensure_ascii=False)};\n"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "threshold.js").write_text(render("THRESHOLD_DATA", threshold_payload()))
    print("prototype/assets/data/threshold.js")


if __name__ == "__main__":
    main()
