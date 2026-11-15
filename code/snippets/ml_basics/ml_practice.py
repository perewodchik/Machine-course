"""Кривые обучения, ошибки по срезам, абляция и утечка на «Квартирах» (урок 2.5 «Основ ML»).

Регионы вставляются в урок при сборке: ``<PyCode src="ml_basics/ml_practice.py#data+tools+demo" run />``. Тест
``code/tests/test_ml_practice.py`` сверяет вывод и кривые обучения — с ``learning_curve`` на тех же разбиениях до 1e-10.
"""

import numpy as np


# region data
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
# endregion


# region tools
def fit(X, y):
    """МНК со свободным членом; возвращает функцию-прогноз."""
    A = np.column_stack([np.ones(len(y)), X])
    theta = np.linalg.lstsq(A, y, rcond=None)[0]
    return lambda Z: np.column_stack([np.ones(len(Z)), Z]) @ theta


def mse(f, X, y):
    return np.mean((f(X) - y) ** 2)


def folds(n, k=5):
    """Подряд идущие фолды, как KFold(k) без перемешивания."""
    return np.array_split(np.arange(n), k)


def learning_curve(X, y, sizes, k=5):
    """Средние MSE обучения и валидации по k фолдам: модель учится на первых m объектах обучающей части."""
    tr_err, va_err = [], []
    for m in sizes:
        a, b = [], []
        for f in folds(len(y), k):
            tr = np.setdiff1d(np.arange(len(y)), f)[:m]
            model = fit(X[tr], y[tr])
            a.append(mse(model, X[tr], y[tr]))
            b.append(mse(model, X[f], y[f]))
        tr_err.append(np.mean(a))
        va_err.append(np.mean(b))
    return np.array(tr_err), np.array(va_err)


def cv_mse(X, y, k=5):
    """MSE на каждом из k подряд идущих фолдов."""
    out = []
    for f in folds(len(y), k):
        tr = np.setdiff1d(np.arange(len(y)), f)
        out.append(mse(fit(X[tr], y[tr]), X[f], y[f]))
    return np.array(out)
# endregion


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока 2.5; тест сверяет её вывод с уроком."""
    # region demo
    X, y = apartments()
    X, y = X[:1000], y[:1000]
    sizes = [10, 20, 50, 100, 400, 800]
    for name, cols in [("только площадь", [0]), ("все признаки", [0, 1, 2, 3, 4])]:
        tr, va = learning_curve(X[:, cols], y, sizes)
        print(f"{name:15s} обучение:", " ".join(f"{v:.2f}" for v in tr), "| валидация:", " ".join(f"{v:.2f}" for v in va))

    # ошибки по срезам площади: какой срез даёт больше всего общей ошибки
    model = fit(X[:800], y[:800])
    r2 = (model(X[800:]) - y[800:]) ** 2
    g = np.digitize(X[800:, 0], [50, 80, 100])  # срезы: <50, 50–80, 80–100, ≥100 м²
    share = np.bincount(g) / len(g)
    err_g = np.bincount(g, r2) / np.bincount(g)
    print("срезы площади: доля", np.round(share, 2), "MSE", np.round(err_g, 2), "вклад", np.round(share * err_g, 3))

    # абляция: убираем признак на одних и тех же фолдах
    full = cv_mse(X, y)
    for name, cols in [("без этажа", [0, 1, 3, 4]), ("без метро", [0, 1, 2, 4])]:
        d = cv_mse(X[:, cols], y) - full
        print(f"{name}: ΔMSE = {d.mean():.3f} ± {d.std(ddof=1) / np.sqrt(5):.3f}")

    # утечка: «цена за м²» посчитана по самому ответу
    leak = np.column_stack([X, y / X[:, 0]])
    print(f"с «ценой за м²»: CV-MSE {cv_mse(leak, y).mean():.4f} против {full.mean():.3f} без неё")
    # endregion
