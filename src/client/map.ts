// Карта курса (CourseMap.astro): рёбра «опирается на» по положению узлов, подсветка связей урока при наведении
// и фокусе, «можно начинать» по отметкам «знаю». Без JS карта — списки уроков с пререквизитами текстом.
import { available, dependents, type GraphLesson } from "../lib/progress/graph";
import { isKnown } from "../lib/progress/marks";
import { $marks } from "../lib/state/marks";

const SVG = "http://www.w3.org/2000/svg";
const moduleOf = (key: string) => key.split("/")[1];

function init(root: HTMLElement): void {
  const graph = JSON.parse(root.querySelector("[data-map-graph]")!.textContent ?? "[]") as GraphLesson[];
  const nodes = new Map([...root.querySelectorAll<HTMLElement>("[data-map-node]")].map((el) => [el.dataset.mapNode!, el]));
  const board = root.querySelector<HTMLElement>(".course-map__board")!;
  const svg = root.querySelector<SVGSVGElement>("[data-map-edges]")!;
  const after = dependents(graph);
  const before = new Map(graph.map((l) => [l.key, l.requires]));
  let edges: { from: string; to: string; path: SVGPathElement }[] = [];
  let active: string | null = null;

  const draw = () => {
    svg.replaceChildren();
    edges = [];
    if (getComputedStyle(svg).display === "none") return;
    const box = board.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    const rel = (r: DOMRect) => ({ l: r.left - box.left, r: r.right - box.left, y: r.top - box.top + Math.min(r.height / 2, 22) });
    for (const l of graph) {
      for (const from of l.requires) {
        const a = nodes.get(from);
        const b = nodes.get(l.key);
        if (!a || !b) continue;
        const p = rel(a.getBoundingClientRect());
        const q = rel(b.getBoundingClientRect());
        let d: string;
        if (moduleOf(from) === moduleOf(l.key)) {
          // в одном модуле — дугой слева от столбца
          const bulge = Math.min(26, 8 + Math.abs(q.y - p.y) / 12);
          d = `M ${p.l} ${p.y} C ${p.l - bulge} ${p.y}, ${q.l - bulge} ${q.y}, ${q.l} ${q.y}`;
        } else if (p.r <= q.l) {
          const dx = Math.max(16, (q.l - p.r) / 2);
          d = `M ${p.r} ${p.y} C ${p.r + dx} ${p.y}, ${q.l - dx} ${q.y}, ${q.l} ${q.y}`;
        } else {
          const dx = Math.max(16, (p.l - q.r) / 2);
          d = `M ${p.l} ${p.y} C ${p.l - dx} ${p.y}, ${q.r + dx} ${q.y}, ${q.r} ${q.y}`;
        }
        const path = document.createElementNS(SVG, "path");
        path.setAttribute("d", d);
        path.setAttribute("class", "edge");
        svg.append(path);
        edges.push({ from, to: l.key, path });
      }
    }
    highlight(active);
  };

  const highlight = (target: string | null) => {
    // связи видны только там, где нарисованы рёбра; на узком экране подсветка ни к чему
    const key = edges.length ? target : null;
    active = key;
    root.classList.toggle("has-active", key !== null);
    const ins = new Set(key ? (before.get(key) ?? []) : []);
    const outs = new Set(key ? (after.get(key) ?? []) : []);
    nodes.forEach((el, k) => {
      el.classList.toggle("is-active", k === key);
      el.classList.toggle("is-before", ins.has(k));
      el.classList.toggle("is-after", outs.has(k));
    });
    for (const e of edges) {
      e.path.classList.toggle("is-in", e.to === key);
      e.path.classList.toggle("is-out", e.from === key);
    }
  };

  const status = () => {
    const marks = $marks.get();
    const known = (k: string) => isKnown(marks, k);
    const next = new Set(available(graph, known));
    nodes.forEach((el, k) => {
      el.classList.toggle("is-known", known(k));
      el.classList.toggle("is-next", next.has(k));
    });
    root.querySelectorAll<HTMLElement>("[data-map-next]").forEach((li) => (li.hidden = !next.has(li.dataset.mapNext!)));
    root.querySelector<HTMLElement>("[data-map-next-empty]")!.hidden = next.size > 0;
  };

  root.addEventListener("mouseover", (e) => {
    const node = (e.target as HTMLElement).closest<HTMLElement>("[data-map-node]");
    if (node && node.dataset.mapNode !== active) highlight(node.dataset.mapNode!);
  });
  board.addEventListener("mouseleave", () => {
    if (!board.contains(document.activeElement)) highlight(null);
  });
  root.addEventListener("focusin", (e) => {
    const node = (e.target as HTMLElement).closest<HTMLElement>("[data-map-node]");
    highlight(node ? node.dataset.mapNode! : null);
  });
  root.addEventListener("focusout", (e) => {
    if (!root.contains(e.relatedTarget as Node | null)) highlight(null);
  });

  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(draw);
  };
  new ResizeObserver(schedule).observe(board);
  void document.fonts?.ready.then(schedule);
  $marks.subscribe(status);
}

document.querySelectorAll<HTMLElement>("[data-course-map]").forEach(init);
