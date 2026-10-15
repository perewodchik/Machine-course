// Логика «живого числа» (Scrub) и ползунка: значение на сетке шага, в пределах, без мусора округления.
export interface StepOptions {
  min: number;
  max: number;
  step: number;
}

export function snap(v: number, { min, max, step }: StepOptions): number {
  const k = Math.round((v - min) / step);
  const snapped = Number((min + k * step).toPrecision(12));
  return Math.min(max, Math.max(min, snapped));
}

/** Клавиатура: стрелки — шаг, PageUp/PageDown — 10 шагов, Home/End — края. null — клавиша не наша. */
export function keyValue(key: string, value: number, o: StepOptions): number | null {
  const big = o.step * 10;
  switch (key) {
    case "ArrowUp":
    case "ArrowRight":
      return snap(value + o.step, o);
    case "ArrowDown":
    case "ArrowLeft":
      return snap(value - o.step, o);
    case "PageUp":
      return snap(value + big, o);
    case "PageDown":
      return snap(value - big, o);
    case "Home":
      return o.min;
    case "End":
      return o.max;
    default:
      return null;
  }
}

/** Перетаскивание: dx пикселей от начальной точки, pxPerStep пикселей на шаг. */
export function dragValue(start: number, dx: number, o: StepOptions, pxPerStep = 6): number {
  return snap(start + (dx / pxPerStep) * o.step, o);
}
