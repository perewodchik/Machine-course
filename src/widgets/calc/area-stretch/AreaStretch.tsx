// Виджет «Как растягивается площадь при замене переменных» (урок II.10): слева — клетка Δr × Δφ на плоскости
// (r, φ), справа — её образ при x = r cos φ, y = r sin φ, кусок кольца. Бегунки r, φ, Δ. Показания — точная
// площадь образа, приближение |det J| Δr Δφ = r Δr Δφ и их отношение. Логика — model.ts.
import { useState } from "react";
import { ParamSlider, Plane, Polyline, Readout, fmt, useLiveText } from "../../_kit";
import { cellImage, exactArea, linearArea, polar, type Pt } from "./model";

export interface AreaStretchProps {
  initial?: { r?: number; phi?: number; d?: number };
}

const DEG = Math.PI / 180;

export default function AreaStretch({ initial = {} }: AreaStretchProps) {
  const [r, setR] = useState(initial.r ?? 1.5);
  const [phiDeg, setPhi] = useState(initial.phi ?? 30);
  const [d, setD] = useState(initial.d ?? 0.4);
  const phi = phiDeg * DEG;
  const exact = exactArea(r, d, d);
  const lin = linearArea(r, d, d);
  const live = useLiveText(`r = ${fmt(r, 1)}, φ = ${fmt(phiDeg, 0)}°, Δr = Δφ = ${fmt(d, 2)}: площадь образа ${fmt(exact, 4)}, r Δr Δφ = ${fmt(lin, 4)}, отношение ${fmt(exact / lin, 3)}`);
  // клетка слева: φ по горизонтали в радианах, r по вертикали
  const cell: Pt[] = [
    [phi, r],
    [phi + d, r],
    [phi + d, r + d],
    [phi, r + d],
    [phi, r],
  ];
  const rings = [0.5, 1, 1.5, 2, 2.5, 3].map((rr) => Array.from({ length: 97 }, (_, i) => polar(rr, (i * Math.PI) / 48)));
  const rays = Array.from({ length: 12 }, (_, k) => [polar(0, (k * Math.PI) / 6), polar(3, (k * Math.PI) / 6)] as Pt[]);

  return (
    <div className="area-stretch">
      <div className="area-stretch__panes">
        <Plane x={[0, 2 * Math.PI]} y={[0, 3]} xStep={1} yStep={1} xLabel="φ" yLabel="r" height={{ ratio: 0.6, min: 180, max: 300 }} initialWidth={420} label={`Клетка на плоскости (φ, r): φ от ${fmt(phiDeg, 0)}°, r от ${fmt(r, 1)}, стороны ${fmt(d, 2)}`}>
          <Polyline points={cell} role="param" />
        </Plane>
        <Plane x={[-3, 3]} y={[-3, 3]} xStep={1} yStep={1} equal height={{ ratio: 1, min: 220, max: 360 }} initialWidth={420} label={`Образ клетки при переходе к x = r cos φ, y = r sin φ: кусок кольца площадью ${fmt(exact, 3)}`}>
          {rings.map((pts, i) => (
            <Polyline key={`r${i}`} points={pts} role="aux" />
          ))}
          {rays.map((pts, i) => (
            <Polyline key={`p${i}`} points={pts} role="aux" />
          ))}
          <Polyline points={cellImage(r, d, phi, d)} role="param" />
        </Plane>
      </div>
      <div className="area-stretch__controls">
        <ParamSlider name="r" value={r} min={0.1} max={2.5} step={0.1} digits={1} onChange={setR} />
        <ParamSlider name="φ°" value={phiDeg} min={0} max={330} step={5} digits={0} onChange={setPhi} />
        <ParamSlider name="Δ" value={d} min={0.02} max={0.5} step={0.02} digits={2} onChange={setD} />
        <Readout name="S" value={exact} digits={4} hint="площадь образа" />
        <Readout name="r Δr Δφ" value={lin} digits={4} hint="|det J| Δr Δφ" />
        <Readout name="S / (r Δr Δφ)" value={exact / lin} digits={3} />
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
