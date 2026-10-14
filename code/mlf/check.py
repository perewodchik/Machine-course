"""Проверки для лабораторных. Сообщения пишутся для ученика: что не так и что проверить."""

from __future__ import annotations

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
