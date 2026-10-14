/* Прототип урока «Основ ML» 2.1: виджет «Порог классификатора» и задача «Цена ошибки».
   Данные — window.THRESHOLD_DATA (scripts/export_widget_data.py из code/snippets/ml_basics/threshold.py);
   числа урока проверяет code/tests/test_threshold.py. */
(() => {

const symMacro = (slot, name, tex) => `\\htmlData{sym=${name}}{\\htmlClass{sym s${slot}}{${tex}}}`;
// Символы урока: оценка — данные, порог — параметр, метка — ответ
window.LESSON_MACROS = {
  "\\sc": symMacro(1, "p", "p"),
  "\\thr": symMacro(2, "t", "t"),
  "\\y": symMacro(3, "y", "y"),
};
window.LESSON_SYMBOLS = {
  p: { tex: "p", slot: 1, meaning: "Оценка модели: вероятность дефолта для заявки", shape: "число от 0 до 1" },
  t: { tex: "t", slot: 2, meaning: "Порог: отказываем, если p ≥ t", shape: "число от 0 до 1" },
  y: { tex: "y", slot: 3, meaning: "Истинная метка: 1 — дефолт, 0 — кредит вернули", shape: "0 или 1" },
};

const COST = { fp: 1, fn: 5 };
const SVGNS = "http://www.w3.org/2000/svg";
const el = (name, attrs = {}, parent) => {
  const e = document.createElementNS(SVGNS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.append(e);
  return e;
};
const fmt = (v, d = 3) => (Number.isFinite(v) ? v.toFixed(d) : "—");

function confusion(s, y, t) {
  const c = { tp: 0, fp: 0, fn: 0, tn: 0 };
  for (let i = 0; i < s.length; i++) {
    const reject = s[i] >= t;
    if (reject) y[i] ? c.tp++ : c.fp++;
    else y[i] ? c.fn++ : c.tn++;
  }
  return c;
}
const costOf = (c) => COST.fn * c.fn + COST.fp * c.fp;

/* Общее состояние порога: все виджеты урока подписаны на него (связанные представления) */
const thresholdState = {
  t: 0.5,
  subs: [],
  set(t) {
    this.t = Math.min(1, Math.max(0, Math.round(t * 1000) / 1000));
    this.subs.forEach((f) => f(this.t));
  },
};

function initThresholdStrip(fig, s, y) {
  const svg = fig.querySelector("[data-strip]");
  // viewBox по ширине контейнера: на телефоне подписи не мельчают
  const W = svg.clientWidth && svg.clientWidth < 520 ? 400 : 640;
  svg.setAttribute("viewBox", `0 0 ${W} 220`);
  const x0 = 64, x1 = W - 20;
  const X = (p) => x0 + p * (x1 - x0);
  const rows = { 1: 62, 0: 140 }, band = 30;
  const defs = el("defs", {}, svg);
  const pat = el("pattern", { id: "hatch", width: 8, height: 8, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs);
  el("line", { x1: 0, y1: 0, x2: 0, y2: 8, class: "hatch-line" }, pat);
  // клетка рисунка и ось
  for (let p = 0; p <= 1.0001; p += 0.1) el("line", { x1: X(p), x2: X(p), y1: 24, y2: 180, class: "grid-line" }, svg);
  el("line", { x1: x0, x2: x1, y1: 180, y2: 180, class: "axis" }, svg);
  for (let p = 0; p <= 1.0001; p += 0.2) {
    el("line", { x1: X(p), x2: X(p), y1: 180, y2: 186, class: "axis" }, svg);
    el("text", { x: X(p), y: 201, "text-anchor": "middle", class: "tick" }, svg).textContent = p.toFixed(1);
  }
  const axisLabel = el("text", { x: x1, y: 214, "text-anchor": "end", class: "axis-label" }, svg);
  axisLabel.textContent = "p";
  const zone = el("rect", { y: 24, height: 156, class: "zone", fill: "url(#hatch)" }, svg);
  el("text", { x: x0 - 10, y: rows[1] + 4, "text-anchor": "end", class: "row-label" }, svg).textContent = "дефолт";
  el("text", { x: x0 - 10, y: rows[0] + 4, "text-anchor": "end", class: "row-label" }, svg).textContent = "вернул";
  // точки: детерминированный разброс по вертикали внутри полосы
  const dots = s.map((p, i) => {
    const jitter = (((i * 37) % 23) / 22 - 0.5) * band;
    return el("circle", { cx: X(p), cy: rows[y[i]] + jitter, r: 4.2, class: y[i] ? "dot dot--pos" : "dot dot--neg" }, svg);
  });
  const line = el("line", { y1: 18, y2: 180, class: "thr-line" }, svg);
  const handle = el("circle", { cy: 18, r: 7, class: "thr-handle" }, svg);
  const label = el("text", { y: 12, class: "thr-label" }, svg);

  const live = fig.querySelector("[data-live]");
  let liveTimer;
  const render = (t) => {
    const xt = X(t);
    zone.setAttribute("x", xt); zone.setAttribute("width", Math.max(0, x1 - xt));
    line.setAttribute("x1", xt); line.setAttribute("x2", xt);
    handle.setAttribute("cx", xt);
    label.setAttribute("x", xt + (t > 0.8 ? -10 : 10));
    label.setAttribute("text-anchor", t > 0.8 ? "end" : "start");
    label.textContent = `t = ${t.toFixed(2)}`;
    dots.forEach((d, i) => d.classList.toggle("dot--err", (s[i] >= t) !== Boolean(y[i])));
    const c = confusion(s, y, t);
    const precision = c.tp + c.fp ? c.tp / (c.tp + c.fp) : NaN;
    const recall = c.tp / (c.tp + c.fn), fpr = c.fp / (c.fp + c.tn), acc = (c.tp + c.tn) / s.length;
    // числа матрицы ошибок нужны и на рисунке 2 (формула цены), поэтому — по всей странице
    const set = (sel, v) => document.querySelectorAll(sel).forEach((n) => (n.textContent = v));
    for (const k of ["tp", "fp", "fn", "tn"]) set(`[data-c="${k}"]`, c[k]);
    set('[data-m="precision"]', fmt(precision)); set('[data-m="recall"]', fmt(recall));
    set('[data-m="fpr"]', fmt(fpr)); set('[data-m="accuracy"]', fmt(acc, 2));
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => {
      live.textContent = `Порог ${t.toFixed(2)}: отказов ${c.tp + c.fp}, пропущенных дефолтов ${c.fn}, лишних отказов ${c.fp}. Точность ${fmt(precision)}, полнота ${fmt(recall)}.`;
    }, 400);
  };
  thresholdState.subs.push(render);

  // перетаскивание линии порога (альтернатива — ползунок, WCAG 2.5.7)
  const toT = (ev) => {
    const r = svg.getBoundingClientRect();
    const xv = ((ev.clientX - r.left) / r.width) * W;
    return (xv - x0) / (x1 - x0);
  };
  let dragging = false;
  svg.addEventListener("pointerdown", (ev) => { dragging = true; svg.setPointerCapture(ev.pointerId); thresholdState.set(toT(ev)); });
  svg.addEventListener("pointermove", (ev) => { if (dragging) thresholdState.set(toT(ev)); });
  svg.addEventListener("pointerup", () => (dragging = false));
  svg.addEventListener("pointercancel", () => (dragging = false));
}

function rocPoints(s, y) {
  const idx = s.map((_, i) => i).sort((a, b) => s[b] - s[a]);
  const P = y.reduce((a, v) => a + v, 0), N = y.length - P;
  const pts = [[0, 0]];
  let tp = 0, fp = 0;
  for (let k = 0; k < idx.length; k++) {
    const i = idx[k];
    y[i] ? tp++ : fp++;
    if (k === idx.length - 1 || s[idx[k + 1]] !== s[i]) pts.push([fp / N, tp / P]);
  }
  return pts;
}

function initRoc(fig, s, y) {
  const svg = fig.querySelector("[data-roc]");
  const L = 56, T = 16, S = 268;
  const X = (v) => L + v * S, Y = (v) => T + (1 - v) * S;
  for (let v = 0; v <= 1.0001; v += 0.1) {
    el("line", { x1: X(v), x2: X(v), y1: T, y2: T + S, class: "grid-line" }, svg);
    el("line", { x1: L, x2: L + S, y1: Y(v), y2: Y(v), class: "grid-line" }, svg);
  }
  el("rect", { x: L, y: T, width: S, height: S, class: "frame" }, svg);
  for (const v of [0, 0.5, 1]) {
    el("text", { x: X(v), y: T + S + 18, "text-anchor": "middle", class: "tick" }, svg).textContent = v.toFixed(1);
    el("text", { x: L - 8, y: Y(v) + 4, "text-anchor": "end", class: "tick" }, svg).textContent = v.toFixed(1);
  }
  el("text", { x: L + S, y: T + S + 36, "text-anchor": "end", class: "axis-name" }, svg).textContent = "доля ложных отказов (FPR)";
  const yl = el("text", { x: 14, y: T + S, class: "axis-name", transform: `rotate(-90 14 ${T + S})` }, svg);
  yl.textContent = "полнота (TPR)";
  el("line", { x1: X(0), y1: Y(0), x2: X(1), y2: Y(1), class: "diag" }, svg);
  const pts = rocPoints(s, y);
  el("polyline", { points: pts.map(([a, b]) => `${X(a)},${Y(b)}`).join(" "), class: "roc-line" }, svg);
  el("text", { x: X(0.58), y: Y(0.3), class: "roc-auc" }, svg).textContent = "AUC = 0.848";
  const pt = el("circle", { r: 6, class: "roc-point" }, svg);
  const P = y.reduce((a, v) => a + v, 0), N = y.length - P;
  thresholdState.subs.push((t) => {
    const c = confusion(s, y, t);
    pt.setAttribute("cx", X(c.fp / N)); pt.setAttribute("cy", Y(c.tp / P));
    fig.querySelectorAll("[data-cost]").forEach((n) => (n.textContent = costOf(c)));
  });
}

function costCurve(fig, s, y) {
  const svg = fig.querySelector("[data-cost-curve]");
  if (svg.childElementCount) return;
  const L = 34, T = 10, Wd = 196, Hd = 104;
  const ts = [...new Set(s)].sort((a, b) => a - b).concat([1.001]);
  const costs = ts.map((t) => costOf(confusion(s, y, t)));
  const maxC = Math.max(...costs);
  const X = (t) => L + Math.min(t, 1) * Wd, Y = (c) => T + (1 - c / maxC) * Hd;
  for (let v = 0; v <= 1.0001; v += 0.2) el("line", { x1: X(v), x2: X(v), y1: T, y2: T + Hd, class: "grid-line" }, svg);
  el("line", { x1: L, x2: L + Wd, y1: T + Hd, y2: T + Hd, class: "axis" }, svg);
  for (const v of [0, 0.5, 1]) el("text", { x: X(v), y: T + Hd + 16, "text-anchor": "middle", class: "tick" }, svg).textContent = v.toFixed(1);
  el("text", { x: L - 6, y: T + 10, "text-anchor": "end", class: "tick" }, svg).textContent = maxC;
  el("polyline", { points: ts.map((t, i) => `${X(t)},${Y(costs[i])}`).join(" "), class: "cost-line" }, svg);
  const i = costs.indexOf(Math.min(...costs));
  el("circle", { cx: X(ts[i]), cy: Y(costs[i]), r: 5, class: "cost-min" }, svg);
  el("text", { x: L, y: T + Hd + 38, class: "cost-label" }, svg).textContent = `минимум ${costs[i]} при t = ${ts[i]}`;
  svg.removeAttribute("hidden"); // у SVG нет свойства hidden — снимаем атрибут
}

function initCostExercise(ex, fig, s, y) {
  const input = ex.querySelector("input"), out = ex.querySelector("[data-feedback]");
  const ts = [...new Set(s)].concat([1.001]);
  const best = Math.min(...ts.map((t) => costOf(confusion(s, y, t))));
  ex.querySelector("[data-hint]").addEventListener("click", () => {
    const h = ex.querySelector("[data-hint-text]"); h.hidden = false; window.renderMath?.(h);
  });
  ex.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = parseFloat(input.value.replace(",", "."));
    if (!Number.isFinite(v) || v < 0 || v > 1) {
      out.hidden = false; out.className = "feedback feedback--wrong";
      out.querySelector("b").textContent = "Нужно число от 0 до 1.";
      out.querySelector("span").textContent = "Например, 0.3.";
      return;
    }
    const cost = costOf(confusion(s, y, v));
    const ok = cost <= best * 1.04; // в пределах 4% от минимума на этих данных
    input.classList.toggle("is-right", ok); input.classList.toggle("is-wrong", !ok);
    out.hidden = false;
    out.className = `feedback ${ok ? "feedback--right" : "feedback--wrong"}`;
    out.querySelector("b").textContent = ok ? "Верно." : "Пока дорого.";
    out.querySelector("span").textContent = ok
      ? `Цена ${cost}. Минимум на этих данных — ${best} при t = 0.181; теория даёт t = 1/6 ≈ 0.167 и цену 125. Порог 0.5 обходится в 260.`
      : `При пороге ${v} цена ${cost}, а можно получить ${best}. Сравните, во что обходится выдача и отказ при вероятности p.`;
    thresholdState.set(v);
    if (ok) costCurve(fig, s, y);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const D = window.THRESHOLD_DATA;
  const strip = document.querySelector("[data-threshold]");
  if (!D || !strip) return;
  const { scores: s, y } = D;
  initThresholdStrip(strip, s, y);
  const roc = document.querySelector("[data-threshold-roc]");
  if (roc) initRoc(roc, s, y);
  // все ползунки порога синхронны
  const sliders = [...document.querySelectorAll("input[data-t]")];
  sliders.forEach((sl) => sl.addEventListener("input", () => thresholdState.set(+sl.value)));
  thresholdState.subs.push((t) => {
    sliders.forEach((sl) => { if (+sl.value !== t) sl.value = t; });
    document.querySelectorAll("[data-t-value]").forEach((n) => (n.textContent = t.toFixed(2)));
  });
  const ex = document.querySelector("[data-cost-exercise]");
  if (ex && roc) initCostExercise(ex, roc, s, y);
  thresholdState.set(0.5);
  if (new URLSearchParams(location.search).get("demo") === "1" && roc) {
    thresholdState.set(0.3);
    costCurve(roc, s, y);
  }
});
})();
