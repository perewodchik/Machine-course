"""Кросс-валидация с нуля: k фолдов, стратификация, выбор λ с полосой SE, утечка при отборе признаков (урок 2.4).

Регионы вставляются в урок при сборке: ``<PyCode src="ml_basics/cross_val.py#data+tools+demo" run />``. Тест
``code/tests/test_cross_val.py`` сверяет вывод, ошибки фолдов — с ``cross_val_score`` до 1e-10, доли классов — со
``StratifiedKFold``, формулу «без одного» — с n обучениями.
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
def ridge_fit(X, y, lam):
    """Гребневая из урока 2.3: центрирование, (XᵀX + λI)θ = Xᵀy; возвращает функцию-прогноз."""
    mx, my = X.mean(axis=0), y.mean()
    theta = np.linalg.solve((X - mx).T @ (X - mx) + lam * np.eye(X.shape[1]), (X - mx).T @ (y - my))
    return lambda Z: my + (Z - mx) @ theta


def kfold(n, k, seed=0):
    """k фолдов из перестановки индексов: каждый объект ровно в одном фолде."""
    return np.array_split(np.random.default_rng(seed).permutation(n), k)


def stratified(y, k, seed=0):
    """Стратифицированные фолды: каждый класс делится на k частей отдельно."""
    rng = np.random.default_rng(seed)
    parts = [np.array_split(rng.permutation(np.flatnonzero(y == c)), k) for c in np.unique(y)]
    return [np.concatenate([p[j] for p in parts]) for j in range(k)]


def cv_errors(X, y, folds, fit):
    """MSE на каждом фолде модели, обученной без него."""
    out = []
    for f in folds:
        mask = np.ones(len(y), bool)
        mask[f] = False
        out.append(np.mean((fit(X[mask], y[mask])(X[f]) - y[f]) ** 2))
    return np.array(out)
# endregion


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока 2.4; тест сверяет её вывод с уроком."""
    # region demo
    X, y = apartments()
    X, y = X[:100], y[:100]  # маленькая выборка: здесь кросс-валидация и нужна
    X = (X - X.mean(axis=0)) / X.std(axis=0)
    folds = kfold(len(y), 5)
    print("   λ     CV-MSE   ± SE")
    res = {}
    for lam in [0.1, 1, 3, 10, 30, 100]:
        e = cv_errors(X, y, folds, lambda A, b, lam=lam: ridge_fit(A, b, lam))
        res[lam] = (e.mean(), e.std(ddof=1) / np.sqrt(len(e)))
        print(f"{lam:5g}  {res[lam][0]:7.3f}  {res[lam][1]:5.3f}")
    best = min(res, key=lambda m: res[m][0])
    simple = max(m for m in res if res[m][0] <= res[best][0] + res[best][1])
    print(f"лучший λ = {best}, по правилу одной SE — λ = {simple}")

    # стратификация: доля откликов ~11 % в каждом из 5 фолдов
    yb = (np.random.default_rng(3).random(200) < 0.11).astype(int)
    plain = [int(yb[f].sum()) for f in kfold(200, 5, seed=1)]
    strat = [int(yb[f].sum()) for f in stratified(yb, 5, seed=1)]
    print(f"положительных по фолдам: просто {plain}, стратифицированно {strat}")

    # утечка: отбор 20 признаков по всей выборке до кросс-валидации на чистом шуме
    rng = np.random.default_rng(5)
    N, lab = rng.normal(size=(50, 5000)), rng.integers(0, 2, 50).astype(float)
    def acc(train_sel):
        hits = []
        for f in kfold(50, 5, seed=2):
            tr = np.setdiff1d(np.arange(50), f)
            sel_rows = tr if train_sel else np.arange(50)
            corr = np.abs((N[sel_rows] - N[sel_rows].mean(0)).T @ (lab[sel_rows] - lab[sel_rows].mean()))
            cols = np.argsort(-corr)[:20]
            pred = ridge_fit(N[tr][:, cols], lab[tr], 1.0)(N[f][:, cols]) > 0.5
            hits.append(np.mean(pred == (lab[f] == 1)))
        return np.mean(hits)
    print(f"чистый шум: отбор по всей выборке — {acc(False):.2f} верных, отбор внутри фолда — {acc(True):.2f}")
    # endregion
