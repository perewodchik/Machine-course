"""Цикл обучения на «Квартирах»: разбиение, бейзлайн, линейная модель, RMSE и MAE на тесте (урок 1.1 «Основ ML»).

Регионы вставляются в урок при сборке: ``<PyCode src="ml_basics/learning_problem.py#tools+demo" run />``. Тест
``code/tests/test_learning_problem.py`` сверяет вывод и сравнивает функции с ``sklearn``.
"""

import numpy as np


# region tools
def rmse(y, pred):
    return float(np.sqrt(np.mean((y - pred) ** 2)))


def mae(y, pred):
    return float(np.mean(np.abs(y - pred)))


def split(n, test=0.2, seed=0):
    """Индексы обучающей и тестовой частей: перемешать и отрезать долю test."""
    idx = np.random.default_rng(seed).permutation(n)
    k = round(test * n)
    return idx[k:], idx[:k]


def fit(X, y):
    """Веса МНК с признаком-единицей: θ = argmin ‖Xθ − y‖² (как в уроке V.1)."""
    X1 = np.column_stack([np.ones(len(X)), X])
    return np.linalg.lstsq(X1, y, rcond=None)[0]


def predict(theta, X):
    return np.column_stack([np.ones(len(X)), X]) @ theta
# endregion


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока 1.1; тест сверяет её вывод с уроком."""
    # region demo
    def apartments(n=2000, seed=2028):
        """«Квартиры»: площадь, комнат, этаж, до метро (мин), возраст дома; цена, млн ₽ (как mlf.datasets.apartments_full)."""
        rng = np.random.default_rng(seed)
        area = np.round(rng.uniform(25, 120, size=n))
        rooms = np.clip(np.round(area / 30 + rng.normal(0, 0.5, size=n)), 1, 5)
        floor = rng.integers(1, 26, size=n).astype(float)
        metro = np.round(rng.uniform(2, 40, size=n))
        age = np.round(rng.uniform(0, 70, size=n))
        X = np.column_stack([area, rooms, floor, metro, age])
        price = 1.5 + 0.11 * area + 0.4 * rooms + 0.03 * floor - 0.06 * metro - 0.02 * age + rng.normal(0, 0.8, size=n)
        return X, np.round(price, 2)

    X, y = apartments()  # 2000 квартир, 5 признаков, цена в млн ₽
    tr, te = split(len(y), test=0.2, seed=0)

    base = np.full(len(te), y[tr].mean())  # бейзлайн: средняя цена обучающей части
    print(f"бейзлайн:         RMSE {rmse(y[te], base):.3f}, MAE {mae(y[te], base):.3f}")

    theta = fit(X[tr][:, [0]], y[tr])  # только площадь
    pred = predict(theta, X[te][:, [0]])
    print(f"по площади:       RMSE {rmse(y[te], pred):.3f}, MAE {mae(y[te], pred):.3f}")

    theta = fit(X[tr], y[tr])  # все пять признаков
    pred, pred_tr = predict(theta, X[te]), predict(theta, X[tr])
    print(f"все признаки:     RMSE {rmse(y[te], pred):.3f}, MAE {mae(y[te], pred):.3f}")
    print(f"на обучении:      RMSE {rmse(y[tr], pred_tr):.3f}")
    # endregion
