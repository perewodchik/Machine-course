"""Каждая формула и каждый шаг вывода из content/formulas проверяются численно на нескольких seed."""

from pathlib import Path

import pytest
import yaml

from mlf.formulas import check_formula, formula_files

ROOT = Path(__file__).resolve().parents[2]
FILES = formula_files(ROOT)


@pytest.mark.parametrize("path", FILES, ids=[p.stem for p in FILES])
@pytest.mark.parametrize("seed", [0, 1, 2])
def test_formula(path, seed):
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    report = check_formula(data, seed=seed)
    assert report.ok, f"{report.formula}: " + "; ".join(report.problems)


def test_broken_derivation_is_caught():
    """Харнесс должен ловить типичную ошибку: (Xθ)ᵀ = Xᵀθᵀ превращает шаг в неверный."""
    data = yaml.safe_load((ROOT / "content/formulas/calc/normal-equations.yaml").read_text(encoding="utf-8"))
    data["derivation"]["steps"][2]["check"]["py"] = "0.5 * (theta @ X.T @ X @ theta - y @ X @ theta + y @ y)"
    assert not check_formula(data).ok
