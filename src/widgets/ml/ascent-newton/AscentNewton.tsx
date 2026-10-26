// Виджет «Подъём против Ньютона» (урок 1.4 «Основ ML»): линии уровня ℓ(θ₁, θ₂) для двух признаков без свободного
// члена, путь градиентного подъёма (пунктир, каждая точка — итерация) и путь Ньютона, счётчики итераций до
// ‖∇ℓ‖ < 10⁻⁶. Кнопки: признак «площадь» как есть или делённый на 3; старт.
import { useMemo, useState } from "react";
import { Plane, Point, Polyline, Readout, fmt, useLiveText } from "../../_kit";
import { contour, paths, problem, type Vec2 } from "./model";

const STARTS: Vec2[] = [[0, 0], [0, 1.5]];
const DROPS = [0.01, 0.03, 0.08, 0.18, 0.35];

/** Не больше 400 точек на ломаной: путь подъёма — тысячи итераций. */
const thin = (pts: number[][]) => {
  const k = Math.max(1, Math.ceil(pts.length / 400));
  return pts.filter((_, i) => i % k === 0 || i === pts.length - 1).map((p) => [p[0]!, p[1]!] as [number, number]);
};

export default function AscentNewton() {
  const [scaled, setScaled] = useState(false);
  const [startIx, setStartIx] = useState(0);
  const p = useMemo(() => problem(scaled ? 1 / 3 : 1), [scaled]);
  const start = STARTS[startIx]!;
  const r = useMemo(() => paths(p, start), [p, start]);
  const levels = useMemo(() => DROPS.map((d) => contour(p, p.ellHat - d)), [p]);
  const x: [number, number] = [-2, Math.ceil(p.thetaHat[0] * 1.15)];
  const y: [number, number] = [-3, 2];
  const iters = (v: number | null) => (v === null ? "больше 20 000" : String(v));
  const live = useLiveText(`Площадь ${scaled ? "делённая на 3" : "как есть"}: Ньютон — ${iters(r.newton.iters)} итераций, подъём — ${iters(r.ascent.iters)}`);
  return (
    <div className="ascent-newton">
      <Plane x={x} y={y} xStep={scaled ? 5 : 2} yStep={1} xLabel="θ_1" yLabel="θ_2" height={{ ratio: 0.55, min: 220, max: 360 }} initialWidth={660} label={`Линии уровня ℓ(θ₁, θ₂), максимум в (${fmt(p.thetaHat[0])}, ${fmt(p.thetaHat[1])}); подъём — ${iters(r.ascent.iters)} итераций, Ньютон — ${iters(r.newton.iters)}`}>
        {levels.map((pts, k) => pts.length > 2 && <Polyline key={k} points={pts} role="aux" />)}
        <Polyline points={thin(r.ascent.points)} role="data" dashed />
        <Polyline points={thin(r.newton.points)} role="param" />
        {r.newton.points.map((q, i) => <Point key={i} x={q[0]!} y={q[1]!} role="param" r={i === 0 ? 4 : 3} />)}
        <Point x={p.thetaHat[0]} y={p.thetaHat[1]} role="target" r={4} />
      </Plane>
      <p className="ascent-newton__legend">штрих — градиентный подъём, сплошная с точками — метод Ньютона; кружок справа — максимум ℓ</p>
      <div className="ascent-newton__controls">
        <div className="ascent-newton__actions" role="group" aria-label="Масштаб площади">
          <button type="button" className="btn btn--sm" aria-pressed={!scaled} onClick={() => setScaled(false)}>
            площадь стандартизована
          </button>
          <button type="button" className="btn btn--sm" aria-pressed={scaled} onClick={() => setScaled(true)}>
            площадь ÷ 3
          </button>
          <button type="button" className="btn btn--sm btn--quiet" onClick={() => setStartIx((i) => (i + 1) % STARTS.length)}>
            Другой старт
          </button>
        </div>
        <div className="ascent-newton__readouts">
          <Readout name="Ньютон, итераций" value={r.newton.iters ?? 0} digits={0} />
          <Readout name="подъём, итераций" value={r.ascent.iters ?? 20_000} digits={0} />
          <Readout name="шаг подъёма α" value={p.alpha} digits={2} />
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
