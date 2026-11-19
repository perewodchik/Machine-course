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


def split(
    X: np.ndarray,
    y: np.ndarray,
    *,
    val: float = 0.2,
    test: float = 0.2,
    seed: int = 0,
    groups: np.ndarray | None = None,
    stratify: bool = False,
):
    """Перемешивает и делит на обучающую, валидационную и закрытую тестовую части.

    ``stratify=True`` — доли делятся внутри каждого класса ``y``: при редком классе (11 % откликов) все три части
    получают одну и ту же долю положительных, и оценки на валидации и тесте не скачут от разбиения.

    ``groups`` — метка группы у каждого объекта (например, номер дома, проданного дважды): все объекты группы
    попадают в одну часть, иначе модель видит в обучении «ответ» для теста. Доли тогда считаются по группам.
    """
    if stratify:
        rng = np.random.default_rng(seed)
        parts: list[list[np.ndarray]] = [[], [], []]
        for cls in np.unique(y):
            idx = rng.permutation(np.flatnonzero(y == cls))
            n_test, n_val = round(test * len(idx)), round(val * len(idx))
            for k, chunk in enumerate((idx[n_test + n_val :], idx[n_test : n_test + n_val], idx[:n_test])):
                parts[k].append(chunk)
        tr, va, te = (np.sort(np.concatenate(p)) for p in parts)
        return (X[tr], y[tr]), (X[va], y[va]), Sealed(X[te], y[te])
    if groups is None:
        groups = np.arange(len(y))
    uniq, inverse = np.unique(groups, return_inverse=True)
    order = np.random.default_rng(seed).permutation(len(uniq))
    n_test, n_val = round(test * len(uniq)), round(val * len(uniq))
    part = np.empty(len(uniq), dtype=int)
    part[order[:n_test]], part[order[n_test : n_test + n_val]], part[order[n_test + n_val :]] = 2, 1, 0
    if len(uniq) == len(y) and np.array_equal(uniq[inverse], np.arange(len(y))):
        # без групп — прежний порядок объектов внутри частей (перестановка), как в демонстрационном проекте
        idx = order
        te, va, tr = idx[:n_test], idx[n_test : n_test + n_val], idx[n_test + n_val :]
    else:
        obj = part[inverse]
        tr, va, te = (np.flatnonzero(obj == k) for k in (0, 1, 2))
    return (X[tr], y[tr]), (X[va], y[va]), Sealed(X[te], y[te])


def rmse(y: np.ndarray, pred: np.ndarray) -> float:
    return float(np.sqrt(np.mean((np.asarray(y, float) - np.asarray(pred, float)) ** 2)))


def average_precision(y: np.ndarray, score: np.ndarray) -> float:
    """PR-AUC как средняя точность: среднее точности по порогам, на которых находится очередной положительный объект.

    Совпадает с ``sklearn.metrics.average_precision_score`` (одинаковые оценки — одна ступень).
    """
    y, score = np.asarray(y, float), np.asarray(score, float)
    order = np.argsort(-score, kind="mergesort")
    y, score = y[order], score[order]
    last = np.r_[np.flatnonzero(np.diff(score)), len(y) - 1]  # последний объект каждой группы одинаковых оценок
    tp = np.cumsum(y)[last]
    precision, recall = tp / (last + 1), tp / tp[-1]
    return float(np.sum(np.diff(np.r_[0.0, recall]) * precision))


def brier(y: np.ndarray, p: np.ndarray) -> float:
    """Оценка Брайера: средний квадрат разности вероятности и исхода (меньше — лучше)."""
    return float(np.mean((np.asarray(p, float) - np.asarray(y, float)) ** 2))


def check_features(names, leaks: dict[str, str]) -> None:
    """Проверяет, что среди признаков модели нет известных утечек: ``leaks`` — «столбец → почему он утечка»."""
    found = [n for n in names if n in leaks]
    if found:
        why = "; ".join(f"«{n}» — {leaks[n]}" for n in found)
        raise LeakError(f"В признаках есть утечка: {why}. Уберите столбец: в момент решения его ещё нет.")


def check_scaling(standardize: Callable[[np.ndarray, np.ndarray], np.ndarray]) -> None:
    """Проверяет ``standardize(X_fit, X)``: среднее и разброс считаются только по ``X_fit`` (обучающей части).

    Если статистики взяты по ``X`` или по объединению частей — это утечка масштабирования: ``LeakError``.
    """
    rng = np.random.default_rng(7)
    X_fit = rng.normal(0, 1, size=(40, 3)) * [1, 5, 20] + [0, 3, -50]
    X = rng.normal(0, 1, size=(15, 3)) * [2, 1, 4] + [10, -2, 100]  # другое распределение: статистики заметно другие
    mu, sd = X_fit.mean(0), X_fit.std(0)
    got = np.asarray(standardize(X_fit.copy(), X.copy()), dtype=float)
    if got.shape != X.shape:
        raise CheckFailed(f"standardize(X_fit, X) возвращает форму {got.shape}, а нужна форма X {X.shape}.")
    if np.allclose(got, (X - mu) / sd):
        return
    both = np.vstack([X_fit, X])
    leaks = {"по X": (X - X.mean(0)) / X.std(0), "по объединению частей": (X - both.mean(0)) / both.std(0)}
    for where, value in leaks.items():
        if np.allclose(got, value):
            raise LeakError(
                f"Среднее и разброс посчитаны {where}, а нужно — только по обучающей части X_fit. Иначе в признаки "
                "просачивается информация из валидации и теста: это утечка масштабирования."
            )
    if np.allclose(got, (X - mu) / X_fit.std(0, ddof=1)):
        return  # std с ddof=1 — тоже честное масштабирование по обучающей части
    raise CheckFailed("standardize(X_fit, X) должна вернуть (X − среднее X_fit) / стандартное отклонение X_fit по столбцам.")


def check_units(pred: np.ndarray, y: np.ndarray, unit: str = "$") -> None:
    """Прогнозы в тех же единицах, что и ответ: ловит RMSE по логарифму цены без обратного преобразования."""
    ratio = float(np.median(np.asarray(pred, float)) / np.median(np.asarray(y, float)))
    if not 0.5 < ratio < 2:
        raise CheckFailed(
            f"Медиана прогнозов отличается от медианы ответа в {ratio:.3g} раза. Если модель учили на log(цены), "
            f"верните прогноз в {unit}: np.exp(...) — метрику считают в исходных единицах."
        )


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
    extra: dict[str, float] = field(default_factory=dict)

    def stage(self, title: str) -> None:
        """Отмечает пройденный этап (после его проверок) — в отчёте видно, до какого этапа дошёл ученик."""
        self.stages.append(title)
        print(f"Этап пройден: {title}")

    def final(
        self,
        predict: Callable[[np.ndarray], np.ndarray],
        extra: dict[str, Callable[[np.ndarray, np.ndarray], float]] | None = None,
    ) -> float:
        """Единственная оценка на закрытой выборке: метрика и порог. Второй вызов — подбор по тесту, это утечка.

        ``extra`` — «название → функция (y, прогноз)»: дополнительные метрики на том же тесте, только для отчёта
        (например, прибыль кампании). Их значения — в ``self.extra``.
        """
        if self.finals:
            raise LeakError(
                "Финальная оценка уже была. Повторная оценка на тесте — это выбор модели по тесту: "
                "вернитесь к валидации, а тест откройте заново только для новой, уже выбранной модели."
            )
        self.finals += 1
        X, y = self.test._open()
        pred = predict(X)
        score = self.metric(y, pred)
        self.extra = {name: float(fn(y, pred)) for name, fn in (extra or {}).items()}
        for name, value in self.extra.items():
            shown = f"{value:,.0f}".replace(",", "\u202f") if abs(value) >= 100 else f"{value:.4f}"
            print(f"На закрытой выборке: {name} — {shown}")
        ok = score <= self.threshold if self.lower_is_better else score >= self.threshold
        sign = "≤" if self.lower_is_better else "≥"
        if not ok:
            raise CheckFailed(f"Метрика на закрытой выборке {score:.4f}, а нужно {sign} {self.threshold:.4f}. Улучшите модель на валидации.")
        print(f"Метрика на закрытой выборке: {score:.4f} ({sign} {self.threshold:.4f}) — проект «{self.name}» зачтён.")
        return score
