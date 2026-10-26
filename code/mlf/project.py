"""Автопроверка проектов курсов ML (S7.03): закрытая тестовая выборка, порог метрики, этапы.

Закрытая выборка (``Sealed``) открывается один раз — в финальной оценке ``Project.final``. Любое обращение к ней
раньше — при подборе модели, признаков или порога — это утечка: ``LeakError`` с объяснением для ученика.
Порог метрики проверяет ``Project.final``; сообщения пишутся для ученика, как в ``mlf.check``.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field

import numpy as np

from .check import CheckFailed


class LeakError(CheckFailed):
    """Тестовая выборка использована до финальной оценки."""


class Sealed:
    """Закрытая выборка: данные видны только функции финальной оценки. Попытка прочитать их раньше — утечка."""

    def __init__(self, X: np.ndarray, y: np.ndarray):
        self.__X, self.__y = X, y
        self.opened = False

    def _open(self) -> tuple[np.ndarray, np.ndarray]:
        self.opened = True
        return self.__X, self.__y

    def __len__(self) -> int:
        return len(self.__y)

    def __getattr__(self, name: str):
        raise LeakError(
            f"Тестовая выборка закрыта (обращение к «{name}»). Её открывает только project.final(...) — один раз, "
            "после того как модель выбрана по обучающей и валидационной частям."
        )

    def __array__(self, *args, **kwargs):
        raise LeakError("Тестовую выборку нельзя превратить в массив до финальной оценки: модель выбирают по валидации.")

    def __iter__(self):
        raise LeakError("Тестовую выборку нельзя перебирать до финальной оценки: модель выбирают по валидации.")


def split(X: np.ndarray, y: np.ndarray, *, val: float = 0.2, test: float = 0.2, seed: int = 0):
    """Перемешивает и делит на обучающую, валидационную и закрытую тестовую части."""
    n = len(y)
    idx = np.random.default_rng(seed).permutation(n)
    n_test, n_val = round(test * n), round(val * n)
    te, va, tr = idx[:n_test], idx[n_test : n_test + n_val], idx[n_test + n_val :]
    return (X[tr], y[tr]), (X[va], y[va]), Sealed(X[te], y[te])


def rmse(y: np.ndarray, pred: np.ndarray) -> float:
    return float(np.sqrt(np.mean((np.asarray(y, float) - np.asarray(pred, float)) ** 2)))


@dataclass
class Project:
    """Проект: этапы и порог метрики на закрытой выборке.

    ``metric(y, pred)`` и ``threshold``: при ``lower_is_better`` метрика должна быть не больше порога.
    """

    name: str
    test: Sealed
    metric: Callable[[np.ndarray, np.ndarray], float] = rmse
    threshold: float = float("inf")
    lower_is_better: bool = True
    stages: list[str] = field(default_factory=list)
    finals: int = 0

    def stage(self, title: str) -> None:
        """Отмечает пройденный этап (после его проверок) — в отчёте видно, до какого этапа дошёл ученик."""
        self.stages.append(title)
        print(f"Этап пройден: {title}")

    def final(self, predict: Callable[[np.ndarray], np.ndarray]) -> float:
        """Единственная оценка на закрытой выборке: метрика и порог. Второй вызов — подбор по тесту, это утечка."""
        if self.finals:
            raise LeakError(
                "Финальная оценка уже была. Повторная оценка на тесте — это выбор модели по тесту: "
                "вернитесь к валидации, а тест откройте заново только для новой, уже выбранной модели."
            )
        self.finals += 1
        X, y = self.test._open()
        score = self.metric(y, predict(X))
        ok = score <= self.threshold if self.lower_is_better else score >= self.threshold
        sign = "≤" if self.lower_is_better else "≥"
        if not ok:
            raise CheckFailed(f"Метрика на закрытой выборке {score:.4f}, а нужно {sign} {self.threshold:.4f}. Улучшите модель на валидации.")
        print(f"Метрика на закрытой выборке: {score:.4f} ({sign} {self.threshold:.4f}) — проект «{self.name}» зачтён.")
        return score
