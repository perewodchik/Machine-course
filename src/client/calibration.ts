// Страница прогресса (S4.01): таблица и график калибровки по журналу ($journal) и список уроков с завышенной
// уверенностью. Логика — src/lib/progress/calibration.ts; здесь только вывод.
import { plural } from "../i18n/ru";
import { calibration, overconfident, verdict } from "../lib/progress/calibration";
import { $journal } from "../lib/state/journal";

interface LessonInfo {
  number: string;
  title: string;
  href: string;
}

const pct = (x: number) => `${Math.round(x * 100)}\u00a0%`;

function chart(stats: ReturnType<typeof calibration>): string {
  // столбик — доля верных, штрих — ожидаемая доля; шкала 0–100 %
  const W = 320;
  const H = 160;
  const bw = 56;
  const gap = (W - 3 * bw) / 4;
  const y = (v: number) => H - 24 - v * (H - 40);
  const cols = stats
    .map((s, i) => {
      const x = gap + i * (bw + gap);
      const bar = s.rate === null ? "" : `<rect class="calibration__bar" x="${x}" y="${y(s.rate)}" width="${bw}" height="${y(0) - y(s.rate)}" />`;
      const nominal = `<line class="calibration__nominal" x1="${x - 6}" x2="${x + bw + 6}" y1="${y(s.nominal)}" y2="${y(s.nominal)}" />`;
      const label = `<text class="calibration__label" x="${x + bw / 2}" y="${H - 6}" text-anchor="middle">${s.name}</text>`;
      return bar + nominal + label;
    })
    .join("");
  const grid = [0, 0.5, 1].map((v) => `<line class="calibration__grid" x1="0" x2="${W}" y1="${y(v)}" y2="${y(v)}" /><text class="calibration__tick" x="0" y="${y(v) - 3}">${pct(v)}</text>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="calibration__svg">${grid}${cols}</svg>`;
}

function render(root: HTMLElement): void {
  const lessons = JSON.parse(root.querySelector("[data-lessons]")?.textContent ?? "{}") as Record<string, LessonInfo>;
  const events = $journal.get();
  const stats = calibration(events);
  const any = stats.some((s) => s.n > 0);
  root.querySelector<HTMLElement>("[data-calibration-empty]")!.hidden = any;
  root.querySelector<HTMLElement>("[data-calibration-body]")!.hidden = !any;
  if (any) {
    for (const s of stats) {
      const row = root.querySelector(`tr[data-level="${s.level}"]`);
      if (!row) continue;
      row.querySelector("[data-n]")!.textContent = String(s.n);
      row.querySelector("[data-rate]")!.textContent = s.rate === null ? "—" : `${s.correct} (${pct(s.rate)})`;
    }
    root.querySelector("[data-calibration-verdict]")!.textContent = verdict(stats) ?? "Чтобы делать выводы, нужно хотя бы три ответа с отметкой «уверен».";
    root.querySelector("[data-calibration-chart]")!.innerHTML = chart(stats);
  }

  const section = document.querySelector<HTMLElement>("[data-overconfident]");
  const list = section?.querySelector("[data-overconfident-list]");
  if (!section || !list) return;
  const gaps = overconfident(events).filter((g) => lessons[g.lesson]);
  section.hidden = gaps.length === 0;
  list.innerHTML = "";
  for (const g of gaps) {
    const l = lessons[g.lesson]!;
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = l.href;
    link.textContent = `${l.number} ${l.title}`;
    const more = document.createElement("a");
    more.href = `${l.href}#final-check`;
    more.textContent = "Ещё задача";
    li.append(link, ` — «уверен» ${g.n}\u00a0${plural(g.n, "раз", "раза", "раз")}, верно ${g.correct} (${pct(g.rate)}). `, more);
    list.append(li);
  }
}

const root = document.querySelector<HTMLElement>("[data-calibration]");
if (root) {
  render(root);
  $journal.listen(() => render(root));
}
