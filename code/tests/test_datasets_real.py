"""Настоящие наборы курсов ML (S7.02): контрольные суммы, формы, типы, известные факты о данных; подвыборки сайта."""

import gzip
import hashlib
import shutil
from pathlib import Path

import numpy as np
import pytest

from mlf import datasets
from mlf.datasets import BANK_COLUMNS, HOUSE_COLUMNS, SOURCES, bank_marketing, house_sales

ROOT = Path(__file__).resolve().parents[2]


@pytest.mark.parametrize("name", list(SOURCES))
def test_package_file_checksum(name):
    body = gzip.decompress((datasets.DATA_DIR / f"{name}.csv.gz").read_bytes())
    assert hashlib.sha256(body).hexdigest() == SOURCES[name]["sha256"]


@pytest.mark.parametrize("name", list(SOURCES))
def test_site_subsample_checksum_and_size(name):
    path = ROOT / "public" / "data" / f"{name}-10k.csv"
    data = path.read_bytes()
    assert hashlib.sha256(data).hexdigest() == SOURCES[name]["subsample_sha256"]
    lines = data.decode("utf-8").splitlines()
    assert len(lines) - 1 == 10_000  # ≤ 10⁴ строк для браузера
    # подвыборка — строки полного набора в том же порядке
    full_header, full_rows = datasets.read_csv(name)
    assert lines[0] == ",".join(full_header)
    full = {",".join(r) for r in full_rows}
    assert all(line in full for line in lines[1:200])


def test_corrupted_file_is_rejected(tmp_path, monkeypatch):
    shutil.copy(datasets.DATA_DIR / "house_sales.csv.gz", tmp_path / "house_sales.csv.gz")
    body = gzip.decompress((tmp_path / "house_sales.csv.gz").read_bytes()).replace(b"221900", b"221901", 1)
    (tmp_path / "house_sales.csv.gz").write_bytes(gzip.compress(body))
    monkeypatch.setattr(datasets, "DATA_DIR", tmp_path)
    with pytest.raises(datasets.DataIntegrityError):
        house_sales()


def test_bank_marketing_shape_and_facts():
    b = bank_marketing()
    assert list(b) == list(BANK_COLUMNS)
    assert all(len(v) == 45_211 for v in b.values())
    assert b["age"].dtype == np.int64 and b["duration"].dtype == np.int64
    assert set(b["y"]) == {"yes", "no"}
    # отклик редкий: 5 289 из 45 211 — 11.7 %
    assert int((b["y"] == "yes").sum()) == 5_289
    # длительность — утечка: у звонков без отклика она заметно короче
    assert np.median(b["duration"][b["y"] == "yes"]) > 2 * np.median(b["duration"][b["y"] == "no"])


def test_house_sales_shape_and_facts():
    h = house_sales()
    assert list(h) == list(HOUSE_COLUMNS)
    assert all(len(v) == 21_613 for v in h.values())
    assert h["price"].dtype == np.int64 and h["bathrooms"].dtype == float
    assert h["price"].min() == 75_000 and h["price"].max() == 7_700_000 and np.median(h["price"]) == 450_000
    dates = sorted(h["date"])
    assert dates[0] == "2014-05-02" and dates[-1] == "2015-05-27"
    # 177 домов проданы повторно: при случайном разбиении один дом может попасть и в обучение, и в тест
    assert len(h["id"]) - len(np.unique(h["id"])) == 177
    assert 47.1 < h["lat"].min() and h["lat"].max() < 47.8


def test_as_frame_matches_columns():
    pd = pytest.importorskip("pandas")
    df = datasets.as_frame(house_sales())
    assert isinstance(df, pd.DataFrame) and df.shape == (21_613, 21)
