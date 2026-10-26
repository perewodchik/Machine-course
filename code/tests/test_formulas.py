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


def test_rules_have_mutations():
    """У каждого правила есть хотя бы одна типичная ошибка (S3.05): из них строятся неверные варианты ответа."""
    for path in (ROOT / "content/formulas/rules").glob("*.yaml"):
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
        assert data.get("mutations"), f"{path.name}: нет mutations"


def test_mutation_equal_to_answer_is_caught():
    """«Мутация», которая совпадает с верным ответом, — ошибка в контенте: харнесс её ловит."""
    data = yaml.safe_load((ROOT / "content/formulas/rules/transpose-product.yaml").read_text(encoding="utf-8"))
    data["mutations"].append({"tex": "B^\\top A^\\top", "py": "B.T @ A.T", "why": "—"})
    report = check_formula(data)
    assert not report.ok
    assert "совпадает с верным ответом" in report.problems[0]



def test_broken_hessian_is_caught():
    """Гессиан без множителя 1 − g(z) — типичная ошибка: харнесс сверяет его с численным якобианом градиента."""
    data = yaml.safe_load((ROOT / "content/formulas/calc/logistic-loss-hessian.yaml").read_text(encoding="utf-8"))
    data["derivation"]["steps"][3]["check"]["py"] = "(1 / (1 + np.exp(-theta @ x))) * np.outer(x, x)"
    report = check_formula(data)
    assert not report.ok
    assert "гессиан" in report.problems[0]


def test_broken_scalar_hessian_is_caught():
    """По скалярному η гессиан — число: E T² без вычитания (E T)² — не дисперсия, харнесс это видит."""
    data = yaml.safe_load((ROOT / "content/formulas/stat/log-partition-moments.yaml").read_text(encoding="utf-8"))
    assert check_formula(data).ok
    data["derivation"]["steps"][2]["check"]["py"] = "np.sum(t ** 2 * b * np.exp(eta * t)) / np.sum(b * np.exp(eta * t))"
    report = check_formula(data)
    assert not report.ok
    assert "гессиан" in report.problems[0]


def test_familywise_union_bound():
    """Неравенство из f.familywise-error: 1 − ∏(1 − α_j) ≤ Σ α_j на случайных уровнях, равенство только при m = 1."""
    import numpy as np

    rng = np.random.default_rng(0)
    for m in range(1, 30):
        a = rng.uniform(0, 0.2, size=m)
        fwer = 1 - np.prod(1 - a)
        assert fwer <= np.sum(a) + 1e-12
        assert m == 1 or fwer < np.sum(a)


def test_step_mutation_equal_to_step_is_caught():
    """Подложенная ошибка шага (S5.01), которая на самом деле верна, — ошибка в контенте: харнесс её ловит."""
    data = yaml.safe_load((ROOT / "content/formulas/calc/normal-equations.yaml").read_text(encoding="utf-8"))
    step = data["derivation"]["steps"][2]
    step["mutations"] = [{"tex": "то же", "py": step["check"]["py"], "why": "—"}]
    report = check_formula(data)
    assert not report.ok
    assert "совпадает с верным шагом" in report.problems[0]


def test_reversed_jensen_is_caught():
    """Йенсен «не в ту сторону» (типичная ошибка V.2): оценка сверху вместо снизу роняет проверку bound."""
    data = yaml.safe_load((ROOT / "content/formulas/ml/em-jensen.yaml").read_text(encoding="utf-8"))
    assert check_formula(data).ok
    data["derivation"]["steps"][2]["check"]["side"] = "above"
    report = check_formula(data)
    assert not report.ok
    assert "оценка сверху нарушена" in report.problems[0]
