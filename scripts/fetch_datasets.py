"""Скачивает настоящие наборы данных курсов ML, сверяет контрольные суммы и собирает файлы курса (S7.02, ADR 0006).

Запуск: python scripts/fetch_datasets.py            (нужен интернет: archive.ics.uci.edu, api.openml.org)
        python scripts/fetch_datasets.py --check    (только сверить файлы в репозитории с mlf.datasets)

Что пишет:
- code/mlf/data/<набор>.csv.gz — полный набор в нашем формате (разделитель «,», UTF-8, gzip без времени); его
  читают загрузчики mlf.datasets, поэтому ноутбуки и CI работают без интернета;
- public/data/<набор>-10k.csv — подвыборка ≤ 10⁴ строк для ячеек Pyodide и виджетов (seed 2026).

Контрольные суммы сырых файлов и наших файлов записаны в mlf.datasets.SOURCES: если источник изменился, скрипт
падает, а не подменяет данные молча.
"""

from __future__ import annotations

import argparse
import csv
import gzip
import hashlib
import io
import sys
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "code"))

from mlf import datasets  # noqa: E402

PUBLIC = ROOT / "public" / "data"
SUBSAMPLE = 10_000
SUBSAMPLE_SEED = 2026


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def download(name: str) -> bytes:
    src = datasets.SOURCES[name]
    print(f"скачиваю {src['url']}")
    with urllib.request.urlopen(src["url"], timeout=120) as resp:
        raw = resp.read()
    got = sha256(raw)
    if got != src["raw_sha256"]:
        # OpenML может пересобрать CSV (формат чисел), содержимое при этом то же: решает сверка нашего файла ниже
        print(f"  внимание: sha256 сырого файла {got}, записан {src['raw_sha256']}")
    return raw


def bank_rows(raw: bytes) -> tuple[list[str], list[list[str]]]:
    """Bank Marketing: архив UCI → bank.zip → bank-full.csv (45 211 звонков, разделитель «;»)."""
    with zipfile.ZipFile(io.BytesIO(raw)) as outer, zipfile.ZipFile(io.BytesIO(outer.read("bank.zip"))) as inner:
        text = inner.read("bank-full.csv").decode("ascii")
    rows = list(csv.reader(io.StringIO(text), delimiter=";"))
    return rows[0], rows[1:]


def house_rows(raw: bytes) -> tuple[list[str], list[list[str]]]:
    """King County House Sales (OpenML 42092): дата → ГГГГ-ММ-ДД, цена — целые доллары, координаты — 4 знака."""
    rows = list(csv.reader(io.StringIO(raw.decode("utf-8"))))
    header, body = rows[0], rows[1:]
    col = {c: j for j, c in enumerate(header)}
    out = []
    for r in body:
        r = list(r)
        d = r[col["date"]]
        r[col["date"]] = f"{d[:4]}-{d[4:6]}-{d[6:8]}"
        r[col["price"]] = str(round(float(r[col["price"]])))
        for c in ("lat", "long"):
            r[col[c]] = f"{float(r[col[c]]):.4f}"
        for c in ("bathrooms", "floors"):
            r[col[c]] = f"{float(r[col[c]]):g}"
        out.append(r)
    return header, out


def to_csv(header: list[str], rows: list[list[str]]) -> bytes:
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator="\n")
    w.writerow(header)
    w.writerows(rows)
    return buf.getvalue().encode("utf-8")


def subsample(rows: list[list[str]]) -> list[list[str]]:
    import numpy as np

    idx = np.sort(np.random.default_rng(SUBSAMPLE_SEED).choice(len(rows), size=min(SUBSAMPLE, len(rows)), replace=False))
    return [rows[i] for i in idx]


PARSERS = {"bank_marketing": bank_rows, "house_sales": house_rows}


def build(name: str) -> None:
    src = datasets.SOURCES[name]
    header, rows = PARSERS[name](download(name))
    body = to_csv(header, rows)
    if sha256(body) != src["sha256"]:
        raise SystemExit(f"{name}: sha256 нашего CSV {sha256(body)}, ожидался {src['sha256']} — источник изменился")
    path = datasets.DATA_DIR / f"{name}.csv.gz"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(gzip.compress(body, compresslevel=9, mtime=0))
    small = to_csv(header, subsample(rows))
    if sha256(small) != src["subsample_sha256"]:
        raise SystemExit(f"{name}: sha256 подвыборки {sha256(small)}, ожидался {src['subsample_sha256']}")
    PUBLIC.mkdir(parents=True, exist_ok=True)
    (PUBLIC / f"{name}-10k.csv").write_bytes(small)
    print(f"  {name}: {len(rows)} строк → {path.relative_to(ROOT)}; подвыборка {SUBSAMPLE} → public/data/{name}-10k.csv")


def check() -> None:
    for name, src in datasets.SOURCES.items():
        datasets.read_csv(name)  # сверяет sha256 сам
        small = (PUBLIC / f"{name}-10k.csv").read_bytes()
        if sha256(small) != src["subsample_sha256"]:
            raise SystemExit(f"public/data/{name}-10k.csv: sha256 не совпадает")
        print(f"  {name}: ok")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="только сверить файлы в репозитории")
    args = ap.parse_args()
    if args.check:
        check()
    else:
        for name in datasets.SOURCES:
            build(name)
