"""Численная проверка формул и выводов из content/formulas/**.yaml.

Каждый символ формулы заменяется случайным массивом нужной формы (формы — из поля ``symbols``),
затем выражения из ``check`` вычисляются в NumPy:

- ``identity``: ``lhs`` и ``rhs`` совпадают;
- ``gradient``: ``grad`` совпадает с численным градиентом ``f`` по ``wrt`` (центральные разности);
- шаги вывода: ``same`` — значение совпадает с предыдущим шагом ``same``; ``gradient`` — градиент
  последнего ``same`` по ``wrt``; ``stationary`` — равенство ``lhs = rhs`` в найденном решении;
  ``solution`` — выражение для точки минимума, в которой градиент обращается в ноль.

Мутации правила (``mutations``) — типичные ошибки: их ``py`` обязан отличаться от верной части
(``rhs`` или ``grad``), иначе «ошибка» на деле верна и вводила бы ученика в заблуждение.

Несогласованные размерности NumPy ловит сам: выражение просто не вычислится.
Вектор-столбец формы [d, 1] в проверках — одномерный массив длины d.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

import numpy as np

DIMS = {"n": 7, "d": 3, "m": 4, "k": 5, "p": 2}


def _shape(spec: list[Any]) -> tuple[int, ...]:
    dims = tuple(DIMS[s] if isinstance(s, str) else int(s) for s in spec)
    if len(dims) == 2 and dims[1] == 1:  # вектор-столбец
        return (dims[0],)
    return dims


def sample_symbols(symbols: list[dict], rng: np.random.Generator) -> dict[str, Any]:
    env: dict[str, Any] = {"np": np}
    for sym in symbols:
        shape = _shape(sym.get("shape", []))
        value = rng.normal(size=shape)
        kind = sym.get("sample", "normal")
        if kind == "invertible":
            value = value + shape[0] * np.eye(shape[0])
        elif kind == "spd":
            value = value @ value.T + shape[0] * np.eye(shape[0])
        elif kind == "positive":  # стандартное отклонение, шаг: строго больше нуля и не крошечное
            value = np.abs(value) + 1.0
        elif kind == "simplex":  # распределение вероятностей: все элементы > 0, сумма 1
            value = np.abs(value) + 0.1
            value = value / np.sum(value)
        env[sym["name"]] = value
    return env


def evaluate(expr: str, env: dict[str, Any]):
    # Выражения берутся только из репозитория курса; встроенные функции Python им не нужны.
    return eval(expr, {"__builtins__": {"abs": abs}}, dict(env))  # noqa: S307


def numeric_gradient(f: Callable[[dict], float], env: dict[str, Any], wrt: str, h: float = 1e-6) -> np.ndarray:
    x = np.asarray(env[wrt], dtype=float)
    grad = np.zeros_like(x)
    for idx in np.ndindex(x.shape):
        step = np.zeros_like(x)
        step[idx] = h
        grad[idx] = (f({**env, wrt: x + step}) - f({**env, wrt: x - step})) / (2 * h)
    return grad


@dataclass
class Report:
    formula: str
    problems: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.problems


def _close(a, b, rtol: float = 1e-5, atol: float = 1e-6) -> bool:
    return np.shape(a) == np.shape(b) and np.allclose(a, b, rtol=rtol, atol=atol)


def check_formula(data: dict, seed: int = 0) -> Report:
    report = Report(data.get("id", "?"))
    env = sample_symbols(data.get("symbols", []), np.random.default_rng(seed))

    for i, c in enumerate(data.get("checks", []), 1):
        try:
            if c["kind"] == "identity":
                if not _close(evaluate(c["lhs"], env), evaluate(c["rhs"], env)):
                    report.problems.append(f"проверка {i}: левая и правая части не совпадают")
            elif c["kind"] == "gradient":
                expected = numeric_gradient(lambda e: evaluate(c["f"], e), env, c["wrt"])
                if not _close(evaluate(c["grad"], env), expected):
                    report.problems.append(f"проверка {i}: градиент не совпадает с численным")
        except Exception as exc:  # размерности, опечатки в выражении
            report.problems.append(f"проверка {i}: выражение не вычисляется ({exc})")

    # мутации правила (S3.05): типичная ошибка должна давать другой ответ — иначе это не ошибка
    reference = next((c.get("rhs") or c.get("grad") for c in data.get("checks", [])), None)
    for i, m in enumerate(data.get("mutations", []), 1):
        try:
            same = reference is not None and _close(evaluate(m["py"], env), evaluate(reference, env))
        except Exception:  # размерности не сходятся — ошибка видна и так
            same = False
        if same:
            report.problems.append(f"мутация {i}: «{m['tex']}» совпадает с верным ответом — это не ошибка")

    steps = data.get("derivation", {}).get("steps", [])
    ref = f_expr = grad_expr = None
    stationary: list[tuple[int, dict]] = []
    for i, step in enumerate(steps, 1):
        c = step.get("check")
        if not c:
            continue
        try:
            kind = c["kind"]
            if kind == "same":
                value = evaluate(c["py"], env)
                if ref is not None and not _close(value, ref):
                    report.problems.append(f"шаг {i}: значение не совпадает с предыдущим шагом")
                ref, f_expr = value, c["py"]
            elif kind == "gradient":
                expected = numeric_gradient(lambda e: evaluate(f_expr, e), env, c["wrt"])
                if not _close(evaluate(c["py"], env), expected):
                    report.problems.append(f"шаг {i}: градиент не совпадает с численным градиентом шага выше")
                grad_expr = c["py"]
            elif kind == "stationary":
                stationary.append((i, c))
            elif kind == "solution":
                at = {**env, c["wrt"]: evaluate(c["py"], env)}
                if grad_expr and not _close(evaluate(grad_expr, at), np.zeros_like(at[c["wrt"]]), atol=1e-8):
                    report.problems.append(f"шаг {i}: в найденной точке градиент не равен нулю")
                for j, s in stationary:
                    if not _close(evaluate(s["lhs"], at), evaluate(s["rhs"], at)):
                        report.problems.append(f"шаг {j}: равенство не выполняется в найденной точке")
        except Exception as exc:
            report.problems.append(f"шаг {i}: выражение не вычисляется ({exc})")
    return report


def formula_files(root: Path) -> list[Path]:
    return sorted((root / "content" / "formulas").rglob("*.yaml"))
