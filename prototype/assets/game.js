/*
 * Игра «Матрица-пазл». Чистая модель (уровни, применение матрицы, проверка) отделена от отрисовки:
 * в проекте модель переедет в widgets/games/matrix-puzzle/model.ts и покроется тестами.
 */
const SHAPE = [[0, 0], [0.8, 0], [0.8, 1.2], [1.6, 1.2], [1.6, 1.8], [0.8, 1.8], [0.8, 2.4], [2, 2.4], [2, 3], [0, 3]]; // буква F: видно поворот и отражение
const LEVELS = [
  { name: "растяжение", target: [[2, 0], [0, 1]] },
  { name: "сдвиг", target: [[1, 1], [0, 1]] },
  { name: "поворот на 90°", target: [[0, -1], [1, 0]] },
  { name: "отражение", target: [[-1, 0], [0, 1]] },
  { name: "сжатие в линию", target: [[1, 0.5], [0, 0]] },
];
const apply = (A, [x, y]) => [A[0][0] * x + A[0][1] * y, A[1][0] * x + A[1][1] * y];
const det = (A) => A[0][0] * A[1][1] - A[0][1] * A[1][0];
const sameColumn = (A, B, j) => Math.abs(A[0][j] - B[0][j]) < 1e-9 && Math.abs(A[1][j] - B[1][j]) < 1e-9;
const fmtNum = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1)).replace("-", "−");

function initGame(root) {
  const NS = "http://www.w3.org/2000/svg";
  const svg = root.querySelector("svg");
  const C = 240, U = 40; // центр и единица: 40 px = две клетки
  const px = ([x, y]) => [C + x * U, C - y * U];
  const el = (tag, attrs, parent = svg) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    parent.append(n);
    return n;
  };
  for (let g = 0; g <= 480; g += 20) {
    el("line", { class: "grid-line", x1: g, y1: 0, x2: g, y2: 480 });
    el("line", { class: "grid-line", x1: 0, y1: g, x2: 480, y2: g });
  }
  el("line", { class: "axis", x1: 0, y1: C, x2: 480, y2: C });
  el("line", { class: "axis", x1: C, y1: 0, x2: C, y2: 480 });
  const defs = el("defs", {});
  for (const slot of [1, 2]) {
    const m = el("marker", { id: `ah${slot}`, viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
    el("path", { d: "M0 0 L10 5 L0 10 z", style: `fill: var(--sym-${slot})` }, m);
  }
  const target = el("polygon", { class: "shape-target" });
  const current = el("polygon", { class: "shape-current" });
  const b1 = el("line", { class: "basis-1", "marker-end": "url(#ah1)" });
  const b2 = el("line", { class: "basis-2", "marker-end": "url(#ah2)" });
  const l1 = el("text", { class: "basis-label", style: "fill: var(--sym-1-text)" });
  const l2 = el("text", { class: "basis-label", style: "fill: var(--sym-2-text)" });

  let level = +(root.dataset.level || 2);
  let A = JSON.parse(root.dataset.start || "[[1,0],[0,1]]");
  let moves = +(root.dataset.moves || 0);
  const outs = root.querySelectorAll(".stepper output");
  const status = root.querySelector("[data-status]");

  function draw() {
    const T = LEVELS[level].target;
    target.setAttribute("points", SHAPE.map((p) => px(apply(T, p)).join(",")).join(" "));
    current.setAttribute("points", SHAPE.map((p) => px(apply(A, p)).join(",")).join(" "));
    const o = px([0, 0]);
    const e1 = px([A[0][0], A[1][0]]), e2 = px([A[0][1], A[1][1]]);
    for (const [line, end, label, k] of [[b1, e1, l1, 1], [b2, e2, l2, 2]]) {
      line.setAttribute("x1", o[0]); line.setAttribute("y1", o[1]);
      line.setAttribute("x2", end[0]); line.setAttribute("y2", end[1]);
      label.setAttribute("x", end[0] + 8); label.setAttribute("y", end[1] - 8);
      label.innerHTML = `Ae<tspan baseline-shift="sub" font-size="11">${k}</tspan>`;
    }
    outs[0].value = fmtNum(A[0][0]); outs[1].value = fmtNum(A[0][1]);
    outs[2].value = fmtNum(A[1][0]); outs[3].value = fmtNum(A[1][1]);
    root.querySelector("[data-det]").textContent = fmtNum(det(A));
    root.querySelector("[data-moves]").textContent = moves;
    root.querySelector("[data-level-name]").textContent = `Уровень ${level + 1} из ${LEVELS.length}: ${LEVELS[level].name}`;
    const ok1 = sameColumn(A, T, 0), ok2 = sameColumn(A, T, 1);
    status.dataset.state = ok1 && ok2 ? "done" : "play";
    status.querySelector("span").innerHTML = ok1 && ok2
      ? `Фигуры совпали за ${moves} ходов.`
      : ok1 ? "Первый столбец на месте: <i>e</i><sub>1</sub> попадает куда нужно. Осталось решить, куда отправить <i>e</i><sub>2</sub>."
      : ok2 ? "Второй столбец на месте. Куда должен попасть <i>e</i><sub>1</sub>?"
      : "Пока ни один базисный вектор не попадает в нужную точку.";
  }
  root.querySelectorAll(".stepper").forEach((st, k) => {
    const [i, j] = [Math.floor(k / 2), k % 2];
    st.querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => {
        A[i][j] = Math.round((A[i][j] + +b.dataset.d) * 10) / 10;
        moves += 1;
        draw();
      }),
    );
  });
  root.querySelector("[data-reset]").addEventListener("click", () => { A = [[1, 0], [0, 1]]; moves = 0; draw(); });
  draw();
}

document.addEventListener("DOMContentLoaded", () => document.querySelectorAll("[data-game]").forEach(initGame));
