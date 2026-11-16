"""Проект P1 «Цена квартиры» (S7.05): числа из текста ноутбука и подложенные ошибки.

Тест исполняет код ноутбука с решениями (как CI после build_notebooks.py) и проверяет: RMSE этапов, порог проекта,
что заготовка ученика не проходит, а подложенные ошибки — утечка масштабирования, подбор по тесту, RMSE по логарифму
цены, один дом в обучении и в тесте — ловятся проверками.
"""

import importlib.util
import re
from pathlib import Path

import numpy as np
import pytest

from mlf import project
from mlf.check import CheckFailed
from mlf.datasets import house_sales
from mlf.snippets import expand

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "notebooks" / "src" / "projects" / "p1_house_prices.py"

spec = importlib.util.spec_from_file_location("build_notebooks", ROOT / "scripts" / "build_notebooks.py")
build_notebooks = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build_notebooks)


def notebook_code(transform) -> str:
    """Код ячеек ноутбука: директивы snippet раскрыты, магия %pip убрана."""
    source = expand(SRC.read_text(encoding="utf-8"))
    source = re.sub(r"^(\s*)# %pip .*$", r"\1pass", transform(source), flags=re.M)
    return source


@pytest.fixture(scope="module")
def solved():
    ns: dict = {"__name__": "p1"}
    exec(compile(notebook_code(build_notebooks.keep_solutions), str(SRC), "exec"), ns)  # noqa: S102
    return ns


def test_numbers_in_notebook_text(solved):
    # «эталонное решение получает около 127 000 $ против 200 000 $» — этап 3 против этапа 1
    assert round(solved["rmse_ols"], -3) == 200_000
    assert round(solved["rmse_feat"], -3) == 127_000
    assert solved["rmse_feat"] <= 0.85 * solved["rmse_ols"]
    assert solved["rmse_mean"] > solved["rmse_ols"]
    # порог проекта 160 000 $: эталон проходит с запасом, линейная модель по сырым признакам — нет
    assert solved["score"] < 125_000
    assert solved["P"].threshold == 160_000 and solved["P"].finals == 1
    assert solved["P"].stages[-1] == "оценка и ошибки"


def test_raw_linear_model_fails_threshold(solved):
    """Без признаков этапа 3 проект не зачтён: порог отделяет работу над признаками от бейзлайна."""
    ns = solved
    rows = np.arange(len(ns["price"]))
    _, _, test = project.split(rows, ns["price"], seed=2026, groups=ns["h"]["id"])
    P = project.Project("сырые признаки", test, threshold=ns["P"].threshold)
    X_fit = ns["numeric"](ns["r_fit"])
    theta = np.linalg.lstsq(ns["design"](X_fit, X_fit), ns["y_fit"], rcond=None)[0]
    with pytest.raises(CheckFailed, match="Метрика на закрытой выборке"):
        P.final(lambda r: ns["design"](X_fit, ns["numeric"](r)) @ theta)


def test_student_version_does_not_pass():
    ns: dict = {"__name__": "p1_student"}
    with pytest.raises(NotImplementedError):
        exec(compile(notebook_code(build_notebooks.strip_solutions), str(SRC), "exec"), ns)  # noqa: S102


def test_scaling_leak_is_caught():
    def leaky_all(X_fit, X):
        both = np.vstack([X_fit, X])
        return (X - both.mean(0)) / both.std(0)

    def leaky_self(X_fit, X):
        return (X - X.mean(0)) / X.std(0)

    for bad in (leaky_all, leaky_self):
        with pytest.raises(project.LeakError, match="утечка масштабирования"):
            project.check_scaling(bad)
    project.check_scaling(lambda X_fit, X: (X - X_fit.mean(0)) / X_fit.std(0, ddof=1))


def test_selection_by_test_is_caught(solved):
    with pytest.raises(project.LeakError):
        solved["test"].X
    with pytest.raises(project.LeakError, match="уже была"):
        solved["P"].final(lambda r: np.zeros(len(r)))


def test_log_price_without_inverse_is_caught(solved):
    ns = solved
    with pytest.raises(CheckFailed, match="np.exp"):
        project.check_units(np.log(ns["pred_va"]), ns["y_va"])


def test_group_split_keeps_each_house_in_one_part():
    h = house_sales()
    rows = np.arange(len(h["id"]))
    (r_tr, _), (r_va, _), test = project.split(rows, h["price"], seed=2026, groups=h["id"])
    r_te = test._open()[0]
    parts = [set(h["id"][r]) for r in (r_tr, r_va, r_te)]
    assert not (parts[0] & parts[1] or parts[0] & parts[2] or parts[1] & parts[2])
    assert len(r_tr) + len(r_va) + len(r_te) == len(rows)
    # без групп повторные продажи расходятся по частям — именно эту утечку закрывает groups
    (r_tr, _), _, test = project.split(rows, h["price"], seed=2026)
    assert set(h["id"][r_tr]) & set(h["id"][test._open()[0]])
