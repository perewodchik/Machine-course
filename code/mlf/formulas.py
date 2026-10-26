"""Численная проверка формул и выводов из content/formulas/**.yaml.

Каждый символ формулы заменяется случайным массивом нужной формы (формы — из поля ``symbols``),
затем выражения из ``check`` вычисляются в NumPy:

- ``identity``: ``lhs`` и ``rhs`` совпадают;
- ``gradient``: ``grad`` совпадает с численным градиентом ``f`` по ``wrt`` (центральные разности);
- шаги вывода: ``same`` — значение совпадает с предыдущим шагом ``same``; ``gradient`` — градиент
  последнего ``same`` по ``wrt``; ``hessian`` — якобиан последнего ``gradient`` по ``wrt`` (по скаляру — число); ``stationary`` — равенство ``lhs = rhs`` в найденном решении;
  ``solution`` — выражение для точки минимума, в которой градиент обращается в ноль; ``identity`` — ``lhs = rhs``
  на тех же случайных символах (новая величина вне цепочки ``same``); ``bound`` — значение ``py`` не больше
  (``side: below``) или не меньше (``side: above``) последнего ``same``: неравенство Йенсена, граница.

Подложенные ошибки шага (``mutations`` у шага, S5.01) обязаны отличаться от верного значения шага.

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
        elif kind == "fraction":  # знаменатель прогрессии, коэффициент дисконтирования: 0 < γ < 1
            value = rng.uniform(0.05, 0.95, size=shape)
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
            if step.get("mutations"):
                report.problems.append(f"шаг {i}: у шага с mutations нужна численная проверка")
            continue
        target = None  # верное значение шага: с ним сравниваются подложенные ошибки (S5.01)
        try:
            kind = c["kind"]
            if kind == "same":
                value = evaluate(c["py"], env)
                if ref is not None and not _close(value, ref):
                    report.problems.append(f"шаг {i}: значение не совпадает с предыдущим шагом")
                ref, f_expr, target = value, c["py"], value
            elif kind == "gradient":
                expected = numeric_gradient(lambda e: evaluate(f_expr, e), env, c["wrt"])
                if not _close(evaluate(c["py"], env), expected):
                    report.problems.append(f"шаг {i}: градиент не совпадает с численным градиентом шага выше")
                grad_expr, target = c["py"], expected
            elif kind == "hessian":
                # гессиан — якобиан градиента шага выше: столбец j — производная градиента по координате j
                x = np.asarray(env[c["wrt"]], dtype=float)
                cols = []
                for j in range(x.size):
                    dx = np.zeros_like(x)
                    dx.flat[j] = 1e-6
                    plus = evaluate(grad_expr, {**env, c["wrt"]: x + dx})
                    minus = evaluate(grad_expr, {**env, c["wrt"]: x - dx})
                    cols.append((plus - minus) / 2e-6)
                # скалярный аргумент: гессиан — число, а не массив из одного столбца
                numeric = cols[0] if x.ndim == 0 else np.stack(cols, axis=-1)
                if not _close(evaluate(c["py"], env), numeric):
                    report.problems.append(f"шаг {i}: гессиан не совпадает с численным якобианом градиента")
                target = numeric
            elif kind == "stationary":
                stationary.append((i, c))
            elif kind == "identity":
                target = evaluate(c["rhs"], env)
                if not _close(evaluate(c["lhs"], env), target):
                    report.problems.append(f"шаг {i}: левая и правая части не совпадают")
            elif kind == "bound":
                target = evaluate(c["py"], env)
                below = c["side"] == "below"
                if ref is None or (target > ref + 1e-9 if below else target < ref - 1e-9):
                    report.problems.append(f"шаг {i}: оценка {'сверху' if not below else 'снизу'} нарушена: {target} и {ref}")
            elif kind == "solution":
                target = evaluate(c["py"], env)
                at = {**env, c["wrt"]: target}
                if grad_expr and not _close(evaluate(grad_expr, at), np.zeros_like(at[c["wrt"]]), atol=1e-8):
                    report.problems.append(f"шаг {i}: в найденной точке градиент не равен нулю")
                for j, s in stationary:
                    if not _close(evaluate(s["lhs"], at), evaluate(s["rhs"], at)):
                        report.problems.append(f"шаг {j}: равенство не выполняется в найденной точке")
        except Exception as exc:
            report.problems.append(f"шаг {i}: выражение не вычисляется ({exc})")
        for j, m in enumerate(step.get("mutations", []), 1):
            try:
                same = target is not None and _close(evaluate(m["py"], env), target)
            except Exception:  # размерности не сходятся — ошибка видна и так
                same = False
            if same:
                report.problems.append(f"шаг {i}, ошибка {j}: «{m['tex']}» совпадает с верным шагом — это не ошибка")
    return report


def formula_files(root: Path) -> list[Path]:
    return sorted((root / "content" / "formulas").rglob("*.yaml"))
