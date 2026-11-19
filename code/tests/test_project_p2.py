"""Проект P2 «Отклик на предложение банка» (S7.06): числа из текста ноутбука и подложенные ошибки.

Исполняет код ноутбука с решениями и проверяет: порог проекта (PR-AUC ≥ 0.35) и промежуточные пороги, что заготовка
ученика не проходит, а подложенные ошибки ловятся — длительность звонка в признаках, порог или модель по тесту,
нестратифицированное разбиение, порог не по максимуму прибыли.
"""

import importlib.util
import re
from pathlib import Path

import numpy as np
import pytest

from mlf import project
from mlf.check import CheckFailed
from mlf.snippets import expand

sklearn_metrics = pytest.importorskip("sklearn.metrics")

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "notebooks" / "src" / "projects" / "p2_bank_marketing.py"

spec = importlib.util.spec_from_file_location("build_notebooks", ROOT / "scripts" / "build_notebooks.py")
build_notebooks = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build_notebooks)


def notebook_code(transform) -> str:
    source = expand(SRC.read_text(encoding="utf-8"))
    return re.sub(r"^(\s*)# %pip .*$", r"\1pass", transform(source), flags=re.M)


@pytest.fixture(scope="module")
def solved():
    ns: dict = {"__name__": "p2"}
    exec(compile(notebook_code(build_notebooks.keep_solutions), str(SRC), "exec"), ns)
    return ns


def test_numbers_and_thresholds(solved):
    ns = solved
    # «у случайной модели — 0.117, доля откликов»
    assert round(ns["y_all"].mean(), 3) == 0.117
    # честная модель ≈ 0.40, с утечкой ≈ 0.56: длительность звонка завышает PR-AUC
    assert round(ns["ap_newton"], 2) == 0.40 and round(ns["ap_leak"], 2) == 0.56
    assert ns["ap_va"] >= 0.37
    # порог проекта 0.35: эталон проходит с запасом
    assert ns["P"].threshold == 0.35 and ns["P"].finals == 1 and ns["score"] > 0.40
    # выбранный порог прибыльнее, чем звонить всем, — и на валидации, и на тесте
    assert ns["profit"](ns["y_va"], ns["p_va"], ns["t_best"]) > ns["profit"](ns["y_va"], ns["p_va"], 0)
    extra = ns["P"].extra
    assert extra["прибыль при выбранном пороге, €"] > extra["прибыль, если звонить всем, €"]
    # калибровка Платта исправляет завышенные вероятности модели с весами классов
    assert ns["b_cal"] < 0.6 * ns["b_raw"]


def test_our_metrics_match_sklearn(solved):
    ns = solved
    assert abs(ns["ap_va"] - sklearn_metrics.average_precision_score(ns["y_va"], ns["p_va"])) < 1e-12
    assert abs(project.brier(ns["y_va"], ns["p_va"]) - sklearn_metrics.brier_score_loss(ns["y_va"], ns["p_va"])) < 1e-12


def test_student_version_does_not_pass():
    with pytest.raises(NotImplementedError):
        exec(compile(notebook_code(build_notebooks.strip_solutions), str(SRC), "exec"), {"__name__": "p2s"})


def test_duration_leak_is_caught():
    with pytest.raises(project.LeakError, match="duration"):
        project.check_features(["age", "duration"], {"duration": "известна только после звонка"})


def test_threshold_on_test_is_caught(solved):
    with pytest.raises(project.LeakError):
        _ = solved["test"].X
    with pytest.raises(project.LeakError, match="уже была"):
        solved["P"].final(lambda r: np.zeros(len(r)))


def test_wrong_threshold_is_caught(solved):
    ns = solved

    def half_threshold(p, y, cost, gain):  # «порог 0.5 по умолчанию»
        return 0.5

    with pytest.raises(CheckFailed, match="(?i)best_threshold"):
        ns["check"].matches(half_threshold, ns["brute_force"], inputs=ns["threshold_task"], name="best_threshold")


def test_stratified_split_keeps_rate():
    rng = np.random.default_rng(0)
    y = (rng.random(5000) < 0.1).astype(float)
    (_, y_tr), (_, y_va), test = project.split(np.arange(5000), y, seed=3, stratify=True)
    y_te = test._open()[1]
    assert abs(y_tr.mean() - y_va.mean()) < 0.002 and abs(y_tr.mean() - y_te.mean()) < 0.002
    assert len(y_tr) + len(y_va) + len(y_te) == 5000
