// Движок упражнений: разбор чисел (точка и запятая), проверки всех типов, генераторы с seed, ГПСЧ.
import { describe, expect, it } from "vitest";
import { rng } from "../math/rng";
import { checkMatrix, checkNumeric, checkOrder, closeEnough, scrambled } from "./check";
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
