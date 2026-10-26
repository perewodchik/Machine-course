// Виджет «Спуск по линиям уровня» (урок 1.2 «Основ ML»): линии уровня J(θ₀, θ₁) для цены от площади и путь спуска.
// Признак — площадь как есть или стандартизованная; режим — пакетный, SGD или мини-батч |B| = 2…n; шаг задаётся долей порога
// 2/λ_max, убывающий шаг — α/(1 + t/t₀). Линии уровня — эллипсы (θ − θ*)ᵀH(θ − θ*) = 2c, H = ZᵀZ/n.
import { useMemo, useState } from "react";
import { Ellipse, ParamSlider, Plane, Point, Polyline, Readout, fmt, useLiveText } from "../../_kit";
import { loss, makeData, problem, run, type Mode, type Vec2 } from "./model";

export interface LmsPathProps {
  /** Начальный признак: стандартизованная площадь или как есть. */
  standardized?: boolean;
  mode?: Mode;
}

const MODES: { id: Mode; label: string }[] = [
  { id: "batch", label: "пакетный" },
  { id: "sgd", label: "SGD" },
  { id: "minibatch", label: "мини-батч" },
];

// окна рисунка подобраны (после стандартизации — равный масштаб осей: линии уровня — окружности) под данные seed 12: θ* ≈ (1.15, 0.115) для площади и ≈ (8.62, 2.94) после стандартизации
const VIEW = {
  raw: { x: [-0.5, 2.5] as [number, number], y: [-0.05, 0.3] as [number, number], xStep: 0.5, yStep: 0.05, starts: [[0, 0], [2, 0.05]] as Vec2[] },
  std: { x: [-4, 20] as [number, number], y: [-4, 8] as [number, number], xStep: 4, yStep: 4, starts: [[0, 0], [18, -1]] as Vec2[] },
};

const data = makeData();

export default function LmsPath({ standardized: st0 = false, mode: mode0 = "batch" }: LmsPathProps) {
  const [st, setSt] = useState(st0);
  const [mode, setMode] = useState<Mode>(mode0);
  const [ratio, setRatio] = useState(0.5);
  const [epochs, setEpochs] = useState(20);
  const [batch, setBatch] = useState(10);
  const [decay, setDecay] = useState(false);
  const [startIx, setStartIx] = useState(0);
  const p = useMemo(() => problem(data, st), [st]);
  const view = st ? VIEW.std : VIEW.raw;
  const start = view.starts[startIx]!;
  const limit = 2 / p.lamMax;
  const alpha = ratio * limit;
  const path = useMemo(() => run(p, { alpha, mode, batch, epochs, decay, start }), [p, alpha, mode, batch, epochs, decay, start]);
  const end = path.at(-1)!;
  const jEnd = loss(p, end);
  const diverged = !Number.isFinite(jEnd) || jEnd > 1e3;
  // линии уровня: от уровня старта вниз в геометрической прогрессии
  const top = loss(p, start) - p.jStar;
  const inv = invert(p.H);
  const levels = Array.from({ length: 9 }, (_, k) => top * 0.3 ** k);
  const box = (v: Vec2): Vec2 => [clamp(v[0], view.x[0] - 1e3, view.x[1] + 1e3), clamp(v[1], view.y[0] - 1e3, view.y[1] + 1e3)];
  const steps = path.length - 1;
  const verdict = diverged ? "расходится" : `J = ${fmt(jEnd, 4)}, минимум ${fmt(p.jStar, 4)}`;
  const live = useLiveText(`${st ? "Стандартизованная площадь" : "Площадь как есть"}, ${mode === "minibatch" ? `мини-батч ${batch}` : MODES.find((m) => m.id === mode)!.label}, α = ${fmt(alpha, 5)} (${fmt(ratio)} порога), ${steps} шагов: ${verdict}`);
  return (
    <div className="lms-path">
      <Plane x={view.x} y={view.y} xStep={view.xStep} yStep={view.yStep} equal={st} xLabel="θ_0" yLabel="θ_1" height={{ ratio: 0.62, min: 240, max: 400 }} initialWidth={660} label={`Линии уровня J(θ₀, θ₁) и путь спуска из (${fmt(start[0])}, ${fmt(start[1])}): ${steps} шагов, ${verdict}`}>
        {levels.map((c, k) => (
          <Ellipse key={k} center={p.thetaStar} cov={[[2 * c * inv[0][0], 2 * c * inv[0][1]], [2 * c * inv[1][0], 2 * c * inv[1][1]]]} role="aux" />
        ))}
        <Polyline points={path.map(box)} role="param" />
        <Point x={p.thetaStar[0]} y={p.thetaStar[1]} role="target" r={4} />
        <Point x={start[0]} y={start[1]} role="data" r={3.5} />
        {!diverged && <Point x={end[0]} y={end[1]} role="param" r={4} />}
      </Plane>
      <p className="lms-path__legend">эллипсы — линии уровня J; кружок в центре — минимум θ*; ломаная — путь весов от старта</p>
      <div className="lms-path__controls">
        <div className="lms-path__actions" role="group" aria-label="Признак">
          <button type="button" className="btn btn--sm" aria-pressed={!st} onClick={() => setSt(false)}>
            площадь, м²
          </button>
          <button type="button" className="btn btn--sm" aria-pressed={st} onClick={() => setSt(true)}>
            стандартизованная
          </button>
        </div>
        <div className="lms-path__actions" role="group" aria-label="Режим спуска">
          {MODES.map((m) => (
            <button key={m.id} type="button" className="btn btn--sm" aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
        <ParamSlider name="α / порог" value={ratio} min={0.05} max={1.2} step={0.05} role="param" onChange={setRatio} />
        {mode === "minibatch" && <ParamSlider name="пакет |B|" value={batch} min={2} max={data.x.length} step={1} digits={0} role="aux" onChange={setBatch} />}
        <ParamSlider name="эпох" value={epochs} min={1} max={100} step={1} digits={0} role="aux" onChange={setEpochs} />
        <div className="lms-path__actions">
          <label className="lms-path__check">
            <input type="checkbox" checked={decay} onChange={(e) => setDecay(e.target.checked)} /> убывающий шаг
          </label>
          <button type="button" className="btn btn--sm btn--quiet" onClick={() => setStartIx((i) => (i + 1) % view.starts.length)}>
            Другой старт
          </button>
        </div>
        <div className="lms-path__readouts">
          <Readout name="порог 2/λ_{max}" value={limit} digits={limit < 0.01 ? 6 : 3} />
          <Readout name="α" value={alpha} digits={alpha < 0.01 ? 6 : 3} />
          <Readout name="κ" value={p.lamMax / p.lamMin} digits={p.lamMax / p.lamMin > 100 ? 0 : 2} />
          <Readout name="шагов" value={steps} digits={0} />
          <p className="lms-path__verdict">{diverged ? "Спуск расходится: шаг больше порога." : `J = ${fmt(jEnd, 4)} при минимуме ${fmt(p.jStar, 4)}`}</p>
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}

const clamp = (v: number, a: number, b: number) => (Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : b);

function invert([[a, b], [c, d]]: [[number, number], [number, number]]): [[number, number], [number, number]] {
  const det = a * d - b * c;
  return [
    [d / det, -b / det],
    [-c / det, a / det],
  ];
}
