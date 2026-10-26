// Softmax-регрессия и перцептрон для виджетов урока 1.5 «Основ ML». Θ — массив k векторов θ_j длины d (столбцы
// матрицы d × k из урока); X — строки-объекты с единицей в начале; y — номера классов 0…k−1.

export type Theta = number[][];

const dot = (a: readonly number[], b: readonly number[]) => a.reduce((s, v, i) => s + v * b[i]!, 0);

/** softmax с вычитанием максимума: e^t не переполняется, вероятности те же. */
export function softmax(t: readonly number[]): number[] {
  const m = Math.max(...t);
  const e = t.map((v) => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

export const probs = (theta: Theta, x: readonly number[]) => softmax(theta.map((th) => dot(th, x)));

export function crossEntropy(theta: Theta, X: readonly (readonly number[])[], y: readonly number[]): number {
  return -X.reduce((s, x, i) => s + Math.log(probs(theta, x)[y[i]!]!), 0) / X.length;
}

export function accuracy(theta: Theta, X: readonly (readonly number[])[], y: readonly number[]): number {
  return X.filter((x, i) => {
    const p = probs(theta, x);
    return p.indexOf(Math.max(...p)) === y[i];
  }).length / X.length;
}

/** Спуск по J: Θ := Θ − α Xᵀ(P − Y)/n, как в ячейке урока. */
export function fitSoftmax(X: readonly (readonly number[])[], y: readonly number[], k: number, alpha = 2, iters = 3000): Theta {
  const d = X[0]!.length;
  let theta: Theta = Array.from({ length: k }, () => new Array<number>(d).fill(0));
  for (let it = 0; it < iters; it++) {
    const g: Theta = Array.from({ length: k }, () => new Array<number>(d).fill(0));
    X.forEach((x, i) => {
      const p = probs(theta, x);
      for (let j = 0; j < k; j++) {
        const r = (p[j]! - (y[i] === j ? 1 : 0)) / X.length;
        for (let c = 0; c < d; c++) g[j]![c]! += r * x[c]!;
      }
    });
    theta = theta.map((th, j) => th.map((v, c) => v - alpha * g[j]![c]!));
  }
  return theta;
}

export interface PerceptronStep {
  /** Индекс объекта, на котором сделана поправка. */
  i: number;
  before: number[];
  after: number[];
}

/** Следующая ошибка перцептрона начиная с позиции from (по кругу) или null, если ошибок нет. */
export function nextMistake(theta: readonly number[], X: readonly (readonly number[])[], y: readonly number[], from: number): number | null {
  for (let s = 0; s < X.length; s++) {
    const i = (from + s) % X.length;
    if ((dot(theta, X[i]!) >= 0 ? 1 : 0) !== y[i]) return i;
  }
  return null;
}

/** Поправка перцептрона на объекте i: θ + α(y − h)x. */
export function perceptronUpdate(theta: readonly number[], x: readonly number[], y: number, alpha = 1): number[] {
  const h = dot(theta, x) >= 0 ? 1 : 0;
  return theta.map((v, c) => v + alpha * (y - h) * x[c]!);
}

/** Эпохи перцептрона, как в ячейке урока: число ошибок в каждой; останавливается на эпохе без ошибок. */
export function perceptronEpochs(X: readonly (readonly number[])[], y: readonly number[], epochs = 20, alpha = 1): { theta: number[]; mistakes: number[] } {
  let theta = new Array<number>(X[0]!.length).fill(0);
  const mistakes: number[] = [];
  for (let e = 0; e < epochs; e++) {
    let m = 0;
    X.forEach((x, i) => {
      if ((dot(theta, x) >= 0 ? 1 : 0) !== y[i]) {
        theta = perceptronUpdate(theta, x, y[i]!, alpha);
        m++;
      }
    });
    mistakes.push(m);
    if (m === 0) break;
  }
  return { theta, mistakes };
}
