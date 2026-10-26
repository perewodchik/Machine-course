// Карта курсов на главной (S7.01): узлы на сетке столбцов и строк, рёбра — сплошные (курс нужен до начала) и пунктирные
// (рекомендуется). Чистая геометрия для SVG; данные — content/catalog.yaml.

export interface MapNode {
  course: string;
  short: string;
  col: number;
  row: number;
  before: string;
  projects?: string[];
  practice?: string;
}

export type MapEdge = [string, string] | [string, string, "soft"];

export interface Route {
  id: string;
  title: string;
  courses: string[];
}

export interface CatalogMap {
  nodes: MapNode[];
  edges: MapEdge[];
  routes: Route[];
}

export const NODE = { w: 158, h: 52, colStep: 190, rowStep: 66, pad: 10 } as const;

export const nodeXY = (n: Pick<MapNode, "col" | "row">) => ({ x: NODE.pad + n.col * NODE.colStep, y: NODE.pad + n.row * NODE.rowStep });

/** Размер холста под все узлы. */
export function mapSize(nodes: readonly MapNode[]) {
  const cols = Math.max(...nodes.map((n) => n.col)) + 1;
  const rows = Math.max(...nodes.map((n) => n.row)) + 1;
  return { w: 2 * NODE.pad + (cols - 1) * NODE.colStep + NODE.w, h: 2 * NODE.pad + (rows - 1) * NODE.rowStep + NODE.h };
}

/**
 * Путь ребра: из правого края узла в левый край следующего столбца — по кривой Безье; если узлы в одном столбце или
 * цель левее — сверху/снизу (вниз из нижнего края и влево к цели), чтобы стрелка не шла поверх узлов.
 */
export function edgePath(a: MapNode, b: MapNode): string {
  const p = nodeXY(a);
  const q = nodeXY(b);
  const ay = p.y + NODE.h / 2;
  const by = q.y + NODE.h / 2;
  if (b.col > a.col) {
    const x1 = p.x + NODE.w;
    const x2 = q.x;
    if (ay === by) return `M${x1} ${ay} H${x2}`;
    const mx = x1 + (x2 - x1) / 2;
    return `M${x1} ${ay} C ${mx} ${ay}, ${mx} ${by}, ${x2} ${by}`;
  }
  if (b.col === a.col && Math.abs(b.row - a.row) > 1) {
    // через узлы между ними не идём: дуга справа, от правого края к правому краю
    const x = p.x + NODE.w;
    const bend = x + NODE.colStep - NODE.w - 8;
    return `M${x} ${ay} C ${bend} ${ay}, ${bend} ${by}, ${x} ${by}`;
  }
  if (b.col === a.col) {
    // соседи в столбце: короткая стрелка от нижнего края к верхнему (или наоборот)
    const x = p.x + NODE.w / 2;
    return b.row > a.row ? `M${x} ${p.y + NODE.h} V${q.y}` : `M${x} ${p.y} V${q.y + NODE.h}`;
  }
  // цель левее: вниз из нижнего края источника, затем влево к правому краю цели
  const x = p.x + NODE.w / 2;
  return `M${x} ${p.y + NODE.h} V${by} H${q.x + NODE.w}`;
}
