// Виджет «Подгонка прямой» (урок V.1): ползунки θ₀ и θ₁ двигают прямую ŷ = θ₀ + θ₁x, пунктир — остатки εᵢ,
// J(θ) — половина суммы их квадратов. «Показать минимум» ведёт к θ* — решению нормальных уравнений.
// Эталон — initRegression в prototype/assets/proto.js; числа — code/snippets/la/normal_equations.py.
import { useEffect, useRef, useState } from "react";
import { Line, MathText, ParamSlider, Plane, Point, Readout, fmt, useLiveText, usePlane } from "../../_kit";
import { DATA, leastSquares, loss, towards, type Theta } from "./model";

export interface FitLineProps {
  /** Начальные веса; по умолчанию (2.5, 0.25), как в уроке. */
  initial?: Theta;
  /** Зафиксировать параметр: урок может дать двигать только наклон. */
  lock?: ("t0" | "t1")[];
  /** Какие слои показывать. */
  show?: { residuals?: boolean; loss?: boolean; solve?: boolean };
}

const X_MAX = 10;
const Y_MAX = 7;
const OPT = leastSquares(DATA.x, DATA.y);
const J_OPT = loss(OPT, DATA.x, DATA.y);
const J_SCALE = 12; // шкала J: правый край — плохая прямая
const RESID_LABEL = 6; // подпись εᵢ — у самого длинного остатка при начальных весах

function ResidualLabel({ theta }: { theta: Theta }) {
  const { layout } = usePlane();
  const x = DATA.x[RESID_LABEL]!;
  const mid = (DATA.y[RESID_LABEL]! + theta.t0 + theta.t1 * x) / 2;
  const top = layout.inner.y + 16;
  const bottom = layout.inner.y + layout.inner.h - 12; // индекс опускается ниже базовой линии
  const y = Math.min(bottom, Math.max(top, layout.sy(mid) + 5));
  return <MathText x={layout.sx(x) + 9} y={y} label="ε_i" role="aux" />;
}

export default function FitLine({ initial = { t0: 2.5, t1: 0.25 }, lock = [], show = {} }: FitLineProps) {
  const { residuals: showResid = true, loss: showLoss = true, solve: showSolve = true } = show;
  const [theta, setTheta] = useState<Theta>(initial);
  const frame = useRef<number | null>(null);
  const J = loss(theta, DATA.x, DATA.y);
  const live = useLiveText(`θ0 = ${fmt(theta.t0, 3)}, θ1 = ${fmt(theta.t1, 3)}, J = ${fmt(J)}; минимум ${fmt(J_OPT)}`);

  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
  }, []);

  const set = (key: keyof Theta) => (v: number) => setTheta((t) => ({ ...t, [key]: v }));
  const solve = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    const from = theta;
    const target = { t0: lock.includes("t0") ? theta.t0 : OPT.t0, t1: lock.includes("t1") ? theta.t1 : OPT.t1 };
    const duration = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 600;
    const start = performance.now();
    const tick = (now: number) => {
      const k = duration ? (now - start) / duration : 1;
      setTheta(towards(from, target, k));
      frame.current = k < 1 ? requestAnimationFrame(tick) : null;
    };
    frame.current = requestAnimationFrame(tick);
  };

  return (
    <div className="fit-line">
      <Plane x={[0, X_MAX]} y={[0, Y_MAX]} xStep={2} yStep={2} label="Точки данных, прямая модели и остатки">
        {showResid &&
          DATA.x.map((x, i) => <Line key={`r${i}`} from={[x, DATA.y[i]!]} to={[x, theta.t0 + theta.t1 * x]} role="aux" />)}
        <Line intercept={theta.t0} slope={theta.t1} label="ŷ = θ_0 + θ_1 x" sym="theta" />
        {DATA.x.map((x, i) => (
          <Point key={i} x={x} y={DATA.y[i]!} role="data" sym="X" />
        ))}
        {showResid && <ResidualLabel theta={theta} />}
      </Plane>
      <div className="fit-line__controls">
        <ParamSlider name="θ_0" value={theta.t0} min={-1} max={4} step={0.01} digits={3} onChange={set("t0")} sym="theta" disabled={lock.includes("t0")} />
        <ParamSlider name="θ_1" value={theta.t1} min={-0.2} max={1.2} step={0.005} digits={3} onChange={set("t1")} sym="theta" disabled={lock.includes("t1")} />
        <div className="fit-line__actions">
          {showSolve && (
            <button type="button" className="btn btn--sm" onClick={solve}>
              Показать минимум
            </button>
          )}
          <button type="button" className="btn btn--sm btn--quiet" onClick={() => setTheta(initial)}>
            Сбросить
          </button>
        </div>
        {showLoss && <Readout name="J(θ)" value={J} meter={{ max: J_SCALE, best: J_OPT }} />}
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
