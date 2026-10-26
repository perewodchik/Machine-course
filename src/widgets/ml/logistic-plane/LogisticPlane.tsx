// Виджет «Сигмоида над плоскостью» (урок 1.4 «Основ ML»): квартиры на плоскости «площадь — до метро», закрашенные —
// дороже медианы, полые — дешевле. Фон — вероятность класса «дороже» g(θᵀx), линия — граница θᵀx = 0, кольцо вокруг
// точки — её потери −log p(y | x). Ручки: направление границы, сдвиг, крутизна; «К максимуму» — метод Ньютона;
// «Добавить выброс» — дешёвая большая квартира у метро.
import { useMemo, useState } from "react";
import { Line, ParamSlider, Plane, Readout, fmt, useLiveText, usePlane } from "../../_kit";
import { BASE, OUTLIER, best, boundary, fromTheta, itemLoss, prob, stats, toTheta, type Item, type Knobs } from "./model";

const AREA: [number, number] = [20, 125];
const METRO: [number, number] = [0, 42];
const COLS = 21;
const ROWS = 14;

function Field({ theta }: { theta: number[] }) {
  const { layout } = usePlane();
  const w = (AREA[1] - AREA[0]) / COLS;
  const h = (METRO[1] - METRO[0]) / ROWS;
  const cells = [];
  for (let i = 0; i < COLS; i++)
    for (let j = 0; j < ROWS; j++) {
      const a = AREA[0] + (i + 0.5) * w;
      const m = METRO[0] + (j + 0.5) * h;
      const x = layout.sx(AREA[0] + i * w);
      const y = layout.sy(METRO[0] + (j + 1) * h);
      cells.push(<rect key={`${i}-${j}`} x={x} y={y} width={layout.sx(AREA[0] + (i + 1) * w) - x + 0.5} height={layout.sy(METRO[0] + j * h) - y + 0.5} style={{ opacity: 0.32 * prob(theta, a, m) }} />);
    }
  return <g className="logistic-plane__field" aria-hidden="true">{cells}</g>;
}

function Dots({ items, theta }: { items: Item[]; theta: number[] }) {
  const { layout } = usePlane();
  return (
    <g aria-hidden="true">
      {items.map((d, i) => {
        const cx = layout.sx(d.area);
        const cy = layout.sy(d.metro);
        const loss = itemLoss(theta, d);
        return (
          <g key={i} className={d === OUTLIER ? "logistic-plane__outlier" : undefined}>
            {loss > 0.15 && <circle className="logistic-plane__ring" cx={cx} cy={cy} r={3.5 + 2.5 * Math.min(loss, 5)} />}
            <circle className={d.y ? "logistic-plane__dot is-pos" : "logistic-plane__dot"} cx={cx} cy={cy} r={d === OUTLIER ? 5 : 3.2} />
          </g>
        );
      })}
    </g>
  );
}

const START: Knobs = { phi: 0, c: 0, k: 1 };

export default function LogisticPlane() {
  const [knobs, setKnobs] = useState<Knobs>(START);
  const [outlier, setOutlier] = useState(false);
  const items = useMemo(() => (outlier ? [...BASE, OUTLIER] : BASE), [outlier]);
  const theta = toTheta(knobs);
  const s = stats(theta, items);
  const set = (patch: Partial<Knobs>) => setKnobs((k) => ({ ...k, ...patch }));
  const toBest = () => {
    const k = fromTheta(best(items));
    setKnobs({ phi: Math.round(k.phi), c: Math.round(k.c * 100) / 100, k: Math.round(k.k * 10) / 10 });
  };
  const [from, to] = boundary(theta);
  const live = useLiveText(`Направление ${fmt(knobs.phi, 0)}°, сдвиг ${fmt(knobs.c)}, крутизна ${fmt(knobs.k, 1)}: ℓ/n = ${fmt(s.ell, 3)}, верных ${fmt(100 * s.acc, 1)} %${outlier ? ", с выбросом" : ""}`);
  return (
    <div className="logistic-plane">
      <Plane x={AREA} y={METRO} xStep={20} yStep={10} xLabel="площадь, м²" yLabel="до метро, мин" height={{ ratio: 0.62, min: 240, max: 400 }} initialWidth={660} label={`${items.length} квартир: закрашенные дороже медианы, полые дешевле; фон — вероятность «дороже», линия — граница решений; ℓ/n = ${fmt(s.ell, 3)}, верных ${fmt(100 * s.acc, 1)} %`}>
        <Field theta={theta} />
        <Dots items={items} theta={theta} />
        <Line from={from} to={to} role="param" />
      </Plane>
      <p className="logistic-plane__legend">закрашенные — дороже медианы, полые — дешевле; чем темнее фон, тем выше вероятность «дороже»; кольцо — потери точки</p>
      <div className="logistic-plane__controls">
        <ParamSlider name="направление, °" value={knobs.phi} min={-180} max={180} step={1} digits={0} role="param" onChange={(phi) => set({ phi })} />
        <ParamSlider name="сдвиг" value={knobs.c} min={-2} max={2} step={0.01} role="param" onChange={(c) => set({ c })} />
        <ParamSlider name="крутизна" value={knobs.k} min={0.1} max={30} step={0.1} digits={1} role="param" onChange={(k) => set({ k })} />
        <div className="logistic-plane__actions">
          <button type="button" className="btn btn--sm" onClick={toBest}>
            К максимуму
          </button>
          <button type="button" className="btn btn--sm" aria-pressed={outlier} onClick={() => setOutlier((v) => !v)}>
            Выброс у метро
          </button>
          <button type="button" className="btn btn--sm btn--quiet" onClick={() => setKnobs(START)}>
            Сначала
          </button>
        </div>
        <div className="logistic-plane__readouts">
          <Readout name="ℓ/n" value={s.ell} digits={3} />
          <Readout name="верных, %" value={100 * s.acc} digits={1} />
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
