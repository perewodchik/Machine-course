// Виджет «Области классов» (урок 1.5 «Основ ML»): квартиры трёх сегментов на плоскости стандартизованных признаков,
// области argmax_j θ_jᵀx (насыщенность — max_j p_j), стрелки w_j трёх классов. Ручки — направление, длина и сдвиг
// выбранного класса; «Сдвинуть все» прибавляет один вектор ко всем θ_j, «Резкость ×2» умножает все веса на 2,
// «К оптимуму» — спуск по кросс-энтропии. Форма точки — класс (круг, квадрат, треугольник), цвет повторяет форму.
import { useState } from "react";
import { ParamSlider, Plane, Readout, Vector, fmt, useLiveText, usePlane, type Role } from "../../_kit";
import type { Theta } from "../../../lib/math/softmax";
import { best, CLASSES, fromTheta, region, shiftAll, stats, toTheta, X, Y, type Arrow } from "./model";

const ROLE: Role[] = ["data", "param", "target"];
const R: [number, number] = [-2.4, 2.4];
const N = 24;
const START: Arrow[] = [
  { phi: 180, k: 2, b: 0 },
  { phi: 90, k: 0.5, b: 0.5 },
  { phi: 0, k: 2, b: 0 },
];

function Field({ theta }: { theta: Theta }) {
  const { layout } = usePlane();
  const h = (R[1] - R[0]) / N;
  const cells = [];
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      const r = region(theta, R[0] + (i + 0.5) * h, R[0] + (j + 0.5) * h);
      const x = layout.sx(R[0] + i * h);
      const y = layout.sy(R[0] + (j + 1) * h);
      cells.push(<rect key={`${i}-${j}`} className={`class-regions__c${r.j}`} x={x} y={y} width={layout.sx(R[0] + (i + 1) * h) - x + 0.5} height={layout.sy(R[0] + j * h) - y + 0.5} style={{ opacity: 0.08 + 0.42 * ((r.p - 1 / 3) / (2 / 3)) }} />);
    }
  return <g aria-hidden="true">{cells}</g>;
}

function Dots() {
  const { layout } = usePlane();
  return (
    <g aria-hidden="true">
      {X.map(([, a, b], i) => {
        const cx = layout.sx(a!);
        const cy = layout.sy(b!);
        const c = Y[i]!;
        const cls = `class-regions__dot class-regions__c${c}`;
        if (c === 0) return <circle key={i} className={cls} cx={cx} cy={cy} r={3.2} />;
        if (c === 1) return <rect key={i} className={cls} x={cx - 3} y={cy - 3} width={6} height={6} />;
        return <path key={i} className={cls} d={`M${cx} ${cy - 4}L${cx + 3.6} ${cy + 2.6}L${cx - 3.6} ${cy + 2.6}Z`} />;
      })}
    </g>
  );
}

export default function ClassRegions() {
  // веса храним как θ: «сдвинуть все» и «резкость» действуют на θ, ручки — на стрелку выбранного класса
  const [theta, setTheta] = useState<Theta>(() => toTheta(START));
  const [sel, setSel] = useState(0);
  const arrows = fromTheta(theta);
  const a = arrows[sel]!;
  const s = stats(theta);
  const setArrow = (patch: Partial<Arrow>) => setTheta(toTheta(arrows.map((x, j) => (j === sel ? { ...x, ...patch } : x))));
  const scale = 2 / Math.max(1, ...arrows.map((x) => x.k));
  const live = useLiveText(`Кросс-энтропия ${fmt(s.J, 3)}, верных ${fmt(100 * s.acc, 1)} %. Класс «${CLASSES[sel]}»: направление ${fmt(a.phi, 0)}°, длина ${fmt(a.k, 1)}, сдвиг ${fmt(a.b, 1)}`);
  return (
    <div className="class-regions">
      <Plane x={R} y={R} xStep={1} yStep={1} equal xLabel="площадь" yLabel="до метро" height={{ ratio: 1, min: 260, max: 440 }} initialWidth={480} label={`300 квартир трёх сегментов и области классов: верных ${fmt(100 * s.acc, 1)} %, кросс-энтропия ${fmt(s.J, 3)}`}>
        <Field theta={theta} />
        <Dots />
        {arrows.map((x, j) => {
          const r = (x.phi * Math.PI) / 180;
          return <Vector key={j} to={[scale * x.k * Math.cos(r), scale * x.k * Math.sin(r)]} role={ROLE[j]} label={`θ_${j + 1}`} />;
        })}
      </Plane>
      <p className="class-regions__legend">круги — эконом, квадраты — комфорт, треугольники — бизнес; цвет области — класс с наибольшей вероятностью, насыщенность — сама вероятность; оси — стандартизованные признаки</p>
      <div className="class-regions__controls">
        <div className="class-regions__actions" role="group" aria-label="Класс, который двигаем">
          {CLASSES.map((c, j) => (
            <button key={c} type="button" className="btn btn--sm" aria-pressed={sel === j} onClick={() => setSel(j)}>
              {c} (θ{"₁₂₃"[j]})
            </button>
          ))}
        </div>
        <ParamSlider name="направление, °" value={a.phi} min={-180} max={180} step={1} digits={0} role={ROLE[sel]} onChange={(phi) => setArrow({ phi })} />
        <ParamSlider name="длина" value={a.k} min={0} max={12} step={0.1} digits={1} role={ROLE[sel]} onChange={(k) => setArrow({ k })} />
        <ParamSlider name="сдвиг b" value={a.b} min={-6} max={6} step={0.1} digits={1} role={ROLE[sel]} onChange={(b) => setArrow({ b })} />
        <div className="class-regions__actions">
          <button type="button" className="btn btn--sm" onClick={() => setTheta((t) => shiftAll(t, [0.5, 1, -0.5]))}>
            Сдвинуть все θ
          </button>
          <button type="button" className="btn btn--sm" onClick={() => setTheta((t) => t.map((th) => th.map((v) => 2 * v)))}>
            Резкость ×2
          </button>
          <button type="button" className="btn btn--sm" onClick={() => setTheta(best().map((th) => [...th]))}>
            К оптимуму
          </button>
          <button type="button" className="btn btn--sm btn--quiet" onClick={() => setTheta(toTheta(START))}>
            Сначала
          </button>
        </div>
        <div className="class-regions__readouts">
          <Readout name="кросс-энтропия" value={s.J} digits={3} />
          <Readout name="верных, %" value={100 * s.acc} digits={1} />
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
