// Обрезка по области графика: видимая часть отрезка или прямой. Нужна, чтобы подписи стояли у видимого
// конца линии, а у линии целиком вне графика подписи не было. Отрисовку обрезает clipPath, здесь — геометрия.
export type Pt = readonly [number, number];

export interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** Алгоритм Лианга — Барски: видимая часть отрезка p→q внутри прямоугольника или null. */
export function clipSegment(p: Pt, q: Pt, b: Box): [Pt, Pt] | null {
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  let t0 = 0;
  let t1 = 1;
  const edges: [number, number][] = [
    [-dx, p[0] - b.x0],
    [dx, b.x1 - p[0]],
    [-dy, p[1] - b.y0],
    [dy, b.y1 - p[1]],
  ];
  for (const [pp, qq] of edges) {
    if (pp === 0) {
      if (qq < 0) return null;
      continue;
    }
    const r = qq / pp;
    if (pp < 0) {
      if (r > t1) return null;
      t0 = Math.max(t0, r);
    } else {
      if (r < t0) return null;
      t1 = Math.min(t1, r);
    }
  }
  return [
    [p[0] + t0 * dx, p[1] + t0 * dy],
    [p[0] + t1 * dx, p[1] + t1 * dy],
  ];
}

/** Видимая часть прямой y = a + b·x внутри области. */
export function clipLine(a: number, b: number, box: Box): [Pt, Pt] | null {
  return clipSegment([box.x0, a + b * box.x0], [box.x1, a + b * box.x1], box);
}

/** Точка для подписи: у правого видимого конца, отступив внутрь на долю длины (в данных). */
export function labelAnchor(seg: [Pt, Pt], inset = 0.06): Pt {
  const [p, q] = seg[0][0] <= seg[1][0] ? seg : [seg[1], seg[0]];
  return [q[0] - (q[0] - p[0]) * inset, q[1] - (q[1] - p[1]) * inset];
}
