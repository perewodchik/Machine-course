"""Проверки для лабораторных. Сообщения пишутся для ученика: что не так и что проверить.

``matches`` проверяет функцию свойствами (Hypothesis): сравнивает её с эталоном на данных разных размеров
и при расхождении сообщает минимальный контрпример — «ломается при n = 1».
"""

from __future__ import annotations

from typing import Any, Callable

import numpy as np


class CheckFailed(AssertionError):
    """Ответ не прошёл проверку. Текст ошибки адресован ученику."""


def shape(value: np.ndarray, expected: tuple[int, ...], name: str = "результат") -> None:
    """Проверяет форму массива и подсказывает про частую путаницу (n,) и (n, 1)."""
    actual = np.shape(value)
    if actual == tuple(expected):
        return
    hint = ""
    if len(actual) + len(expected) == 3 and np.prod(actual) == np.prod(expected):
        hint = " Похоже на путаницу (n,) и (n, 1): попробуйте .ravel() или .reshape(-1, 1)."
    raise CheckFailed(f"У {name} форма {actual}, а нужна {tuple(expected)}.{hint}")


def close(value, expected, name: str = "результат", rtol: float = 1e-6, atol: float = 1e-8) -> None:
    """Сравнивает числа или массивы с допуском; сначала проверяет форму."""
    expected = np.asarray(expected)
    shape(np.asarray(value), expected.shape, name)
    if not np.allclose(value, expected, rtol=rtol, atol=atol):
        diff = np.max(np.abs(np.asarray(value) - expected))
        raise CheckFailed(f"{name.capitalize()} отличается от ожидаемого (максимальная разница {diff:.3g}).")


def passed(message: str = "Проверка пройдена.") -> None:
    print(message)


def regression_data(draw, n: tuple[int, int] = (1, 12), d: tuple[int, int] = (1, 4), with_theta: bool = False):
    """Случайная задача регрессии: X (n × d) и y (n,), с with_theta — ещё веса θ (d,).

    Значения — целые от −5 до 5: контрпример легко прочитать. Для ``matches(..., inputs=...)``:
    ``inputs=lambda draw: check.regression_data(draw, with_theta=True)``.
    """
    from hypothesis import strategies as st
    from hypothesis.extra import numpy as hnp

    rows = draw(st.integers(*n))
    cols = draw(st.integers(*d))
    values = st.integers(-5, 5).map(float)
    X = draw(hnp.arrays(np.float64, (rows, cols), elements=values))
    y = draw(hnp.arrays(np.float64, (rows,), elements=values))
    if with_theta:
        return X, y, draw(hnp.arrays(np.float64, (cols,), elements=values))
    return X, y


def _describe(args: tuple) -> str:
    sizes = []
    if args and isinstance(args[0], np.ndarray) and args[0].ndim == 2:
        sizes = [f"n = {args[0].shape[0]}", f"d = {args[0].shape[1]}"]
    shown = ", ".join(np.array2string(np.asarray(a), separator=", ") if isinstance(a, np.ndarray) else repr(a) for a in args)
    return (", ".join(sizes) + f" — аргументы: {shown}") if sizes else f"аргументах {shown}"


def matches(
    func: Callable[..., Any],
    reference: Callable[..., Any],
    *,
    inputs: Callable[[Any], tuple] | None = None,
    n: tuple[int, int] = (1, 12),
    d: tuple[int, int] = (1, 4),
    name: str = "функция",
    examples: int = 80,
    rtol: float = 1e-6,
    atol: float = 1e-8,
) -> None:
    """Сравнивает функцию ученика с эталоном на случайных данных (Hypothesis) и сообщает минимальный контрпример.

    По умолчанию данные — задача регрессии: X размера n × d и y длины n (n, d — в заданных пределах).
    Свои данные — ``inputs(draw) -> tuple`` (``draw`` из ``hypothesis.strategies.composite``).
    Пары, на которых эталон сам падает (например, вырожденная XᵀX), пропускаются.
    """
    from hypothesis import HealthCheck, given, settings
    from hypothesis import strategies as st

    make = inputs or (lambda draw: regression_data(draw, n, d))
    problem: dict[str, str] = {}

    # report_multiple_bugs=False: одна ошибка — один (минимальный) контрпример, без группы исключений
    @settings(max_examples=examples, deadline=None, derandomize=True, database=None, report_multiple_bugs=False, suppress_health_check=list(HealthCheck))
    @given(st.data())
    def prop(data):
        args = data.draw(st.composite(lambda draw: make(draw))())
        try:
            with np.errstate(all="ignore"):
                expected = reference(*[np.copy(a) if isinstance(a, np.ndarray) else a for a in args])
        except Exception:  # noqa: BLE001 — эталон не определён на этих данных: пример не в счёт
            from hypothesis import assume

            assume(False)
        try:
            with np.errstate(all="ignore"):  # деление на ноль у ученика — не шум в выводе, а повод для сообщения ниже
                got = func(*[np.copy(a) if isinstance(a, np.ndarray) else a for a in args])
        except Exception as err:  # noqa: BLE001 — сообщаем ученику, а не падаем трассировкой
            problem["text"] = f"{name.capitalize()} падает при {_describe(args)}: {type(err).__name__}: {err}"
            raise AssertionError(problem["text"]) from None
        got_arr, exp_arr = np.asarray(got, dtype=float), np.asarray(expected, dtype=float)
        if got_arr.shape != exp_arr.shape:
            problem["text"] = f"{name.capitalize()} при {_describe(args)} возвращает форму {got_arr.shape}, а нужна {exp_arr.shape}."
            raise AssertionError(problem["text"])
        if not np.allclose(got_arr, exp_arr, rtol=rtol, atol=atol, equal_nan=True):
            problem["text"] = (
                f"{name.capitalize()} ошибается при {_describe(args)}: "
                f"ожидалось {np.array2string(exp_arr, precision=4)}, получено {np.array2string(got_arr, precision=4)}."
            )
            raise AssertionError(problem["text"])

    try:
        prop()
    except AssertionError:
        # Hypothesis уже уменьшил пример: последнее сообщение — про минимальный контрпример
        text = problem.get("text", f"{name.capitalize()} не совпадает с эталоном.")
        raise CheckFailed(f"{text}{'' if text.endswith('.') else '.'} Проверьте этот крайний случай.") from None

