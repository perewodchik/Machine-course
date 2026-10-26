// Виджет «Перетащи выброс» (урок IV.1): одиннадцать цен квартир и двенадцатая, которую двигает бегунок. На оси —
// точки, вертикали среднего и медианы, под ними «ящик» от первого до третьего квартиля. Показания — среднее,
// медиана, стандартное отклонение и межквартильный размах. Логика — model.ts.
import { useState } from "react";
import { Line, ParamSlider, Plane, Point, Polygon, Readout, fmt, useLiveText } from "../../_kit";
import { BASE, iqr, mean, median, quantile, std } from "./model";

export interface OutlierProps {
  initial?: { value?: number };
}

export default function Outlier({ initial = {} }: OutlierProps) {
  const [v, setV] = useState(initial.value ?? 10);
  const x = [...BASE, v];
  const m = mean(x);
  const md = median(x);
  const q1 = quantile(x, 0.25);
  const q3 = quantile(x, 0.75);
  const live = useLiveText(`Двенадцатая квартира — ${fmt(v, 1)} млн ₽: среднее ${fmt(m, 2)}, медиана ${fmt(md, 2)}, стандартное отклонение ${fmt(std(x), 2)}, межквартильный размах ${fmt(iqr(x), 2)}.`);

  return (
    <div className="outlier-widget">
      <Plane x={[0, 60]} y={[-1.2, 1]} xStep={5} yStep={5} xLabel="млн ₽" yLabel="" height={{ ratio: 0.22, min: 130, max: 180 }} label={`Цены двенадцати квартир; среднее ${fmt(m, 2)}, медиана ${fmt(md, 2)}`}>
        <Polygon
          points={[
            [q1, -0.9],
            [q3, -0.9],
            [q3, -0.4],
            [q1, -0.4],
          ]}
          tone="aux"
        />
        <Line from={[md, 1]} to={[md, -1.15]} role="aux" label="Me" />
        <Line from={[m, -1.2]} to={[m, 1]} role="target" label="x̄" />
        {BASE.map((p, i) => (
          <Point key={i} x={p} y={0.25} role="data" r={4} />
        ))}
        <Point x={v} y={0.25} role="param" label="x⁽¹²⁾" />
      </Plane>
      <div className="outlier-widget__controls">
        <ParamSlider name="x_{12}" value={v} min={0} max={60} step={0.5} digits={1} role="param" onChange={setV} />
        <div className="outlier-widget__readouts">
          <Readout name="x̄" value={m} digits={2} hint="среднее" />
          <Readout name="Me" value={md} digits={2} hint="медиана: середина по порядку" />
          <Readout name="s" value={std(x)} digits={2} hint="стандартное отклонение, n − 1" />
          <Readout name="IQR" value={iqr(x)} digits={2} hint="Q₃ − Q₁: ширина ящика" />
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
