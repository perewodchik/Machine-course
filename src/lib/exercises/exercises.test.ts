// Движок упражнений: разбор чисел (точка и запятая), проверки всех типов, генераторы с seed, ГПСЧ.
import { describe, expect, it } from "vitest";
import { gauss as gaussian } from "../math/correlation";
import { rng } from "../math/rng";
import { checkMatrix, checkNumeric, checkOrder, closeEnough, scrambled } from "./check";
import { cdf as contCdf, contMoments } from "../math/continuous";
import { moments, pmf } from "../math/distributions";
import { generator, generators } from "./generators";
import { formatNumber, parseNumber } from "./parse";
import { renderInline } from "../../markdown/core/inline";
import type { ExerciseSpec } from "./types";

describe("разбор ответа", () => {
  it.each([
    ["0.5", 0.5],
    ["0,5", 0.5],
    [" −0,25 ", -0.25],
    ["-3", -3],
    ["1/2", 0.5],
    ["−3/4", -0.75],
    [".5", 0.5],
    ["1e-3", 0.001],
    ["12 345", 12345],
  ])("«%s» → %s", (raw, v) => {
    expect(parseNumber(raw)).toBeCloseTo(v, 12);
  });

  it.each(["", "abc", "1/0", "0.5.5", "--1", "1,2,3"])("«%s» — не число", (raw) => {
    expect(parseNumber(raw)).toBeNull();
  });

  it("вывод — с точкой и настоящим минусом", () => {
    expect(formatNumber(0.5)).toBe("0.5");
    expect(formatNumber(-0.25)).toBe("−0.25");
    expect(formatNumber(-0.00001)).toBe("0");
    expect(formatNumber(1 / 3)).toBe("0.3333");
  });
});

describe("проверки", () => {
  it("число с допуском, ввод с запятой засчитывается", () => {
    expect(checkNumeric("0,5", 0.5)).toEqual({ value: 0.5, correct: true });
    expect(checkNumeric("0.504", 0.5).correct).toBe(true);
    expect(checkNumeric("0.51", 0.5).correct).toBe(false);
    expect(checkNumeric("полтора", 1.5)).toEqual({ value: null, correct: false });
    expect(closeEnough(101, 100, 0, 0.02)).toBe(true);
  });

  it("матрица: клетки по отдельности, пустая клетка — null", () => {
    const r = checkMatrix([["1", "2,0"], ["", "5"]], [[1, 2], [3, 4]], 0);
    expect(r.cells).toEqual([[true, true], [null, false]]);
    expect(r.correct).toBe(false);
    expect(r.complete).toBe(false);
    expect(checkMatrix([["1", "2"], ["3", "4"]], [[1, 2], [3, 4]]).correct).toBe(true);
  });

  it("порядок шагов: позиции на своих местах", () => {
    expect(checkOrder([0, 2, 1, 3])).toEqual({ positions: [true, false, false, true], correct: false });
    expect(checkOrder([0, 1, 2]).correct).toBe(true);
  });

  it("перемешанный порядок не совпадает с верным", () => {
    const r = rng(1);
    for (let n = 2; n < 7; n++) {
      const s = scrambled(n, (xs) => r.shuffle(xs));
      expect([...s].sort()).toEqual(Array.from({ length: n }, (_, i) => i));
      expect(s.some((v, i) => v !== i)).toBe(true);
    }
    // даже если перемешивание каждый раз возвращает исходный порядок
    expect(scrambled(3, (xs) => xs)).toEqual([1, 2, 0]);
  });
});

describe("генераторы", () => {
  it("детерминированы: один seed — одна задача", () => {
    for (const g of generators.values()) expect(g.make(42)).toEqual(g.make(42));
  });

  it("разные seed дают разные задачи", () => {
    for (const g of generators.values()) {
      const prompts = new Set(Array.from({ length: 8 }, (_, s) => g.make(s + 1).prompt));
      expect(prompts.size, g.id).toBeGreaterThan(3);
    }
  });

  it("ответы сходятся с условием", () => {
    for (let s = 1; s <= 30; s++) {
      const det = generator("la.det2").make(s);
      if (det.kind !== "numeric") throw new Error("ожидалась числовая задача");
      const m = /pmatrix\}(-?\d+) & (-?\d+) \\\\ (-?\d+) & (-?\d+)\\end/.exec(det.prompt)!;
      const [a, b, c, d] = m.slice(1).map(Number) as [number, number, number, number];
      expect(det.answer).toBe(a * d - b * c);
      const shapes = generator("la.shapes").make(s);
      if (shapes.kind !== "choice") throw new Error("ожидался выбор");
      expect(shapes.options.filter((o) => o.correct)).toHaveLength(1);
    }
  });

  // задачи диагностики (content/diagnostic.yaml): ответ пересчитывается по числам из условия
  const num = (spec: ReturnType<typeof make>) => {
    if (spec.kind !== "numeric") throw new Error(`ожидалась числовая задача: ${spec.prompt}`);
    return spec;
  };
  const make = (id: string, s: number) => generator(id).make(s);
  const coefOf = (c: string) => (c === "" ? 1 : c === "-" ? -1 : Number(c));
  const signed = (sign: string | undefined, v: string | undefined) => (v === undefined ? 0 : sign === "-" ? -Number(v) : Number(v));

  it("задачи модуля 0: ответы сходятся с условием", () => {
    for (let s = 1; s <= 40; s++) {
      const ss = num(make("basics.sse", s));
      const pts = [...ss.prompt.matchAll(/\$\((\d+), (-?\d+)\)\$/g)].map((m) => [Number(m[1]), Number(m[2])]);
      const [, b0, b1] = /\\hat y = (\d+) \+ (\d*)x/.exec(ss.prompt)!;
      const [t0, t1] = [Number(b0), b1 === "" ? 1 : Number(b1)];
      expect(pts).toHaveLength(3);
      expect(ss.answer).toBe(pts.reduce((acc, [x, y]) => acc + (y! - t0 - t1 * x!) ** 2, 0) / 2);
      expect(ss.answer).toBeGreaterThan(0);

      const am = num(make("basics.argmin", s));
      const [, sign, shift, b] = /f\(x\) = \(x(?: ([-+]) (\d+))?\)\^2 \+ (\d+)/.exec(am.prompt)!;
      const a = sign === "-" ? Number(shift) : sign === "+" ? -Number(shift) : 0;
      expect(am.answer).toBe(a);
      expect(Number(b)).not.toBe(a);

      const ind = num(make("basics.indicator-sum", s));
      const xs = /x = \(([^)]*)\)/.exec(ind.prompt)![1]!.split(", ").map(Number);
      const t = Number(/x_i > (-?\d+)/.exec(ind.prompt)![1]);
      expect(xs).toContain(t);
      expect(ind.answer).toBe(xs.filter((x) => x > t).reduce((acc, x) => acc + x, 0));

      const sg = num(make("basics.sigmoid", s));
      const p = Number(/\\sigma\(z\) = (0\.\d+)/.exec(sg.prompt)![1]);
      expect(sg.answer).toBeCloseTo(1 - p, 10);

      const ch = num(make("basics.chain-rule", s));
      const [, ca, bs, bv, k] = /\((-?\d*)x(?: ([-+]) (\d+))?\)\^(\d)/.exec(ch.prompt)!;
      const x0 = Number(/f'\((-?\d+)\)/.exec(ch.prompt)![1]);
      const [aa, bb, kk] = [coefOf(ca!), signed(bs, bv), Number(k)];
      expect(ch.answer).toBe(kk * aa * (aa * x0 + bb) ** (kk - 1));

      const ig = num(make("basics.integral", s));
      const [, c, m, qs, qv] = /\\int_0\^\{(\d+)\} \((\d*)x(?: ([-+]) (\d+))?\)/.exec(ig.prompt)!;
      const [cc, mm, qq] = [Number(c), coefOf(m!), signed(qs, qv)];
      expect(ig.answer).toBeCloseTo((mm * cc * cc) / 2 + qq * cc, 10);

      const np = make("basics.numpy-shapes", s);
      if (np.kind !== "choice") throw new Error("ожидался выбор");
      const [, n, d] = /np\.ones\(\((\d+), (\d+)\)\)/.exec(np.prompt)!.map(Number);
      const code = /форма у \$\\texttt\{([^}]*)\}/.exec(np.prompt)![1];
      const expected = { "X @ theta": `(${n},)`, "X.mean(axis=0)": `(${d},)`, "X.T @ X": `(${d}, ${d})` }[code!];
      const right = np.options.filter((o) => o.correct);
      expect(right).toHaveLength(1);
      expect(right[0]!.text).toContain(expected!);

      const nt = make("basics.notation", s);
      if (nt.kind !== "choice") throw new Error("ожидался выбор");
      const [, i, j] = /x\^\{\((\d+)\)\}_(\d+)/.exec(nt.prompt)!;
      expect(nt.options.filter((o) => o.correct).map((o) => o.text)).toEqual([`${j}-й признак ${i}-го объекта`]);
    }
  });

  it("задачи модулей I и III для диагностики: ответы сходятся с условием", () => {
    for (let s = 1; s <= 40; s++) {
      const lc = make("la.lincomb", s);
      if (lc.kind !== "matrix") throw new Error("ожидалась матрица");
      const vecs = [...lc.prompt.matchAll(/pmatrix\}(-?\d+) \\\\ (-?\d+)\\end/g)].map((mm) => [Number(mm[1]), Number(mm[2])]);
      const [, ac, bsign, bc] = /Вычислите \$(-?\d*)u ([-+]) (\d*)v\$/.exec(lc.prompt)!;
      const [a, b] = [coefOf(ac!), (bsign === "-" ? -1 : 1) * (bc === "" ? 1 : Number(bc))];
      const [u, v] = vecs as [number[], number[]];
      expect(lc.answer).toEqual([[a * u[0]! + b * v[0]!], [a * u[1]! + b * v[1]!]]);

      const dt = num(make("la.dot", s));
      const [uu, vv] = [...dt.prompt.matchAll(/= \(([^)]*)\)/g)].map((mm) => mm[1]!.split(", ").map(Number)) as [number[], number[]];
      expect(dt.answer).toBe(uu.reduce((acc, x, k) => acc + x * vv[k]!, 0));

      const un = num(make("prob.union", s));
      const [pa, pb, pab] = [...un.prompt.matchAll(/= (0\.\d+)/g)].map((mm) => Number(mm[1]));
      expect(un.answer).toBeCloseTo(pa! + pb! - pab!, 10);
      expect(pab!).toBeLessThan(Math.min(pa!, pb!));

      const ct = num(make("prob.conditional-table", s));
      const [, n11, n12] = /\\text\{ходил\} & (\d+) & (\d+)/.exec(ct.prompt)!.map(Number);
      expect(ct.answer).toBeCloseTo(n11! / (n11! + n12!), 3);
    }
  });

  it("задачи урока I.2: нормы, проекция и угол сходятся с условием", () => {
    for (let s = 1; s <= 40; s++) {
      const nm = num(make("la.norms", s));
      const xs = /x = \(([^)]*)\)/.exec(nm.prompt)?.[1]?.split(", ").map(Number);
      const mx = [...nm.prompt.matchAll(/(-?\d+)(?= &| \\|\\end)/g)].map((mm) => Number(mm[1]));
      const vals = xs ?? mx;
      const which = /rVert_\{(1|2|\\infty)\}/.exec(nm.prompt)?.[1];
      const expected = which === "1" ? vals.reduce((a, v) => a + Math.abs(v), 0) : which === "\\infty" ? Math.max(...vals.map(Math.abs)) : Math.hypot(...vals);
      expect(nm.answer, nm.prompt).toBeCloseTo(expected, 9);
      expect(Number.isInteger(nm.answer)).toBe(true);
      if (which === "\\infty") expect(vals.find((v) => Math.abs(v) === nm.answer)).toBeLessThan(0);

      const pr = make("la.projection", s);
      if (pr.kind !== "matrix") throw new Error("ожидалась матрица");
      const [a, b] = [...pr.prompt.matchAll(/smallmatrix\}(-?\d+) \\\\ (-?\d+)\\end/g)].map((mm) => [Number(mm[1]), Number(mm[2])]) as [number[], number[]];
      const p = pr.answer.map((row) => row[0]!);
      // остаток b − p перпендикулярен a, а p параллелен a
      expect(a[0]! * (b[0]! - p[0]!) + a[1]! * (b[1]! - p[1]!)).toBe(0);
      expect(a[0]! * p[1]! - a[1]! * p[0]!).toBe(0);

      const an = make("la.angle", s);
      if (an.kind !== "choice") throw new Error("ожидался выбор");
      const [u, v] = [...an.prompt.matchAll(/= \(([^)]*)\)/g)].map((mm) => mm[1]!.split(", ").map(Number)) as [number[], number[]];
      const d = u.reduce((acc, x, k) => acc + x * v[k]!, 0);
      expect(an.options.find((o) => o.correct)!.text).toBe(d > 0 ? "Острый" : d === 0 ? "Прямой" : "Тупой");
    }
  });

  it("задачи урока I.3: столбец или строка произведения и внешнее произведение сходятся с условием", () => {
    for (let s = 1; s <= 40; s++) {
      const mc = make("la.matmul-column", s);
      if (mc.kind !== "matrix") throw new Error("ожидалась матрица");
      const [A, B] = [...mc.prompt.matchAll(/\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}/g)].map((mm) => mm[1]!.split(" \\\\ ").map((row) => row.split(" & ").map(Number))) as [number[][], number[][]];
      const AB = A.map((row) => [0, 1].map((c) => row.reduce((acc, a, k) => acc + a * B[k]![c]!, 0)));
      const [, j, what] = /Найдите (\d)-(й|ю) (столбец|строку)/.exec(mc.prompt)!.map((x, i) => (i === 1 ? Number(x) - 1 : x)) as [string, number, string];
      expect(mc.answer).toEqual(what === "й" ? AB.map((row) => [row[j]!]) : [AB[j]!]);
      expect(what).toBe(s % 2 === 0 ? "ю" : "й");

      const ou = make("la.outer", s);
      if (ou.kind !== "matrix") throw new Error("ожидалась матрица");
      const [u, v] = [...ou.prompt.matchAll(/begin\{smallmatrix\}(.*?)\\end/g)].map((mm) => mm[1]!.split(" \\\\ ").map(Number)) as [number[], number[]];
      expect(ou.answer).toEqual(u.map((a) => v.map((b) => a * b + 0)));

      const sp = make("la.shape-product", s);
      if (sp.kind !== "choice") throw new Error("ожидался выбор");
      expect(sp.options.filter((o) => o.correct)).toHaveLength(1);
      expect(new Set(sp.options.map((o) => o.text)).size).toBe(4);
    }
  });

  it("задачи урока I.5: симметричная часть и след сходятся с условием", () => {
    const mats = (prompt: string) => [...prompt.matchAll(/\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}/g)].map((mm) => mm[1]!.split(" \\\\ ").map((row) => row.split(" & ").map(Number)));
    for (let s = 1; s <= 40; s++) {
      const sp = make("la.sym-part", s);
      if (sp.kind !== "matrix") throw new Error("ожидалась матрица");
      const [A] = mats(sp.prompt) as [number[][]];
      expect(sp.answer).toEqual(A.map((row, i) => row.map((v, j) => (v + A[j]![i]!) / 2)));
      expect(A[0]![1]).not.toBe(A[1]![0]);

      const tr = num(make("la.trace-swap", s));
      const [X, Y] = mats(tr.prompt) as [number[][], number[][]];
      // tr(BA) напрямую, через матрицу 3 × 3
      const BA = Y.map((row) => [0, 1, 2].map((j) => row.reduce((acc, b, k) => acc + b * X[k]![j]!, 0)));
      expect(tr.answer).toBe(BA[0]![0]! + BA[1]![1]! + BA[2]![2]!);

      const tc = make("la.transpose-chain", s);
      if (tc.kind !== "choice") throw new Error("ожидался выбор");
      expect(tc.options.filter((o) => o.correct)).toHaveLength(1);
    }
  });

  it("задачи урока I.6: число решений, вектор ядра и размерность ядра сходятся с условием", () => {
    const mats = (prompt: string) => [...prompt.matchAll(/\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}/g)].map((mm) => mm[1]!.split(" \\\\ ").map((row) => row.split(" & ").map(Number)));
    // ранг методом Гаусса — независимая от генератора проверка
    const rankOf = (M: number[][]) => {
      const A = M.map((row) => row.slice());
      let rk = 0;
      for (let c = 0; c < A[0]!.length && rk < A.length; c++) {
        const p = A.findIndex((row, i) => i >= rk && Math.abs(row[c]!) > 1e-9);
        if (p < 0) continue;
        [A[rk], A[p]] = [A[p]!, A[rk]!];
        for (let i = 0; i < A.length; i++) if (i !== rk) { const f = A[i]![c]! / A[rk]![c]!; A[i] = A[i]!.map((v, j) => v - f * A[rk]![j]!); }
        rk++;
      }
      return rk;
    };
    for (let s = 1; s <= 40; s++) {
      const sc = make("la.solutions-count", s);
      if (sc.kind !== "choice") throw new Error("ожидался выбор");
      const rows = [...sc.prompt.matchAll(/(-?\d*)x_1(?: ([+-]) (\d*)x_2)? = (-?\d+)|(-?\d*)x_2 = (-?\d+)/g)].map((m) => {
        const k = (t: string | undefined) => (t === "" || t === undefined ? 1 : t === "-" ? -1 : Number(t));
        return m[6] !== undefined ? [0, k(m[5]), Number(m[6])] : [k(m[1]), m[2] ? (m[2] === "-" ? -1 : 1) * k(m[3]) : 0, Number(m[4])];
      });
      const rA = rankOf(rows.map((r) => r.slice(0, 2)));
      const rAb = rankOf(rows);
      const expected = rA !== rAb ? "Нет решений" : rA === 2 ? "Одно решение" : "Бесконечно много решений";
      expect(sc.options.find((o) => o.correct)!.text, sc.prompt).toBe(expected);

      const kv = make("la.kernel-vector", s);
      if (kv.kind !== "choice") throw new Error("ожидался выбор");
      const [A] = mats(kv.prompt) as [number[][]];
      expect(kv.options.length).toBeGreaterThanOrEqual(3);
      for (const o of kv.options) {
        const v = /\(([^)]*)\)/.exec(o.text)![1]!.split(", ").map(Number);
        const inKer = A.every((row) => row.reduce((acc, a, i) => acc + a * v[i]!, 0) === 0);
        expect(inKer).toBe(Boolean(o.correct));
      }

      const rn = num(make("la.rank-nullity", s));
      const [M] = mats(rn.prompt) as [number[][]];
      expect(rn.answer).toBe(4 - rankOf(M));
    }
  });

  it("задачи урока I.7: обратная, площадь образа и свойства определителя сходятся с условием", () => {
    for (let s = 1; s <= 40; s++) {
      const iv = make("la.inverse2", s);
      if (iv.kind !== "matrix") throw new Error("ожидалась матрица");
      const A = /\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}/.exec(iv.prompt)![1]!.split(" \\\\ ").map((row) => row.split(" & ").map(Number));
      const prod = A.map((row) => [0, 1].map((j) => row.reduce((acc, a, k) => acc + a * iv.answer[k]![j]!, 0)));
      expect(prod).toEqual([[1, 0], [0, 1]]);
      expect(iv.answer.flat().every(Number.isInteger)).toBe(true);

      const da = num(make("la.det-area", s));
      const M = /smallmatrix\}(.*?)\\end/.exec(da.prompt)![1]!.split(" \\\\ ").map((row) => row.split(" & ").map(Number));
      const area = Number(/площади (\d)|стороной (\d)|1 × (\d)/.exec(da.prompt)!.slice(1).find(Boolean));
      const base = da.prompt.includes("стороной") ? area * area : area;
      expect(da.answer).toBe(base * Math.abs(M[0]![0]! * M[1]![1]! - M[0]![1]! * M[1]![0]!));
      expect(da.answer).toBeGreaterThan(0);

      const dr = num(make("la.det-rules", s));
      expect(Number.isFinite(dr.answer)).toBe(true);
    }
  });

  it("задачи урока I.8: проекция на плоскость и расстояние до гиперплоскости сходятся с условием", () => {
    const tuple = (s: string) => s.split(", ").map(Number);
    for (let s = 1; s <= 40; s++) {
      const po = make("la.project-orthogonal", s);
      if (po.kind !== "matrix") throw new Error("ожидалась матрица");
      const [u, v, y] = [...po.prompt.matchAll(/= \(([^)]*)\)/g)].map((m) => tuple(m[1]!)) as [number[], number[], number[]];
      const res = y.map((yi, i) => yi - po.answer[i]![0]!);
      const d = (a: number[], b: number[]) => a.reduce((acc, ai, i) => acc + ai * b[i]!, 0);
      expect([d(u, v), d(res, u), d(res, v)]).toEqual([0, 0, 0]);

      const hd = num(make("la.hyperplane-distance", s));
      const x = tuple(/x = \(([^)]*)\)/.exec(hd.prompt)![1]!);
      const w = tuple(/w = \(([^)]*)\)/.exec(hd.hints![1]!)![1]!);
      const b = Number(/w\^\\top x \+ b = (-?\d+)/.exec(hd.hints![1]!)![1]) - d(w, x);
      expect(hd.answer).toBeCloseTo(Math.abs(d(w, x) + b) / Math.hypot(...w), 12);
      expect(Number((hd.answer * 10).toFixed(6)) % 1).toBe(0);

      const om = make("la.orthogonal-matrix", s);
      if (om.kind !== "choice") throw new Error("ожидался выбор");
      expect(om.options.filter((o) => o.correct)).toHaveLength(1);
    }
  });

  it("задачи урока I.9: собственные значения и векторы сходятся с условием", () => {
    for (let s = 1; s <= 40; s++) {
      const ev = num(make("la.eigvals2", s));
      const A = /\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}/.exec(ev.prompt)![1]!.split(" \\\\ ").map((row) => row.split(" & ").map(Number)) as [number[], number[]];
      const [tr, det] = [A[0]![0]! + A[1]![1]!, A[0]![0]! * A[1]![1]! - A[0]![1]! * A[1]![0]!];
      expect(ev.answer, ev.prompt).toBe((tr + Math.sqrt(tr * tr - 4 * det)) / 2);

      const vc = make("la.eigvec-check", s);
      if (vc.kind !== "choice") throw new Error("ожидался выбор");
      const M = /\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}/.exec(vc.prompt)![1]!.split(" \\\\ ").map((row) => row.split(" & ").map(Number));
      expect(vc.options.length).toBe(3);
      for (const o of vc.options) {
        const w = /\(([^)]*)\)/.exec(o.text)![1]!.split(", ").map(Number);
        const Aw = M.map((row) => row[0]! * w[0]! + row[1]! * w[1]!);
        expect(w[0]! * Aw[1]! - w[1]! * Aw[0]! === 0).toBe(Boolean(o.correct));
      }
    }
  });

  it("задачи урока I.10: знакоопределённость и отношение Рэлея сходятся с собственными значениями", () => {
    const parse = (tex: string) => /\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}/.exec(tex)![1]!.split(" \\\\ ").map((row) => row.split(" & ").map(Number));
    const eig = (A: number[][]) => {
      const [tr, det] = [A[0]![0]! + A[1]![1]!, A[0]![0]! * A[1]![1]! - A[0]![1]! * A[1]![0]!];
      const s = Math.sqrt(tr * tr - 4 * det);
      return [(tr + s) / 2, (tr - s) / 2] as const;
    };
    const kinds = new Set<string>();
    let trap = 0;
    for (let s = 1; s <= 40; s++) {
      const pc = make("la.psd-check", s);
      if (pc.kind !== "choice") throw new Error("ожидался выбор");
      const A = parse(pc.prompt);
      expect(A[0]![1]).toBe(A[1]![0]);
      const [l1, l2] = eig(A);
      const kind = l2 > 0 ? "Положительно опр" : l2 === 0 && l1 > 0 ? "Положительно полу" : l1 < 0 ? "Отрицательно" : "Не знако";
      const right = pc.options.filter((o) => o.correct);
      expect(right).toHaveLength(1);
      expect(right[0]!.text.startsWith(kind), pc.prompt).toBe(true);
      kinds.add(kind);
      if (kind === "Не знако" && A.flat().every((x) => x > 0)) trap++;

      const ry = num(make("la.rayleigh", s));
      const B = parse(ry.prompt);
      expect(ry.answer).toBe(s % 2 === 1 ? eig(B)[0] : eig(B)[1]);
      expect(Number.isInteger(ry.answer)).toBe(true);
      expect(ry.answer).not.toBe(s % 2 === 1 ? Math.max(B[0]![0]!, B[1]![1]!) : Math.min(B[0]![0]!, B[1]![1]!));
    }
    expect(kinds.size).toBe(4);
    expect(trap).toBeGreaterThan(0);
  });

  it("задачи урока I.11: сингулярные числа, решение наименьшей нормы и ошибка приближения сходятся с условием", () => {
    for (let s = 1; s <= 40; s++) {
      const sv = num(make("la.singular-values", s));
      const A = /\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}/.exec(sv.prompt)![1]!.split(" \\\\ ").map((row) => row.split(" & ").map(Number));
      expect(A[0]![1]).not.toBe(A[1]![0]);
      const F = A.flat().reduce((acc, x) => acc + x * x, 0);
      const D = A[0]![0]! * A[1]![1]! - A[0]![1]! * A[1]![0]!;
      const root = Math.sqrt(F * F - 4 * D * D);
      expect(sv.answer).toBe(Math.sqrt(s % 2 === 1 ? (F + root) / 2 : (F - root) / 2));
      expect(Number.isInteger(sv.answer) && sv.answer > 0).toBe(true);

      const mn = make("la.min-norm", s);
      if (mn.kind !== "matrix") throw new Error("ожидалась матрица");
      const a = /smallmatrix\}(.*?)\\end/.exec(mn.prompt.slice(mn.prompt.indexOf("A = ")))![1]!.split(" & ").map(Number);
      const b = Number(/= (-?\d+)\$ бесконечно/.exec(mn.prompt)![1]);
      const x = mn.answer.map((row) => row[0]!);
      expect(a[0]! * x[0]! + a[1]! * x[1]!).toBe(b);
      expect(a[0]! * x[1]! - a[1]! * x[0]!).toBe(0); // x ∥ a — перпендикулярно ядру

      const le = num(make("la.lowrank-error", s));
      const sig = /— \$([\d, ]+)\$/.exec(le.prompt)![1]!.split(", ").map(Number);
      const k = Number(/k = (\d)/.exec(le.prompt)![1]);
      expect(le.answer).toBe(sig.slice(k).reduce((acc, v) => acc + v * v, 0));
    }
  });

  it("задача капстоуна I.12: веса удовлетворяют нормальным уравнениям", () => {
    for (let s = 1; s <= 40; s++) {
      const ne = make("la.normal-eq", s);
      if (ne.kind !== "matrix") throw new Error("ожидалась матрица");
      const [G, b] = [...ne.prompt.matchAll(/\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}/g)].map((m) => m[1]!.split(" \\\\ ").map((row) => row.split(" & ").map(Number)));
      const th = ne.answer.map((row) => row[0]!);
      expect(G![0]![0]! * G![1]![1]! - G![0]![1]! ** 2).toBeGreaterThan(0);
      expect(G!.map((row) => row[0]! * th[0]! + row[1]! * th[1]!)).toEqual(b!.map((row) => row[0]));
    }
  });

  it("задачи урока II.1: производные многочленов сверяются с численными", () => {
    // разбор записи poly(): «3x^2 y - 2x y^2 + x - 4y» → функция двух переменных
    const parsePoly = (tex: string) => {
      const terms = tex.replace(/ - /g, " + -").split(" + ").map((t) => t.trim());
      return (x: number, y: number) =>
        terms.reduce((acc, t) => {
          const m = /^(-?)(\d*)(.*)$/.exec(t)!;
          let v = (m[1] ? -1 : 1) * (m[2] ? Number(m[2]) : 1);
          for (const [, name, pow] of m[3]!.replace(/\s/g, "").matchAll(/(x_1|x_2|x|y)(?:\^(\d))?/g)) v *= (name === "x" || name === "x_1" ? x : y) ** Number(pow ?? 1);
          return acc + v;
        }, 0);
    };
    const d = (fn: (x: number, y: number) => number, x: number, y: number, by: 0 | 1) => {
      const h = 1e-4;
      return by === 0 ? (fn(x + h, y) - fn(x - h, y)) / (2 * h) : (fn(x, y + h) - fn(x, y - h)) / (2 * h);
    };
    for (let s = 1; s <= 40; s++) {
      const pa = num(make("calc.partial", s));
      const fn = parsePoly(/f\(x, y\) = (.*?)\$/.exec(pa.prompt)![1]!);
      const [x, y] = /точке \$\((-?\d+), (-?\d+)\)/.exec(pa.prompt)!.slice(1).map(Number) as [number, number];
      expect(pa.answer).toBeCloseTo(d(fn, x, y, s % 2 === 1 ? 0 : 1), 6);

      const gp = make("calc.gradient-point", s);
      if (gp.kind !== "matrix") throw new Error("ожидалась матрица");
      const fg = parsePoly(/f\(x\) = (.*?)\$/.exec(gp.prompt)![1]!);
      const [gx, gy] = /x = \((-?\d+), (-?\d+)\)/.exec(gp.prompt)!.slice(1).map(Number) as [number, number];
      expect(gp.answer[0]![0]).toBeCloseTo(d(fg, gx, gy, 0), 6);
      expect(gp.answer[1]![0]).toBeCloseTo(d(fg, gx, gy, 1), 6);

      const cp = make("calc.critical-point", s);
      if (cp.kind !== "matrix") throw new Error("ожидалась матрица");
      const fc2 = parsePoly(/f\(x\) = (.*?)\$/.exec(cp.prompt)![1]!);
      const [px, py] = [cp.answer[0]![0]!, cp.answer[1]![0]!];
      expect(Math.abs(d(fc2, px, py, 0)) + Math.abs(d(fc2, px, py, 1))).toBeLessThan(1e-6);

      const dd = num(make("calc.directional", s));
      const g = /\((-?\d+), (-?\d+)\)/.exec(dd.prompt)!.slice(1).map(Number);
      if (s % 3 === 0) expect(dd.answer).toBe(Math.hypot(g[0]!, g[1]!));
      else {
        const u = /u = \((-?[\d.]+), (-?[\d.]+)\)/.exec(dd.prompt)!.slice(1).map(Number);
        expect(Math.hypot(u[0]!, u[1]!)).toBeCloseTo(1, 12);
        expect(dd.answer).toBeCloseTo(g[0]! * u[0]! + g[1]! * u[1]!, 12);
      }
    }
  });

  it("задачи урока II.2: якобиан, порядок композиции и обратный проход сходятся с численными", () => {
    for (let s = 1; s <= 40; s++) {
      const ja = make("calc.jacobian", s);
      if (ja.kind !== "matrix") throw new Error("ожидалась матрица");
      const [c1, c2] = [...ja.prompt.matchAll(/\\begin\{pmatrix\} (.*?) \\\\ (.*?) \\end\{pmatrix\}/g)][0]!.slice(1);
      const term = (t: string, x: number, y: number) =>
        t.replace(/ - /g, " + -").split(" + ").reduce((acc, u) => {
          const m = /^(-?)(\d*)(x\^2|xy|x|y)$/.exec(u.trim())!;
          const k = (m[1] ? -1 : 1) * (m[2] ? Number(m[2]) : 1);
          return acc + k * ({ "x^2": x * x, xy: x * y, x, y } as Record<string, number>)[m[3]!]!;
        }, 0);
      const [px, py] = /точке \$\((-?\d+), (-?\d+)\)/.exec(ja.prompt)!.slice(1).map(Number) as [number, number];
      const h = 1e-5;
      for (const [i, t] of [c1!, c2!].entries()) {
        expect(ja.answer[i]![0]).toBeCloseTo((term(t, px + h, py) - term(t, px - h, py)) / (2 * h), 5);
        expect(ja.answer[i]![1]).toBeCloseTo((term(t, px, py + h) - term(t, px, py - h)) / (2 * h), 5);
      }

      const jo = make("calc.jacobian-order", s);
      if (jo.kind !== "choice") throw new Error("ожидался выбор");
      expect(jo.options.filter((o) => o.correct)).toHaveLength(1);
      expect(jo.options.find((o) => o.correct)!.text).toContain("J_g J_f");

      const bp = num(make("calc.backprop", s));
      const [t1, t2] = /\\theta = \((-?\d+), (-?\d+)\)/.exec(bp.prompt)!.slice(1).map(Number) as [number, number];
      const [x1, x2] = /x = \((-?\d+), (-?\d+)\)/.exec(bp.prompt)!.slice(1).map(Number) as [number, number];
      const y = Number(/y = (-?\d+)\$/.exec(bp.prompt)![1]);
      const L = (a: number, b: number) => (a * x1 + b * x2 - y) ** 2;
      const numeric = s % 2 === 1 ? (L(t1 + h, t2) - L(t1 - h, t2)) / (2 * h) : (L(t1, t2 + h) - L(t1, t2 - h)) / (2 * h);
      expect(bp.answer).toBeCloseTo(numeric, 4);
    }
  });

  it("задача урока II.3: градиент xᵀAx + bᵀx совпадает с численным", () => {
    const mats = (tex: string) => [...tex.matchAll(/\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}/g)].map((m) => m[1]!.split(" \\\\ ").map((row) => row.split(" & ").map(Number)));
    for (let s = 1; s <= 40; s++) {
      const mg = make("calc.matrix-grad", s);
      if (mg.kind !== "matrix") throw new Error("ожидалась матрица");
      const [A, b, x] = mats(mg.prompt) as [number[][], number[][], number[][]];
      expect(A[0]![1]).not.toBe(A[1]![0]);
      const f = (v: number[]) => v.reduce((acc, vi, i) => acc + vi * (A[i]![0]! * v[0]! + A[i]![1]! * v[1]!) + b[i]![0]! * vi, 0);
      const h = 1e-5;
      for (const j of [0, 1]) {
        const e = [0, 0].map((_, k) => (k === j ? h : 0));
        const p0 = x.map((r) => r[0]!);
        expect(mg.answer[j]![0]).toBeCloseTo((f(p0.map((v, k) => v + e[k]!)) - f(p0.map((v, k) => v - e[k]!))) / (2 * h), 5);
      }
    }
  });

  it("задачи урока II.4: гессиан — вторые производные, тип точки — по знакам собственных значений", () => {
    const mats = (tex: string) => [...tex.matchAll(/\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}/g)].map((m) => m[1]!.split(" \\\\ ").map((row) => row.split(" & ").map(Number)));
    for (let s = 1; s <= 40; s++) {
      const he = make("calc.hessian", s);
      if (he.kind !== "matrix") throw new Error("ожидалась матрица");
      const tex = /f\(x, y\) = (.*?)\$/.exec(he.prompt)![1]!;
      const f = (x: number, y: number) =>
        tex.replace(/ - /g, " + -").split(" + ").reduce((acc, u) => {
          const m = /^(-?)(\d*)(x\^3|x\^2 y|x y\^2|y\^2)$/.exec(u.trim())!;
          const k = (m[1] ? -1 : 1) * (m[2] ? Number(m[2]) : 1);
          return acc + k * ({ "x^3": x ** 3, "x^2 y": x * x * y, "x y^2": x * y * y, "y^2": y * y } as Record<string, number>)[m[3]!]!;
        }, 0);
      const [px, py] = /точке \$\((-?\d+), (-?\d+)\)/.exec(he.prompt)!.slice(1).map(Number) as [number, number];
      const h = 1e-3;
      const fxx = (f(px + h, py) - 2 * f(px, py) + f(px - h, py)) / (h * h);
      const fyy = (f(px, py + h) - 2 * f(px, py) + f(px, py - h)) / (h * h);
      const fxy = (f(px + h, py + h) - f(px + h, py - h) - f(px - h, py + h) + f(px - h, py - h)) / (4 * h * h);
      expect(he.answer[0]![0]).toBeCloseTo(fxx, 3);
      expect(he.answer[1]![1]).toBeCloseTo(fyy, 3);
      expect(he.answer[0]![1]).toBeCloseTo(fxy, 3);
      expect(he.answer[1]![0]).toBe(he.answer[0]![1]);

      const cl = make("calc.classify", s);
      if (cl.kind !== "choice") throw new Error("ожидался выбор");
      const H = mats(cl.prompt)[0]!;
      const m = (H[0]![0]! + H[1]![1]!) / 2;
      const rr = Math.hypot((H[0]![0]! - H[1]![1]!) / 2, H[0]![1]!);
      const [l1, l2] = [m + rr, m - rr];
      const want = Math.abs(l1 * l2) < 1e-9 ? "По гессиану не определить" : l1 * l2 < 0 ? "Седло" : l1 > 0 ? "Минимум" : "Максимум";
      expect(cl.options.find((o) => o.correct)!.text).toBe(want);
    }
  });

  it("calc.convex-form: ответ совпадает с A ⪰ 0 по собственным значениям; виды чередуются", () => {
    const mats = (tex: string) => [...tex.matchAll(/\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}/g)].map((m) => m[1]!.split(" \\\\ ").map((row) => row.split(" & ").map(Number)));
    const seen = new Set<string>();
    for (let s = 1; s <= 40; s++) {
      const cf = make("calc.convex-form", s);
      if (cf.kind !== "choice") throw new Error("ожидался выбор");
      const A = mats(cf.prompt)[0]!;
      const m = (A[0]![0]! + A[1]![1]!) / 2;
      const rr = Math.hypot((A[0]![0]! - A[1]![1]!) / 2, A[0]![1]!);
      const convex = m - rr > -1e-9;
      expect(cf.options.filter((o) => o.correct).map((o) => o.text)).toEqual([convex ? "Выпукла" : "Не выпукла"]);
      seen.add(`${convex}:${Math.abs((m - rr) * (m + rr)) < 1e-9}`);
    }
    // строго выпуклые, вырожденные выпуклые и невыпуклые — все встречаются
    expect(seen).toContain("true:false");
    expect(seen).toContain("true:true");
    expect(seen).toContain("false:false");
  });

  it("calc.convex-ops: выпуклые и невыпуклые чередуются по seed", () => {
    for (let s = 1; s <= 12; s++) {
      const co = make("calc.convex-ops", s);
      if (co.kind !== "choice") throw new Error("ожидался выбор");
      expect(co.options.find((o) => o.correct)!.text).toBe(s % 2 === 1 ? "Выпукла" : "Не выпукла");
    }
  });

  it("calc.gd-step: спуск уменьшает f, подъём увеличивает; ответ — θ ∓ η∇f", () => {
    for (let s = 1; s <= 30; s++) {
      const t = make("calc.gd-step", s);
      if (t.kind !== "matrix") throw new Error("ожидалась матрица");
      const ascent = s % 2 === 0;
      expect(t.prompt).toContain(ascent ? "подъём" : "спуск");
      const tex = /\$f\(\\theta\) = (.*?)\$/.exec(t.prompt)![1]!;
      const k: Record<string, number> = {};
      for (const u of tex.replace(/ - /g, " + -").split(" + ")) {
        const m = /^(-?)(\d*)\\theta_(\d)(\^2)?$/.exec(u.trim())!;
        k[m[3]! + (m[4] ? "²" : "")] = (m[1] ? -1 : 1) * (m[2] ? Number(m[2]) : 1);
      }
      const [a, c, d, e] = ["1²", "2²", "1", "2"].map((key) => k[key] ?? 0) as [number, number, number, number];
      const f = (x: number, y: number) => a * x * x + c * y * y + d * x + e * y;
      const [x, y] = /\\theta = \((-?\d+), (-?\d+)\)/.exec(t.prompt)!.slice(1).map(Number) as [number, number];
      const [nx, ny] = [t.answer[0]![0]!, t.answer[1]![0]!];
      const eta = Number(/\\eta = ([\d.]+)/.exec(t.prompt)![1]);
      const h = 1e-6;
      const grad = [(f(x + h, y) - f(x - h, y)) / (2 * h), (f(x, y + h) - f(x, y - h)) / (2 * h)];
      const sg = ascent ? -1 : 1;
      expect(nx).toBeCloseTo(x - sg * eta * grad[0]!, 3);
      expect(ny).toBeCloseTo(y - sg * eta * grad[1]!, 3);
      if (ascent) expect(f(nx, ny)).toBeGreaterThanOrEqual(f(x, y));
      else expect(f(nx, ny)).toBeLessThanOrEqual(f(x, y));
    }
  });

  it("calc.lr-threshold: ответ 2/λ_max по собственным значениям матрицы из условия", () => {
    const mats = (tex: string) => [...tex.matchAll(/\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}/g)].map((m) => m[1]!.split(" \\\\ ").map((row) => row.split(" & ").map(Number)));
    for (let s = 1; s <= 30; s++) {
      const t = make("calc.lr-threshold", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const A = mats(t.prompt)[0]!;
      const m = (A[0]![0]! + A[1]![1]!) / 2;
      const rr = Math.hypot((A[0]![0]! - A[1]![1]!) / 2, A[0]![1]!);
      expect(m - rr).toBeGreaterThan(0);
      expect(t.answer).toBeCloseTo(2 / (m + rr), 4);
    }
  });

  it("calc.newton-1d: шаг из условия совпадает с θ − f′/f″ по конечным разностям", () => {
    for (let s = 1; s <= 30; s++) {
      const t = make("calc.newton-1d", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const tex = /\$f\(\\theta\) = (.*?)\$/.exec(t.prompt)![1]!;
      const k: Record<string, number> = {};
      for (const u of tex.replace(/ - /g, " + -").split(" + ")) {
        const m = /^(-?)(\d*)\\theta(\^(\d))?$/.exec(u.trim())!;
        k[m[4] ?? "1"] = (m[1] ? -1 : 1) * (m[2] ? Number(m[2]) : 1);
      }
      const f = (x: number) => (k["3"] ?? 0) * x ** 3 + (k["2"] ?? 0) * x ** 2 + (k["1"] ?? 0) * x;
      const th = Number(/Сейчас \$\\theta = (-?\d+)\$/.exec(t.prompt)![1]);
      const h = 1e-3;
      const d1 = (f(th + h) - f(th - h)) / (2 * h);
      const d2 = (f(th + h) - 2 * f(th) + f(th - h)) / (h * h);
      expect(d2).toBeGreaterThan(0);
      expect(t.answer).toBeCloseTo(th - d1 / d2, 2);
    }
  });

  it("calc.newton-logistic: ответ — шаг Ньютона, посчитанный по сигмоиде напрямую", () => {
    const sig = (z: number) => 1 / (1 + Math.exp(-z));
    for (let s = 1; s <= 30; s++) {
      const t = make("calc.newton-logistic", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const pts = [...t.prompt.matchAll(/\((-?\d+), ([01])\)/g)].map((m) => [Number(m[1]), Number(m[2])] as const);
      expect(pts).toHaveLength(4);
      const d1 = pts.reduce((a, [x, y]) => a + (sig(0) - y) * x, 0);
      const d2 = pts.reduce((a, [x]) => a + sig(0) * (1 - sig(0)) * x * x, 0);
      expect(t.answer).toBeCloseTo(-d1 / d2, 2);
    }
  });

  it("calc.lagrange-line: ответ на прямой и ∇f ∥ ∇h; calc.lagrange-eig — собственное значение; calc.categorical-mle — доли", () => {
    const mats = (tex: string) => [...tex.matchAll(/\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}/g)].map((m) => m[1]!.split(" \\\\ ").map((row) => row.split(" & ").map(Number)));
    const coefs = (tex: string, names: string[]) => {
      const k: Record<string, number> = {};
      for (const u of tex.replace(/ - /g, " + -").split(" + ")) {
        const m = /^(-?)(\d*)(x_[12](?:\^2)?)$/.exec(u.trim())!;
        k[m[3]!] = (m[1] ? -1 : 1) * (m[2] ? Number(m[2]) : 1);
      }
      return names.map((n) => k[n] ?? 0);
    };
    for (let s = 1; s <= 30; s++) {
      const t = make("calc.lagrange-line", s);
      if (t.kind !== "matrix") throw new Error("ожидалась матрица");
      const [, ftex, htex, rhs] = /f\(x\) = (.*?)\$ при ограничении \$(.*?) = (-?\d+)\$/.exec(t.prompt)!;
      const [a, c] = coefs(ftex!, ["x_1^2", "x_2^2"]) as [number, number];
      const [p, q] = coefs(htex!, ["x_1", "x_2"]) as [number, number];
      const [x1, x2] = [t.answer[0]![0]!, t.answer[1]![0]!];
      expect(p * x1 + q * x2).toBeCloseTo(Number(rhs), 2);
      // ∇f = (2a x₁, 2c x₂) параллелен ∇h = (p, q)
      expect(2 * a * x1 * q - 2 * c * x2 * p).toBeCloseTo(0, 1);

      const e = make("calc.lagrange-eig", s);
      if (e.kind !== "numeric") throw new Error("ожидалось число");
      const S = mats(e.prompt)[0]!;
      const m = (S[0]![0]! + S[1]![1]!) / 2;
      const rr = Math.hypot((S[0]![0]! - S[1]![1]!) / 2, S[0]![1]!);
      const best = Array.from({ length: 3600 }, (_, i) => {
        const u = [Math.cos((i * Math.PI) / 1800), Math.sin((i * Math.PI) / 1800)] as const;
        return S[0]![0]! * u[0] ** 2 + 2 * S[0]![1]! * u[0] * u[1] + S[1]![1]! * u[1] ** 2;
      });
      expect(e.answer).toBeCloseTo(s % 2 === 1 ? m + rr : m - rr, 9);
      expect(e.answer).toBeCloseTo(s % 2 === 1 ? Math.max(...best) : Math.min(...best), 4);

      const c3 = make("calc.categorical-mle", s);
      if (c3.kind !== "matrix") throw new Error("ожидалась матрица");
      const sum = c3.answer.reduce((acc, [v]) => acc + v!, 0);
      expect(sum).toBeCloseTo(1, 2);
    }
  });

  it("calc.kkt-alpha: α* = max(0, g(c)/2), x* = c − α*(1, 1) — ближайшая допустимая точка", () => {
    for (let s = 1; s <= 30; s++) {
      const t = make("calc.kkt-alpha", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const b = Number(/x_1 \+ x_2 \\le (-?\d+)/.exec(t.prompt)![1]);
      const [c1, c2] = /c = \((-?\d+), (-?\d+)\)/.exec(t.prompt)!.slice(1).map(Number) as [number, number];
      const x = [c1 - t.answer, c2 - t.answer];
      expect(x[0]! + x[1]!).toBeLessThanOrEqual(b + 1e-12);
      expect(t.answer * (x[0]! + x[1]! - b)).toBeCloseTo(0, 12);
      expect(t.answer > 0).toBe(s % 2 === 1);
    }
  });

  it("calc.double-integral, calc.area-scale, calc.polar-integral: ответы сверены численной квадратурой", () => {
    const mats = (tex: string) => [...tex.matchAll(/\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}/g)].map((m) => m[1]!.split(" \\\\ ").map((row) => row.split(" & ").map(Number)));
    const N = 400;
    for (let s = 1; s <= 24; s++) {
      const t = make("calc.double-integral", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const [, mono, a, b] = /iint_D (.*?)\\, dx\\, dy\$, где \$D = \[0, (\d)\] \\times \[0, (\d)\]/.exec(t.prompt)!;
      const m = /^(\d*)(x(?:\^(\d))?)?y(?:\^(\d))?$/.exec(mono!)!;
      const k = m[1] ? Number(m[1]) : 1;
      const p = m[2] ? (m[3] ? Number(m[3]) : 1) : 0;
      const q = m[4] ? Number(m[4]) : 1;
      let sum = 0;
      // правило средних точек на сетке N × N
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const x = ((i + 0.5) * Number(a)) / N;
        const y = ((j + 0.5) * Number(b)) / N;
        sum += k * x ** p * y ** q;
      }
      expect(t.answer).toBeCloseTo((sum * Number(a) * Number(b)) / (N * N), 2);

      const as = make("calc.area-scale", s);
      if (as.kind !== "numeric") throw new Error("ожидалось число");
      const A = mats(as.prompt)[0]!;
      const S = Number(/площадь \$([\d.]+)\$/.exec(as.prompt)![1]);
      // образ единичного квадрата — параллелограмм: площадь по формуле шнурка
      const v = [[0, 0], [A[0]![0]!, A[1]![0]!], [A[0]![0]! + A[0]![1]!, A[1]![0]! + A[1]![1]!], [A[0]![1]!, A[1]![1]!]];
      let sh = 0;
      for (let i = 0; i < 4; i++) sh += v[i]![0]! * v[(i + 1) % 4]![1]! - v[(i + 1) % 4]![0]! * v[i]![1]!;
      expect(as.answer).toBeCloseTo((Math.abs(sh) / 2) * S, 9);

      const pi = make("calc.polar-integral", s);
      if (pi.kind !== "numeric") throw new Error("ожидалось число");
      const R2 = Number(/x\^2 \+ y\^2 \\le (\d+)\}/.exec(pi.prompt)![1]);
      const kk = pi.prompt.includes("(x^2 + y^2)^2") ? 2 : pi.prompt.includes("(x^2 + y^2)") ? 1 : 0;
      const R = Math.sqrt(R2);
      let ps = 0;
      const M = 600;
      for (let i = 0; i < M; i++) for (let j = 0; j < M; j++) {
        const x = -R + ((i + 0.5) * 2 * R) / M;
        const y = -R + ((j + 0.5) * 2 * R) / M;
        if (x * x + y * y <= R2) ps += (x * x + y * y) ** kk;
      }
      expect(pi.answer * Math.PI).toBeCloseTo((ps * 4 * R2) / (M * M), 0);
    }
  });

  it("prob.dice-event: ответ — доля перебором 36 исходов; prob.monomials — перечисление мономов", () => {
    for (let s = 1; s <= 24; s++) {
      const t = make("prob.dice-event", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const num = (re: RegExp) => Number(re.exec(t.prompt)![1]);
      const pairs = Array.from({ length: 36 }, (_, i) => [Math.floor(i / 6) + 1, (i % 6) + 1] as const);
      const has = t.prompt.includes("равна")
        ? ([a, b]: readonly [number, number]) => a + b === num(/равна \$(\d+)\$/)
        : t.prompt.includes("не меньше")
          ? ([a, b]: readonly [number, number]) => a + b >= num(/не меньше \$(\d+)\$/)
          : t.prompt.includes("шестёрка")
            ? ([a, b]: readonly [number, number]) => a === 6 || b === 6
            : ([a, b]: readonly [number, number]) => Math.max(a, b) <= num(/не больше \$(\d+)\$/);
      expect(t.answer).toBeCloseTo(pairs.filter(has).length / 36, 3);

      const m = make("prob.monomials", s);
      if (m.kind !== "numeric") throw new Error("ожидалось число");
      const d = Number(/из \$(\d+)\$ переменных/.exec(m.prompt)![1]);
      const k = Number(/не выше \$(\d+)\$/.exec(m.prompt)![1]);
      // перечисляем показатели (a₁, …, a_d) с суммой ≤ k
      const enumerate = (vars: number, left: number): number => (vars === 0 ? 1 : Array.from({ length: left + 1 }, (_, a) => enumerate(vars - 1, left - a)).reduce((x, y) => x + y, 0));
      expect(m.answer).toBe(enumerate(d, k));
    }
  });

  it("prob.cond-dice: ответ — |A ∩ B| / |B| перебором; prob.independence-check: ответ — равенство P(A ∩ B) = P(A) P(B)", () => {
    const pairs = Array.from({ length: 36 }, (_, i) => [Math.floor(i / 6) + 1, (i % 6) + 1] as const);
    const ev: Record<string, (o: readonly [number, number]) => boolean> = {
      "сумма очков не меньше $8$": ([a, b]) => a + b >= 8,
      "на первом кубике чётное число": ([a]) => a % 2 === 0,
      "выпал дубль": ([a, b]) => a === b,
      "на втором кубике $6$": ([, b]) => b === 6,
      "сумма очков не больше $4$": ([a, b]) => a + b <= 4,
      "хотя бы на одном кубике $1$": ([a, b]) => a === 1 || b === 1,
      "сумма очков чётная": ([a, b]) => (a + b) % 2 === 0,
    };
    for (let s = 1; s <= 24; s++) {
      const t = make("prob.cond-dice", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const [, b, a] = /Известно, что (.*?)\. Найдите вероятность, что (.*?)\.$/.exec(t.prompt)!;
      const nb = pairs.filter(ev[b!]!).length;
      const nab = pairs.filter((o) => ev[a!]!(o) && ev[b!]!(o)).length;
      expect(t.answer).toBeCloseTo(nab / nb, 3);

      const c = make("prob.independence-check", s);
      if (c.kind !== "choice") throw new Error("ожидался выбор");
      const [, A, B] = /\$A\$ — (.*?), \$B\$ — (.*?)\. Независимы/.exec(c.prompt)!;
      const na = pairs.filter(ev[A!]!).length;
      const nb2 = pairs.filter(ev[B!]!).length;
      const nab2 = pairs.filter((o) => ev[A!]!(o) && ev[B!]!(o)).length;
      expect(c.options.find((o) => o.correct)!.text).toBe(36 * nab2 === na * nb2 ? "Независимы" : "Зависимы");
    }
  });

  it("prob.pmf-cdf, prob.interval-prob, prob.linear-density: ответы сверены суммой, интегралом и гистограммой", () => {
    for (let s = 1; s <= 24; s++) {
      const t = make("prob.pmf-cdf", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const ps = [...t.prompt.matchAll(/P\(X = (\d)\) = ([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])] as const);
      expect(ps.reduce((a, [, p]) => a + p, 0)).toBeCloseTo(1, 12);
      const tt = Number(/F\(([\d.]+)\) = P/.exec(t.prompt)![1]);
      expect(t.answer).toBeCloseTo(ps.filter(([x]) => x <= tt).reduce((a, [, p]) => a + p, 0), 9);

      const ip = make("prob.interval-prob", s);
      if (ip.kind !== "numeric") throw new Error("ожидалось число");
      const [a, b] = /P\(([\d.]+) \\le X \\le ([\d.]+)\)/.exec(ip.prompt)!.slice(1).map(Number) as [number, number];
      const pdf = ip.prompt.includes("равномерна")
        ? ((L) => (x: number) => (x >= 0 && x <= L ? 1 / L : 0))(Number(/\[0, (\d+)\]/.exec(ip.prompt)![1]))
        : ((lam) => (x: number) => (x >= 0 ? lam * Math.exp(-lam * x) : 0))(Number(/p\(x\) = ([\d.]*)e/.exec(ip.prompt)![1] || 1));
      let integral = 0;
      const N = 4000;
      for (let i = 0; i < N; i++) integral += pdf(a + ((i + 0.5) * (b - a)) / N) * ((b - a) / N);
      expect(ip.answer).toBeCloseTo(integral, 3);

      const ld = make("prob.linear-density", s);
      if (ld.kind !== "numeric") throw new Error("ожидалось число");
      const [lo, hi] = /отрезка \$\[(-?[\d.]+), (-?[\d.]+)\]\$/.exec(ld.prompt)!.slice(1).map(Number) as [number, number];
      // плотность равномерной на образе отрезка — 1 / длина
      expect(ld.answer).toBeCloseTo(1 / (hi - lo), 4);
    }
  });

  it("prob.ev-var, prob.var-linear: ответ по таблице и по a² Var X; prob.jensen — знак f'' определяет ответ", () => {
    for (let s = 1; s <= 24; s++) {
      const t = make("prob.ev-var", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const ps = [...t.prompt.matchAll(/P\(X = (-?\d)\) = ([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])] as const);
      const m = ps.reduce((a, [x, p]) => a + x * p, 0);
      const v = ps.reduce((a, [x, p]) => a + (x - m) ** 2 * p, 0);
      expect(t.answer).toBeCloseTo(s % 2 === 0 ? v : m, 3);

      const vl = make("prob.var-linear", s);
      if (vl.kind !== "numeric") throw new Error("ожидалось число");
      const V = Number(/Var\} X = (\d+)\$/.exec(vl.prompt)![1]);
      const a = Number(/Var\}\((-?[\d.]+)X/.exec(vl.prompt)![1]);
      expect(vl.answer).toBeCloseTo(a * a * V, 9);

      const j = make("prob.jensen", s);
      if (j.kind !== "choice") throw new Error("ожидался выбор");
      // X равновероятно 1 или 4: сравниваем f(E X) с E f(X) численно
      const f = j.prompt.includes("x^2") ? (x: number) => x * x : j.prompt.includes("log") ? Math.log : j.prompt.includes("e^x") ? Math.exp : Math.sqrt;
      const lhs = f(2.5);
      const rhs = (f(1) + f(4)) / 2;
      expect(j.options.find((o) => o.correct)!.text).toBe(lhs < rhs ? String.raw`$f(\mathbb{E}X) < \mathbb{E}f(X)$` : String.raw`$f(\mathbb{E}X) > \mathbb{E}f(X)$`);
    }
  });

  it("prob.family-moments и prob.point-prob: ответы сверены с src/lib/math/distributions", () => {
    for (let s = 1; s <= 32; s++) {
      const t = make("prob.family-moments", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const num = (re: RegExp) => Number(re.exec(t.prompt)![1]);
      const [fam, p] = t.prompt.includes("число успехов")
        ? (["binomial", { n: num(/в \$(\d+)\$ независимых/), phi: num(/успеха \$([\d.]+)\$/) }] as const)
        : t.prompt.includes("номер первого")
          ? (["geometric", { phi: num(/успеха \$([\d.]+)\$/) }] as const)
          : t.prompt.includes("пуассоновская")
            ? (["poisson", { lambda: num(/lambda = ([\d.]+)/) }] as const)
            : (["bernoulli", { phi: num(/P\(X = 1\) = ([\d.]+)/) }] as const);
      const m = moments(fam, p);
      expect(t.answer).toBeCloseTo(t.prompt.includes("Var") ? m.variance : m.mean, 3);

      const pp = make("prob.point-prob", s);
      if (pp.kind !== "numeric") throw new Error("ожидалось число");
      const k = Number(/P\(X = (\d)\)/.exec(pp.label)![1]);
      const want = pp.prompt.includes("пуассоновское")
        ? pmf("poisson", { lambda: Number(/lambda = (\d)/.exec(pp.prompt)![1]) }, k)
        : pmf("binomial", { n: Number(/бросают \$(\d)\$/.exec(pp.prompt)![1]), phi: Number(/орла \$([\d.]+)\$/.exec(pp.prompt)![1]) }, k);
      expect(pp.answer).toBeCloseTo(want, 3);
    }
  });

  it("prob.normal-rule: ответ близок к точной вероятности нормального; prob.cont-moments — к моментам из continuous.ts", () => {
    for (let s = 1; s <= 32; s++) {
      const t = make("prob.normal-rule", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const tail = t.prompt.includes("больше");
      const [mu, sigma] = tail
        ? [Number(/средним \$(\d+)\$/.exec(t.prompt)![1]), Number(/отклонением \$(\d+)\$/.exec(t.prompt)![1])]
        : [Number(/mathcal\{N\}\((\d+), (\d+)\)/.exec(t.prompt)![1]), Math.sqrt(Number(/mathcal\{N\}\((\d+), (\d+)\)/.exec(t.prompt)![2]))];
      const P = (x: number) => contCdf("normal", { mu, sigma }, x);
      if (tail) {
        const hi = Number(/больше \$(\d+)\$/.exec(t.prompt)![1]);
        expect(Math.abs(t.answer - (1 - P(hi)))).toBeLessThan(0.006);
      } else {
        const [lo, hi] = /P\((-?\d+) \\le X \\le (\d+)\)/.exec(t.prompt)!.slice(1).map(Number) as [number, number];
        expect(Math.abs(t.answer - (P(hi) - P(lo)))).toBeLessThan(0.006);
      }

      const c = make("prob.cont-moments", s);
      if (c.kind !== "numeric") throw new Error("ожидалось число");
      const want = c.prompt.includes("Var");
      const num = (re: RegExp) => Number(re.exec(c.prompt)![1]);
      const m = c.prompt.includes("равномерна")
        ? contMoments("uniform", { a: num(/\[(-?\d+), /), b: num(/, (-?\d+)\]/) })
        : c.prompt.includes("показательная")
          ? contMoments("exponential", { lambda: num(/lambda = ([\d.]+)/) })
          : c.prompt.includes("Лапласа")
            ? contMoments("laplace", { mu: num(/mu = (-?\d+)/), b: num(/b = ([\d.]+)/) })
            : contMoments("beta", { alpha: num(/Beta\}\((\d)/), beta: num(/Beta\}\(\d, (\d)\)/) });
      expect(c.answer).toBeCloseTo(want ? m.variance : m.mean, 3);
    }
  });

  it("prob.mc-error: ответ — σ/√n или наименьшее n; prob.union-bound: граница не меньше точной вероятности для независимых", () => {
    for (let s = 1; s <= 30; s++) {
      const t = make("prob.mc-error", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const num = (re: RegExp) => Number(re.exec(t.prompt)![1]);
      if (t.prompt.includes("Найдите стандартное")) {
        expect(t.answer).toBeCloseTo(num(/sigma = (\d+)/) / Math.sqrt(num(/n = (\d+)/)), 4);
      } else if (t.prompt.includes("наименьшее")) {
        const [sigma, eps] = [num(/sigma = (\d+)/), num(/больше \$([\d.]+)\$/)];
        expect(sigma / Math.sqrt(t.answer)).toBeLessThanOrEqual(eps + 1e-12);
        expect(sigma / Math.sqrt(t.answer - 1)).toBeGreaterThan(eps);
      } else {
        const [n, k] = [num(/по \$(\d+)\$ точкам/), num(/в \$(\d+)\$ раза/)];
        expect(Math.sqrt(t.answer / n)).toBeCloseTo(k, 12);
      }

      const u = make("prob.union-bound", s);
      if (u.kind !== "numeric") throw new Error("ожидалось число");
      const k = Number(/Есть \$(\d+)\$|Проверяем \$(\d+)\$/.exec(u.prompt)!.slice(1).find(Boolean));
      if (u.prompt.includes("Есть")) {
        const delta = Number(/не больше \$([\d.]+)\$/.exec(u.prompt)![1]);
        expect(u.answer).toBeGreaterThanOrEqual(1 - (1 - delta) ** k);
        expect(u.answer).toBeCloseTo(k * delta, 6);
      } else {
        expect(k * u.answer).toBeCloseTo(Number(/не больше \$([\d.]+)\$/.exec(u.prompt)![1]), 6);
      }
    }
  });

  it("prob.joint-marginal и prob.covariance: ответ совпадает с прямым счётом по таблице из условия", () => {
    const table = (prompt: string) => [...prompt.matchAll(/X = \d & ([\d.]+) & ([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])] as [number, number]);
    for (let s = 1; s <= 30; s++) {
      const t = make("prob.joint-marginal", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const rows = table(t.prompt);
      expect(rows).toHaveLength(3);
      expect(rows.flat().reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
      const ex = rows.reduce((acc, [a, b], x) => acc + x * (a + b), 0);
      const cond = (y: 0 | 1) => rows.reduce((acc, row, x) => acc + x * row[y], 0) / rows.reduce((acc, row) => acc + row[y], 0);
      if (t.prompt.includes("Найдите $P(X")) {
        const x = Number(/Найдите \$P\(X = (\d)\)/.exec(t.prompt)![1]);
        expect(t.answer).toBeCloseTo(rows[x]![0] + rows[x]![1], 6);
      } else if (t.prompt.includes("полного")) expect(Math.abs(t.answer - ex)).toBeLessThan(0.002);
      else expect(Math.abs(t.answer - cond(Number(/Y = (\d)\]\$\.$/.exec(t.prompt)![1]) as 0 | 1))).toBeLessThan(0.001);

      const c = make("prob.covariance", s);
      if (c.kind !== "numeric") throw new Error("ожидалось число");
      const [[p00, p01], [p10, p11]] = table(c.prompt) as [[number, number], [number, number]];
      expect(p00 + p01 + p10 + p11).toBeCloseTo(1, 9);
      const pts: [number, number, number][] = [[0, 0, p00], [0, 1, p01], [1, 0, p10], [1, 1, p11]];
      const E = (g: (x: number, y: number) => number) => pts.reduce((acc, [x, y, p]) => acc + p * g(x, y), 0);
      const cov = E((x, y) => (x - E((a) => a)) * (y - E((_, b) => b)));
      const want = c.prompt.includes("rho") ? cov / Math.sqrt(E((x) => (x - E((a) => a)) ** 2) * E((_, y) => (y - E((_, b) => b)) ** 2)) : cov;
      expect(Math.abs(c.answer - want)).toBeLessThan(0.001);
    }
  });

  it("prob.cov-linear: AΣAᵀ симметрична и совпадает с прямым счётом; prob.density-linear: 1/|det A|", () => {
    const mats = (prompt: string) => [...prompt.matchAll(/\\begin\{pmatrix\} (-?\d+) & (-?\d+) \\\\ (-?\d+) & (-?\d+) \\end\{pmatrix\}/g)].map((m) => [[Number(m[1]), Number(m[2])], [Number(m[3]), Number(m[4])]]);
    for (let s = 1; s <= 30; s++) {
      const t = make("prob.cov-linear", s);
      const [S, A] = mats(t.prompt) as [number[][], number[][] | undefined];
      if (t.kind === "matrix") {
        const C = [0, 1].map((i) => [0, 1].map((j) => [0, 1].reduce((acc, k) => acc + [0, 1].reduce((a2, l) => a2 + A![i]![k]! * S![k]![l]! * A![j]![l]!, 0), 0)));
        for (const i of [0, 1]) for (const j of [0, 1]) expect(t.answer[i]![j]!).toBeCloseTo(C[i]![j]!, 9);
        expect(S![0]![0]! * S![1]![1]! - S![0]![1]! ** 2).toBeGreaterThan(0);
        expect(t.answer[0]![1]).toBe(t.answer[1]![0]);
        expect(t.answer[0]![0]).toBeGreaterThanOrEqual(0);
      } else if (t.kind === "numeric") {
        const m = /Var\}\((-?\d*)X_1 ([+-]) (\d*)X_2\)/.exec(t.prompt)!;
        const c = (v: string) => (v === "" ? 1 : v === "-" ? -1 : Number(v));
        const a = [c(m[1]!), (m[2] === "-" ? -1 : 1) * c(m[3]!)];
        expect(t.answer).toBeCloseTo(a[0]! ** 2 * S![0]![0]! + 2 * a[0]! * a[1]! * S![0]![1]! + a[1]! ** 2 * S![1]![1]!, 9);
        expect(t.answer).toBeGreaterThanOrEqual(0);
      } else throw new Error("ожидалась матрица или число");

      const d = make("prob.density-linear", s);
      if (d.kind !== "numeric") throw new Error("ожидалось число");
      const [B] = mats(d.prompt) as [number[][]];
      expect(d.answer).toBeCloseTo(1 / Math.abs(B[0]![0]! * B[1]![1]! - B[0]![1]! * B[1]![0]!), 4);
    }
  });

  it("prob.mahalanobis и prob.gauss-axes: ответ совпадает с прямым счётом через Σ⁻¹ и собственные числа", () => {
    const mat = (p: string) => /\\begin\{pmatrix\} (-?[\d.]+) & (-?[\d.]+) \\\\ (-?[\d.]+) & (-?[\d.]+) \\end\{pmatrix\}/.exec(p)!.slice(1).map(Number) as [number, number, number, number];
    for (let s = 1; s <= 30; s++) {
      const m = make("prob.mahalanobis", s);
      if (m.kind !== "numeric") throw new Error("ожидалось число");
      const [a, , , d] = mat(m.prompt);
      const [mu1, mu2] = /mu = \((-?\d+), (-?\d+)\)/.exec(m.prompt)!.slice(1).map(Number) as [number, number];
      const [x1, x2] = /x = \((-?\d+), (-?\d+)\)/.exec(m.prompt)!.slice(1).map(Number) as [number, number];
      expect(m.answer).toBeCloseTo((x1 - mu1) ** 2 / a + (x2 - mu2) ** 2 / d, 9);

      const g = make("prob.gauss-axes", s);
      if (g.kind !== "numeric") throw new Error("ожидалось число");
      const [p, q, , r] = mat(g.prompt);
      const half = Math.hypot((p - r) / 2, q);
      const lam = g.prompt.includes("длинной") ? (p + r) / 2 + half : (p + r) / 2 - half;
      const level = Number(/= (\d+)\$\.$/.exec(g.prompt)![1]);
      // точка μ + t·u на собственном векторе лежит на уровне t²/λ: полуось t = √(level·λ)
      expect(g.answer).toBeCloseTo(Math.sqrt(level * lam), 9);
    }
  });

  it("prob.mixture: p(x) и ответственность по Байесу; prob.mixture-moments совпадают с интегралом по плотности смеси", () => {
    const npdf = (x: number, mu: number, v: number) => Math.exp(-((x - mu) ** 2) / (2 * v)) / Math.sqrt(2 * Math.PI * v);
    for (let s = 1; s <= 30; s++) {
      const t = make("prob.mixture", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const phi = Number(/phi = ([\d.]+)\$/.exec(t.prompt)![1]);
      const p1 = Number(/mid z = 1\) = ([\d.]+)\$/.exec(t.prompt)![1]);
      const p2 = Number(/mid z = 2\) = ([\d.]+)\$/.exec(t.prompt)![1]);
      const mix = phi * p1 + (1 - phi) * p2;
      expect(Math.abs(t.answer - (t.prompt.includes("ответственность") ? (phi * p1) / mix : mix))).toBeLessThan(0.001);

      const m = make("prob.mixture-moments", s);
      if (m.kind !== "numeric") throw new Error("ожидалось число");
      const [w, mu1, v1, mu2, v2] = /вероятностью \$([\d.]+)\$ из \$\\mathcal\{N\}\((-?\d+), (\d+)\)\$, иначе из \$\\mathcal\{N\}\((-?\d+), (\d+)\)/.exec(m.prompt)!.slice(1).map(Number) as [number, number, number, number, number];
      const dens = (x: number) => w * npdf(x, mu1, v1) + (1 - w) * npdf(x, mu2, v2);
      let e = 0;
      let e2 = 0;
      for (let x = -25; x <= 25; x += 0.005) {
        e += x * dens(x) * 0.005;
        e2 += x * x * dens(x) * 0.005;
      }
      expect(Math.abs(m.answer - (m.prompt.includes("Var") ? e2 - e * e : e))).toBeLessThan(0.01);
    }
  });

  it("prob.entropy, prob.kl, prob.log-loss: ответ совпадает с прямым счётом по условию; KL ≥ 0", () => {
    for (let s = 1; s <= 30; s++) {
      const e = make("prob.entropy", s);
      if (e.kind !== "numeric") throw new Error("ожидалось число");
      const p = /вероятностями \$([\d., ]+)\$/.exec(e.prompt)![1]!.split(", ").map(Number);
      expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
      expect(e.answer).toBeCloseTo(-p.reduce((a, v) => a + v * Math.log2(v), 0), 9);
      expect(e.answer).toBeLessThanOrEqual(Math.log2(p.length) + 1e-12);

      const k = make("prob.kl", s);
      if (k.kind !== "numeric") throw new Error("ожидалось число");
      const [a, b] = [...k.prompt.matchAll(/вероятностью(?: орла)? \$([\d.]+)\$/g)].map((m) => Number(m[1])) as [number, number];
      const [u, v] = k.prompt.includes("D_{KL}(q") ? [b, a] : [a, b];
      expect(k.answer).toBeCloseTo(u * Math.log(u / v) + (1 - u) * Math.log((1 - u) / (1 - v)), 3);
      expect(k.answer).toBeGreaterThan(0);

      const l = make("prob.log-loss", s);
      if (l.kind !== "numeric") throw new Error("ожидалось число");
      const ys = [...l.prompt.matchAll(/y\^\{\(\d\)\} = (\d)/g)].map((m) => Number(m[1]));
      const hs = [...l.prompt.matchAll(/h\^\{\(\d\)\} = ([\d.]+)/g)].map((m) => Number(m[1]));
      const want = -ys.reduce((acc, y, i) => acc + y * Math.log(hs[i]!) + (1 - y) * Math.log(1 - hs[i]!), 0) / ys.length;
      expect(l.answer).toBeCloseTo(want, 3);
    }
  });

  it("stat.mean-median, stat.iqr, stat.outlier-shift: ответы совпадают с прямым счётом", () => {
    const q = (x: number[], p: number) => {
      const s = [...x].sort((a, b) => a - b);
      const pos = p * (s.length - 1);
      const lo = Math.floor(pos);
      return s[lo]! + (pos - lo) * (s[Math.ceil(pos)]! - s[lo]!);
    };
    for (let s = 1; s <= 30; s++) {
      const a = make("stat.mean-median", s);
      if (a.kind !== "numeric") throw new Error("ожидалось число");
      const x = /Выборка: \$([\d, ]+)\$/.exec(a.prompt)![1]!.split(", ").map(Number);
      expect(a.answer).toBeCloseTo(a.prompt.includes("медиану") ? q(x, 0.5) : x.reduce((u, v) => u + v, 0) / x.length, 3);

      const b = make("stat.iqr", s);
      if (b.kind !== "numeric") throw new Error("ожидалось число");
      const y = /чисел: \$([\d, ]+)\$/.exec(b.prompt)![1]!.split(", ").map(Number);
      expect(y).toHaveLength(9);
      expect(b.answer).toBeCloseTo(q(y, 0.75) - q(y, 0.25), 9);

      const c = make("stat.outlier-shift", s);
      if (c.kind !== "numeric") throw new Error("ожидалось число");
      const [n, m] = /Среднее \$(\d+)\$ цен — \$(\d+)\$/.exec(c.prompt)!.slice(1).map(Number) as [number, number];
      const wrongVal = Number(/записали \$(\d+)\$/.exec(c.prompt)![1]);
      expect(c.answer).toBeCloseTo((m * n - 10 + wrongVal) / n, 3);
    }
  });

  it("stat.shrink-mse: MSE = смещение² + дисперсия по симуляции; stat.bessel: деление на n − 1 или n", () => {
    for (let s = 1; s <= 30; s++) {
      const t = make("stat.shrink-mse", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const [theta, sigma, n] = /theta = (\d+)\$, \$\\sigma = (\d+)\$, \$n = (\d+)\$/.exec(t.prompt)!.slice(1).map(Number) as [number, number, number];
      const c = Number(/hat\\theta = ([\d.]+)/.exec(t.prompt)![1]);
      const b2 = (c - 1) ** 2 * theta ** 2;
      const v = (c * c * sigma * sigma) / n;
      const want = t.prompt.includes("квадрат смещения") ? b2 : t.prompt.includes("дисперсию") ? v : b2 + v;
      expect(t.answer).toBeCloseTo(want, 3);

      const b = make("stat.bessel", s);
      if (b.kind !== "numeric") throw new Error("ожидалось число");
      const m = Number(/n = (\d+)\$ наблюдений/.exec(b.prompt)![1]);
      const ss = Number(/= (\d+)\$\. Найдите/.exec(b.prompt)![1]);
      expect(b.answer).toBeCloseTo(b.prompt.includes("несмещённую") ? ss / (m - 1) : ss / m, 3);
    }
    // симуляция: эмпирическая MSE сжатой оценки 0.5·x̄ при θ = 1, σ = 3, n = 4 — около 0.25 + 0.5625 = 0.8125
    const r = rng(7);
    const gauss = () => Math.sqrt(-2 * Math.log(1 - r.next())) * Math.cos(2 * Math.PI * r.next());
    let acc = 0;
    for (let k = 0; k < 20_000; k++) {
      let sum = 0;
      for (let i = 0; i < 4; i++) sum += 1 + 3 * gauss();
      acc += (0.5 * (sum / 4) - 1) ** 2;
    }
    expect(Math.abs(acc / 20_000 - 0.8125)).toBeLessThan(0.03);
  });

  it("stat.mle-family: ответ — максимум ℓ на сетке; stat.log-likelihood: k ln φ + (n − k) ln(1 − φ)", () => {
    for (let s = 1; s <= 32; s++) {
      const t = make("stat.mle-family", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      let ell: (th: number) => number;
      let grid: number[];
      if (t.prompt.includes("Монету")) {
        const [n, k] = /бросили \$(\d+)\$ раз, орёл выпал \$(\d+)\$/.exec(t.prompt)!.slice(1).map(Number) as [number, number];
        ell = (p) => k * Math.log(p) + (n - k) * Math.log(1 - p);
        grid = Array.from({ length: 999 }, (_, i) => (i + 1) / 1000);
      } else {
        const x = /: \$([-\d, ]+)\$\./.exec(t.prompt)![1]!.split(", ").map(Number);
        const n = x.length;
        const sum = x.reduce((a, b) => a + b, 0);
        if (t.prompt.includes("Пуассона")) ell = (l) => sum * Math.log(l) - n * l;
        else if (t.prompt.includes("показательное")) ell = (l) => n * Math.log(l) - l * sum;
        else {
          const m = sum / n;
          ell = (v) => -(n / 2) * Math.log(v) - x.reduce((a, xi) => a + (xi - m) ** 2, 0) / (2 * v);
        }
        grid = Array.from({ length: 2000 }, (_, i) => (i + 1) / 200);
      }
      for (const g of grid) expect(ell(g)).toBeLessThanOrEqual(ell(t.answer) + 1e-6);

      const l = make("stat.log-likelihood", s);
      if (l.kind !== "numeric") throw new Error("ожидалось число");
      const [n2, k2] = /\$(\d+)\$ бросков монеты, орлов — \$(\d+)\$/.exec(l.prompt)!.slice(1).map(Number) as [number, number];
      const phi = Number(/при \$\\phi = ([\d.]+)\$/.exec(l.prompt)![1]);
      expect(l.answer).toBeCloseTo(k2 * Math.log(phi) + (n2 - k2) * Math.log(1 - phi), 3);
    }
  });

  it("stat.cov-mle: Σ̂ = (1/n) Σ (x − x̄)(x − x̄)ᵀ, симметрична; stat.gda-mle — доли, средние, общая дисперсия", () => {
    for (let s = 1; s <= 30; s++) {
      const t = make("stat.cov-mle", s);
      if (t.kind !== "matrix") throw new Error("ожидалась матрица");
      const pts = [...t.prompt.matchAll(/\((-?\d+), (-?\d+)\)/g)].map((m) => [Number(m[1]), Number(m[2])] as [number, number]);
      expect(pts).toHaveLength(4);
      const mu = [0, 1].map((j) => pts.reduce((a, p) => a + p[j]!, 0) / 4);
      for (const a of [0, 1]) for (const b of [0, 1]) expect(t.answer[a]![b]!).toBeCloseTo(pts.reduce((acc, p) => acc + (p[a]! - mu[a]!) * (p[b]! - mu[b]!), 0) / 4, 3);
      expect(t.answer[0]![1]).toBe(t.answer[1]![0]);
      expect(Number.isInteger(mu[0]) && Number.isInteger(mu[1])).toBe(true);

      const g = make("stat.gda-mle", s);
      if (g.kind !== "numeric") throw new Error("ожидалось число");
      const [x0, x1] = [...g.prompt.matchAll(/— \$x = ([\d, ]+)\$/g)].map((m) => m[1]!.split(", ").map(Number)) as [number[], number[]];
      const n = x0.length + x1.length;
      const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
      const pooled = (x0.reduce((a, v) => a + (v - mean(x0)) ** 2, 0) + x1.reduce((a, v) => a + (v - mean(x1)) ** 2, 0)) / n;
      const want = g.prompt.includes("hat\\phi") ? x1.length / n : g.prompt.includes("hat\\mu_1") ? mean(x1) : pooled;
      expect(g.answer).toBeCloseTo(want, 3);
    }
  });

  it("stat.natural-param и stat.log-partition: ответы через численные производные a(η)", () => {
    const d = (f: (e: number) => number, e: number, h = 1e-4) => (f(e + h) - f(e - h)) / (2 * h);
    for (let s = 1; s <= 30; s++) {
      const n = make("stat.natural-param", s);
      if (n.kind !== "numeric") throw new Error("ожидалось число");
      if (n.prompt.includes("Бернулли с")) {
        const phi = Number(/phi = ([\d.]+)\$/.exec(n.prompt)![1]);
        expect(1 / (1 + Math.exp(-n.answer))).toBeCloseTo(phi, 3);
      } else if (n.prompt.includes("Найдите $\\phi")) {
        const eta = Number(/eta = (-?[\d.]+)\$/.exec(n.prompt)![1]);
        expect(Math.log(n.answer / (1 - n.answer))).toBeCloseTo(eta, 2);
      } else {
        const lam = Number(/lambda = ([\d.]+)\$/.exec(n.prompt)![1]);
        expect(Math.exp(n.answer)).toBeCloseTo(lam, 2);
      }

      const l = make("stat.log-partition", s);
      if (l.kind !== "numeric") throw new Error("ожидалось число");
      const eta = Number(/При \$\\eta = (-?[\d.]+)\$/.exec(l.prompt)![1]);
      const a = l.prompt.includes("Бернулли") ? (e: number) => Math.log(1 + Math.exp(e)) : (e: number) => Math.exp(e);
      const want = l.prompt.includes("Var") ? d((e) => d(a, e), eta) : d(a, eta);
      expect(Math.abs(l.answer - want)).toBeLessThan(0.002);
    }
  });

  it("stat.beta-update: среднее и мода апостериорного Beta; stat.ridge-map: λ = σ²/τ² и минимум одномерного ridge", () => {
    for (let s = 1; s <= 30; s++) {
      const t = make("stat.beta-update", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const [a, b] = /Beta\}\((\d+), (\d+)\)\$\. Монету/.exec(t.prompt)!.slice(1).map(Number) as [number, number];
      const [n, k] = /бросили \$(\d+)\$ раз, орлов — \$(\d+)\$/.exec(t.prompt)!.slice(1).map(Number) as [number, number];
      // плотность апостериорного на сетке: максимум — MAP, первый момент — среднее
      const grid = Array.from({ length: 9999 }, (_, i) => (i + 1) / 10000);
      const logp = (p: number) => (k + a - 1) * Math.log(p) + (n - k + b - 1) * Math.log(1 - p);
      if (t.prompt.includes("среднее")) {
        const w = grid.map((p) => Math.exp(logp(p)));
        const z = w.reduce((u, v) => u + v, 0);
        expect(Math.abs(t.answer - grid.reduce((u, p, i) => u + p * w[i]!, 0) / z)).toBeLessThan(0.002);
      } else if (k + a > 1 && n - k + b > 1) {
        const best = grid.reduce((u, p) => (logp(p) > logp(u) ? p : u), grid[0]!);
        expect(Math.abs(t.answer - best)).toBeLessThan(0.002);
      }

      const r = make("stat.ridge-map", s);
      if (r.kind !== "numeric") throw new Error("ожидалось число");
      const [s2, t2] = /mathcal\{N\}\(0, (\d+)\)\$, априорное (?:весов )?\$\\theta \\sim \\mathcal\{N\}\(0, ([\d.]+)/.exec(r.prompt)!.slice(1).map(Number) as [number, number];
      if (r.prompt.includes("Найдите $\\lambda")) expect(r.answer).toBeCloseTo(s2 / t2, 3);
      else {
        const sxy = Number(/y\^\{\(i\)\} = (\d+)\$/.exec(r.prompt)![1]);
        const sxx = Number(/\^2 = (\d+)\$/.exec(r.prompt)![1]);
        const J = (th: number) => (sxx * th * th - 2 * sxy * th) / (2 * s2) + (th * th) / (2 * t2);
        expect(J(r.answer)).toBeLessThanOrEqual(Math.min(J(r.answer + 0.01), J(r.answer - 0.01)) + 1e-9);
      }
    }
  });

  it("stat.pred-error: три слагаемых ошибки; stat.kfold: среднее по частям и число обучений", () => {
    for (let s = 1; s <= 30; s++) {
      const t = make("stat.pred-error", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const nums = [...t.prompt.matchAll(/= (0\.\d+)\$/g)].map((m) => Number(m[1]));
      // нечётный: σ², смещение², разброс → сумма; чётный: σ², ошибка, разброс → смещение²
      if (s % 2 === 1) expect(t.answer).toBeCloseTo(nums[0]! + nums[1]! + nums[2]!, 6);
      else expect(t.answer + nums[0]! + nums[2]!).toBeCloseTo(nums[1]!, 6);

      const c = make("stat.kfold", s);
      if (c.kind !== "numeric") throw new Error("ожидалось число");
      const k = Number(/(\d)-кратн/.exec(c.prompt)![1]);
      if (s % 2 === 1) {
        const errs = /отложенной: \$([^$]+)\$/.exec(c.prompt)![1]!.split(", ").map(Number);
        expect(errs).toHaveLength(k);
        expect(c.answer).toBeCloseTo(errs.reduce((a, b) => a + b, 0) / k, 4);
      } else expect(c.answer).toBe(Number(/Сравниваем (\d+)/.exec(c.prompt)![1]) * k + 1);
    }
  });

  it("stat.ci-mean: граница x̄ ± z σ/√n; stat.p-value: доля при H₀ не реже наблюдаемого; stat.fwer: 1 − (1 − α)^m и α/m", () => {
    for (let s = 1; s <= 30; s++) {
      const c = make("stat.ci-mean", s);
      if (c.kind !== "numeric") throw new Error("ожидалось число");
      const [n, mean, sigma] = /n = (\d+)\$ наблюдений \$\\bar x = ([\d.]+)\$, стандартное отклонение известно: \$\\sigma = (\d+)/.exec(c.prompt)!.slice(1).map(Number) as [number, number, number];
      const z = Number(/z = ([\d.]+)/.exec(c.prompt)![1]);
      expect(Math.abs(c.answer - mean)).toBeCloseTo((z * sigma) / Math.sqrt(n), 3);
      expect(c.answer > mean).toBe(c.prompt.includes("верхнюю"));

      const p = make("stat.p-value", s);
      if (p.kind !== "numeric") throw new Error("ожидалось число");
      const [mu0, sg, nn, xb] = /mu = (\d+)\$, \$\\sigma = (\d+)\$ известна\. По \$n = (\d+)\$ наблюдениям \$\\bar x = ([\d.]+)/.exec(p.prompt)!.slice(1).map(Number) as [number, number, number, number];
      // моделирование при H₀: доля |Z| не меньше наблюдаемого
      const r = rng(s);
      const zObs = Math.abs(xb - mu0) / (sg / Math.sqrt(nn));
      let hits = 0;
      for (let i = 0; i < 20000; i++) if (Math.abs(gaussian(r)) >= zObs) hits++;
      expect(Math.abs(p.answer - hits / 20000)).toBeLessThan(0.012);

      const f = make("stat.fwer", s);
      if (f.kind !== "numeric") throw new Error("ожидалось число");
      const m = Number(/(\d+) (?:независимых гипотез|признаков)/.exec(f.prompt)![1]);
      const al = Number(/(0\.0\d)/.exec(f.prompt)![1]);
      expect(f.answer).toBeCloseTo(s % 2 === 1 ? 1 - (1 - al) ** m : al / m, 4);
    }
  });

  it("ml.rmse-mae: RMSE и MAE по ошибкам, RMSE ≥ MAE; ml.best-constant: среднее для MSE, медиана для MAE (перебором)", () => {
    for (let s = 1; s <= 30; s++) {
      const t = make("ml.rmse-mae", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const e = /\$([^$]+)\$\. Найдите/.exec(t.prompt)![1]!.split(";\\ ").map((v) => Number(v.replace("−", "-")));
      const rmse = Math.sqrt(e.reduce((a, v) => a + v * v, 0) / e.length);
      const mae = e.reduce((a, v) => a + Math.abs(v), 0) / e.length;
      expect(t.answer).toBeCloseTo(t.prompt.includes("RMSE.") ? rmse : mae, 3);
      expect(rmse).toBeGreaterThanOrEqual(mae - 1e-12);

      const c = make("ml.best-constant", s);
      if (c.kind !== "numeric") throw new Error("ожидалось число");
      const y = /млн ₽: \$([^$]+)\$/.exec(c.prompt)![1]!.split(",\\ ").map(Number);
      const loss = (k: number) => y.reduce((a, v) => a + (c.prompt.includes("MAE") ? Math.abs(v - k) : (v - k) ** 2), 0);
      const grid = Array.from({ length: 4001 }, (_, i) => i / 100);
      const best = grid.reduce((a, k) => (loss(k) < loss(a) - 1e-12 ? k : a), 0);
      expect(Math.abs(c.answer - best)).toBeLessThan(0.011);
    }
  });

  it("ml.lms-update: шаг LMS совпадает с шагом по градиенту J⁽ⁱ⁾; ml.step-scale: порог по λ_max; ml.standardize-back: та же модель", () => {
    const nums = (t: string) => t.replace(/−/g, "-");
    for (let s = 1; s <= 30; s++) {
      const u = make("ml.lms-update", s);
      if (u.kind !== "numeric") throw new Error("ожидалось число");
      const p = nums(u.prompt);
      const [t0, t1] = /\(([-\d.]+),\\ ([-\d.]+)\)/.exec(p)!.slice(1).map(Number) as [number, number];
      const x = Number(/x\^\{\(i\)\} = ([-\d.]+)/.exec(p)![1]);
      const y = Number(/y\^\{\(i\)\} = ([-\d.]+)/.exec(p)![1]);
      const a = Number(/alpha = ([\d.]+)/.exec(p)![1]);
      // градиент J⁽ⁱ⁾ = ½(h − y)² конечными разностями
      const J = (q0: number, q1: number) => 0.5 * (q0 + q1 * x - y) ** 2;
      const h = 1e-6;
      const g = [(J(t0 + h, t1) - J(t0 - h, t1)) / (2 * h), (J(t0, t1 + h) - J(t0, t1 - h)) / (2 * h)];
      const j = /theta_1\$ после/.test(p) ? 1 : 0;
      expect(u.answer).toBeCloseTo([t0, t1][j]! - a * g[j]!, 4);

      const sc = make("ml.step-scale", s);
      if (sc.kind !== "numeric") throw new Error("ожидалось число");
      const limit = Number(/alpha < ([\d.]+)/.exec(sc.prompt)![1]);
      // случайная X 30×2, нормированная так, что 2/λ_max(XᵀX/n) = limit
      const r = rng(s);
      const X = Array.from({ length: 30 }, () => [r.next() * 2 - 1, r.next() * 3]);
      const lmax = (M: number[][], div: number) => {
        const [a11, a12, a22] = [0, 1, 3].map((k) => M.reduce((acc, row) => acc + row[k >> 1]! * row[k & 1]!, 0) / div) as [number, number, number];
        return (a11 + a22) / 2 + Math.hypot((a11 - a22) / 2, a12);
      };
      const c = Math.sqrt(lmax(X, 30) * limit / 2);
      const Xn = X.map((row) => row.map((v) => v / c));
      expect(2 / lmax(Xn, 30)).toBeCloseTo(limit, 9);
      const k = /умножили на (\d+)/.exec(sc.prompt);
      const n = /n = (\d+)\$ объектах/.exec(sc.prompt);
      const want = k ? 2 / lmax(Xn.map((row) => row.map((v) => v * Number(k[1]))), 30) : 2 / (lmax(Xn, 30) * Number(n![1]));
      expect(sc.answer).toBeCloseTo(want, 6);

      const b = make("ml.standardize-back", s);
      if (b.kind !== "numeric") throw new Error("ожидалось число");
      const q = nums(b.prompt);
      const mu = Number(/mu = (\d+)/.exec(q)![1]);
      const sd = Number(/s = (\d+)\$ м²,/.exec(q)![1]);
      const [p0, p1] = /h\(z\) = ([-\d.]+) \+ ([-\d.]+)/.exec(q)!.slice(1).map(Number) as [number, number];
      const hz = (area: number) => p0 + (p1 * (area - mu)) / sd;
      const slope = (hz(100) - hz(0)) / 100;
      expect(b.answer).toBeCloseTo(/theta_1\$\.$/.test(q) ? slope : hz(0), 4);
    }
  });

  it("ml.lwr-weight: вес по расстоянию и τ из условия; ml.feature-count: перебор столбцов", () => {
    for (let s = 1; s <= 30; s++) {
      const t = make("ml.lwr-weight", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const tau = Number(/tau = (\d+)\$/.exec(t.prompt)![1]);
      const q = Number(/\$x = (\d+)\$/.exec(t.prompt)![1]);
      const xi = Number(/x\^\{\(i\)\} = ([\d.]+)\$/.exec(t.prompt)![1]);
      expect(t.answer).toBeCloseTo(Math.exp(-((xi - q) ** 2) / (2 * tau * tau)), 4);

      const c = make("ml.feature-count", s);
      if (c.kind !== "numeric") throw new Error("ожидалось число");
      const p = /p = (\d+)\$/.exec(c.prompt);
      if (p) expect(c.answer).toBe(Number(p[1]) + 1);
      else {
        const d = Number(/d = (\d+)\$/.exec(c.prompt)![1]);
        const cols = new Set<string>(["1"]);
        for (let j = 0; j < d; j++) for (let k = j - 1; k < d; k++) cols.add(k < j ? `x${j}` : `x${j}x${k}`);
        expect(c.answer).toBe(cols.size);
      }
    }
  });

  it("ml.logistic-prob: g(θᵀx) по условию; ml.odds-factor: отношение шансов при p из модели", () => {
    const nums = (t: string) => t.replace(/−/g, "-");
    for (let s = 1; s <= 30; s++) {
      const t = make("ml.logistic-prob", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const p = nums(t.prompt);
      const th = /\\theta = \(([-\d.]+),\\ ([-\d.]+),\\ ([-\d.]+)\)/.exec(p)!.slice(1).map(Number);
      const x1 = Number(/x_1 = ([-\d.]+)\$/.exec(p)![1]);
      const x2 = Number(/x_2 = ([-\d.]+)\$/.exec(p)![1]);
      expect(t.answer).toBeCloseTo(1 / (1 + Math.exp(-(th[0]! + th[1]! * x1 + th[2]! * x2))), 4);

      const o = make("ml.odds-factor", s);
      if (o.kind !== "numeric") throw new Error("ожидалось число");
      const q = nums(o.prompt);
      const w = Number(/theta_j = ([-\d.]+)\$/.exec(q)![1]);
      const k = Number(/на (\d) больше/.exec(q)![1]);
      const odds = (z: number) => { const pr = 1 / (1 + Math.exp(-z)); return pr / (1 - pr); };
      expect(o.answer).toBeCloseTo(odds(0.3 + k * w) / odds(0.3), 3);
    }
  });

  it("ml.softmax-prob: вероятность по логитам; ml.perceptron-update: поправка только на ошибке", () => {
    const nums = (t: string) => t.replace(/−/g, "-");
    for (let s = 1; s <= 30; s++) {
      const t = make("ml.softmax-prob", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const p = nums(t.prompt);
      const logits = /t = \(([^)]+)\)/.exec(p)![1]!.split(",\\ ").map(Number);
      const j = ["эконом", "комфорт", "бизнес"].indexOf(/сегмента «([^»]+)»\?/.exec(p)![1]!);
      const z = logits.reduce((a, v) => a + Math.exp(v), 0);
      expect(t.answer).toBeCloseTo(Math.exp(logits[j]!) / z, 4);

      const u = make("ml.perceptron-update", s);
      if (u.kind !== "numeric") throw new Error("ожидалось число");
      const q = nums(u.prompt);
      const th = /theta = \(([^)]+)\)/.exec(q)![1]!.split(",\\ ").map(Number);
      const x = /x = \(([^)]+)\)/.exec(q)![1]!.split(",\\ ").map(Number);
      const y = Number(/y = (\d)\$/.exec(q)![1]);
      const k = Number(/theta_(\d)\$ после/.exec(q)![1]);
      const h = th.reduce((a, v, i) => a + v * x[i]!, 0) >= 0 ? 1 : 0;
      expect(u.answer).toBeCloseTo(th[k]! + (y - h) * x[k]!, 6);
    }
  });

  it("ml.poisson-predict: λ = exp(θᵀx) и множитель e^(kθ₁) по условию", () => {
    for (let s = 1; s <= 30; s++) {
      const t = make("ml.poisson-predict", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const p = t.prompt.replace(/−/g, "-");
      const add = /добавили (\d) фото/.exec(p);
      if (add) {
        const t1 = Number(/theta_1 = ([\d.]+)\$/.exec(p)![1]);
        const lam = (photos: number) => Math.exp(0.3 + t1 * photos - 2 * 0.1);
        expect(t.answer).toBeCloseTo(lam(4 + Number(add[1])) / lam(4), 3);
      } else {
        const th = /theta = \(([-\d.]+),\\ ([-\d.]+),\\ ([-\d.]+)\)/.exec(p)!.slice(1).map(Number);
        const x1 = Number(/x_1 = (\d+)\$/.exec(p)![1]);
        const x2 = Number(/x_2 = ([\d.]+)\$/.exec(p)![1]);
        expect(t.answer).toBeCloseTo(Math.exp(th[0]! + th[1]! * x1 + th[2]! * (x2 - 1)), 3);
      }
    }
  });

  it("ml.precision-prevalence: точность по Байесу на счётчиках; ml.cost-threshold: порог — перебором цены", () => {
    for (let s = 1; s <= 30; s++) {
      const t = make("ml.precision-prevalence", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const phi = Number(/Положительных ([\d.]+) %/.exec(t.prompt)![1]) / 100;
      const tpr = Number(/TPR\} = ([\d.]+)\$/.exec(t.prompt)![1]);
      const f = Number(/FPR\} = ([\d.]+)\$/.exec(t.prompt)![1]);
      const n = 1e6;
      expect(t.answer).toBeCloseTo((phi * n * tpr) / (phi * n * tpr + (1 - phi) * n * f), 4);

      const c = make("ml.cost-threshold", s);
      if (c.kind !== "numeric") throw new Error("ожидалось число");
      const call = Number(/стоит (\d+) ₽/.exec(c.prompt)![1]);
      const gain = Number(/приносит банку (\d+) ₽/.exec(c.prompt)![1]);
      // наименьшая p на сетке, при которой ожидаемая выгода звонка p · gain − call неотрицательна
      const grid = Array.from({ length: 100001 }, (_, k) => k / 100000);
      expect(Math.abs(grid.find((p) => p * gain - call >= -1e-12)! - c.answer)).toBeLessThan(1e-4);
    }
  });

  it("ml.ols-variance: σ²·tr H / n по настоящей матрице проектора (и плюс σ², если спрашивают ошибку)", () => {
    for (let s = 1; s <= 30; s++) {
      const t = make("ml.ols-variance", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const d = Number(/d = (\d+)\$/.exec(t.prompt)![1]);
      const n = Number(/n = (\d+)\$/.exec(t.prompt)![1]);
      const sigma = Number(/sigma = ([\d.]+)\$/.exec(t.prompt)![1]);
      // след проектора на столбцы d первых степеней через Грама–Шмидта: число ненулевых направлений
      const xs = Array.from({ length: n }, (_, i) => -1 + (2 * i) / (n - 1));
      const basis: number[][] = [];
      for (let k = 0; k < d; k++) {
        let v = xs.map((x) => x ** k);
        for (const b of basis) {
          const c = v.reduce((a, vi, i) => a + vi * b[i]!, 0);
          v = v.map((vi, i) => vi - c * b[i]!);
        }
        const nv = Math.hypot(...v);
        basis.push(v.map((vi) => vi / nv));
      }
      const trace = xs.reduce((a, _, i) => a + basis.reduce((s2, b) => s2 + b[i]! ** 2, 0), 0);
      const v = (sigma * sigma * trace) / n;
      expect(t.answer).toBeCloseTo(t.prompt.includes("ожидаемая ошибка") ? sigma * sigma + v : v, 5);
    }
  });

  it("ml.shrink-orth: ответ — минимум штрафованной функции одной переменной (перебор по сетке)", () => {
    for (let s = 1; s <= 30; s++) {
      const t = make("ml.shrink-orth", s);
      if (t.kind !== "numeric") throw new Error("ожидалось число");
      const p = t.prompt.replace(/−/g, "-");
      const z = Number(/hat\\theta_j = ([-\d.]+)\$/.exec(p)![1]);
      const lam = Number(/lambda = ([\d.]+)\$\?/.exec(p)![1]);
      const l1 = p.includes("лассо");
      // при XᵀX = I задача распадается: ½(θ − z)² + штраф
      const f = (th: number) => 0.5 * (th - z) ** 2 + (l1 ? lam * Math.abs(th) : 0.5 * lam * th * th);
      let best = 0;
      for (let k = -40000; k <= 40000; k++) if (f(k / 10000) < f(best)) best = k / 10000;
      expect(Math.abs(t.answer - best)).toBeLessThan(2e-4);
    }
  });

  it("все тексты задач разбираются KaTeX", () => {
    const texts = (sp: ExerciseSpec) => [
      sp.prompt,
      ...(sp.hints ?? []),
      sp.right ?? "",
      sp.wrong ?? "",
      ...("label" in sp && sp.label ? [sp.label] : []),
      ...("options" in sp ? sp.options.flatMap((o) => [o.text, o.why]) : []),
      ...("reveal" in sp ? [sp.reveal] : []),
      ...("steps" in sp ? sp.steps : []),
    ];
    for (const g of generators.values()) {
      for (let s = 1; s <= 12; s++) for (const t of texts(g.make(s))) expect(() => renderInline(t), `${g.id}, seed ${s}: ${t}`).not.toThrow();
    }
    // работа растёт с каждым генератором: тысячи вызовов KaTeX под нагрузкой (e2e рядом, CI) не укладываются в 5 секунд
  }, 30_000);

  it("неизвестный генератор — понятная ошибка", () => {
    expect(() => generator("la.nope")).toThrow("нет генератора задач «la.nope»");
  });
});

describe("ГПСЧ", () => {
  it("воспроизводим и равномерен в пределах", () => {
    const a = rng(7);
    const b = rng(7);
    const xs = Array.from({ length: 1000 }, () => a.int(1, 6));
    expect(xs).toEqual(Array.from({ length: 1000 }, () => b.int(1, 6)));
    expect(Math.min(...xs)).toBe(1);
    expect(Math.max(...xs)).toBe(6);
    expect(rng(3).nonzero(-1, 1)).not.toBe(0);
  });
});
