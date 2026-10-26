"""Перцептрон и softmax-регрессия на сегментах «Квартир» (урок 1.5 «Основ ML»).

Регионы вставляются в урок при сборке: ``<PyCode src="ml_basics/softmax.py#data+tools+demo" run />``. Тест
``code/tests/test_softmax.py`` сверяет вывод, перцептрон — с ``Perceptron``, вероятности softmax — с
``LogisticRegression(C=np.inf)``.
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


def segments(n=300):
    """Первые n квартир: стандартизованные площадь и путь до метро с единицей; класс 0, 1, 2 — эконом, комфорт,
    бизнес по терцилям цены всех 2000."""
    X, price = apartments()
    y = np.digitize(price, np.quantile(price, [1 / 3, 2 / 3]))[:n]
    F = X[:n][:, [0, 3]]
    return np.column_stack([np.ones(n), (F - F.mean(axis=0)) / F.std(axis=0)]), y
# endregion


# region tools
def perceptron(X, y, epochs=20, alpha=1.0):
    """Перцептрон для меток 0 и 1: поправка θ += α (y − h) x только на ошибках; число ошибок в каждой эпохе."""
    theta, mistakes = np.zeros(X.shape[1]), []
    for _ in range(epochs):
        m = 0
        for x, t in zip(X, y):
            h = float(theta @ x >= 0)
            if h != t:
                theta += alpha * (t - h) * x
                m += 1
        mistakes.append(m)
        if m == 0:
            break
    return theta, mistakes


def softmax(T):
    E = np.exp(T - T.max(axis=1, keepdims=True))  # вычесть максимум: exp не переполнится, вероятности те же
    return E / E.sum(axis=1, keepdims=True)


def cross_entropy(Theta, X, y):
    P = softmax(X @ Theta)
    return -np.mean(np.log(P[np.arange(len(y)), y]))


def ce_grad(Theta, X, y):
    """∇_Θ J = Xᵀ(P − Y)/n — той же формы d × k, что Θ."""
    Y = np.eye(Theta.shape[1])[y]
    return X.T @ (softmax(X @ Theta) - Y) / len(y)
# endregion


def _lesson_cell() -> None:
    """Служебная обёртка: регион demo — ячейка урока 1.5; тест сверяет её вывод с уроком."""
    # region demo
    X, y = segments()
    eco_biz = y != 1  # эконом против бизнеса: классы разделимы прямой
    _, m = perceptron(X[eco_biz], (y[eco_biz] == 2).astype(float))
    print("эконом против бизнеса, ошибок по эпохам:", m)
    _, m = perceptron(X, (y == 2).astype(float))
    print("бизнес против остальных, последние эпохи:", m[-5:])

    Theta = np.zeros((3, 3))  # d × k: столбец j — веса класса j
    G = np.random.default_rng(1).normal(size=(3, 3))
    h, E = 1e-6, np.eye(9).reshape(9, 3, 3)
    numeric = np.array([(cross_entropy(G + h * e, X, y) - cross_entropy(G - h * e, X, y)) / (2 * h) for e in E]).reshape(3, 3)
    print("градиент совпал с конечными разностями:", np.abs(ce_grad(G, X, y) - numeric).max() < 1e-6)
    for _ in range(3000):
        Theta -= 2.0 * ce_grad(Theta, X, y)
    P = softmax(X @ Theta)
    print(f"J = {cross_entropy(Theta, X, y):.4f}, доля верных: {np.mean(P.argmax(axis=1) == y):.3f}")
    print("вероятности первой квартиры:", np.round(P[0], 3), " после сдвига всех θ_j:", np.round(softmax(X @ (Theta + 5.0))[0], 3))
    # endregion
