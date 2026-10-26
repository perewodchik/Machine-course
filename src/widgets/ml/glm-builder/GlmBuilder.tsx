// Виджет «Конструктор GLM» (урок 1.6 «Основ ML»): выбор распределения ответа заполняет таблицу экспоненциального
// семейства; ниже — данные с одним признаком и кривая E[y | x] при η = θ₀ + θ₁x, справа — распределение p(y | x) в
// точке запроса. Градиент на объекте у всех канонических GLM один: (h_θ(x) − y) x. У Пуассона отклик можно
// подменить тождественным — λ уходит в минус, и правдоподобие не определено.
import { useState } from "react";
import { Line, ParamSlider, Plane, Point, Polyline, Readout, fmt, useLiveText, usePlane } from "../../_kit";
import { categoricalProbs, DATA, distribution, fitted, LABELS, meanLogLik, predict, TABLE, type Dist } from "./model";

const DISTS: Dist[] = ["normal", "bernoulli", "poisson", "categorical"];
const VIEW: Record<Dist, { x: [number, number]; y: [number, number]; xStep: number; yStep: number; t0: [number, number, number]; t1: [number, number, number]; q: [number, number, number] }> = {
  normal: { x: [20, 125], y: [0, 18], xStep: 20, yStep: 3, t0: [-5, 8, 0.05], t1: [0, 0.2, 0.001], q: [25, 120, 1] },
  bernoulli: { x: [20, 125], y: [-0.1, 1.1], xStep: 20, yStep: 0.5, t0: [-25, 5, 0.1], t1: [0, 0.4, 0.002], q: [25, 120, 1] },
  poisson: { x: [-0.5, 15.5], y: [0, 16], xStep: 3, yStep: 4, t0: [-2, 3, 0.01], t1: [-0.2, 0.5, 0.002], q: [0, 15, 1] },
  categorical: { x: [20, 125], y: [-0.05, 1.05], xStep: 20, yStep: 0.5, t0: [0, 0, 1], t1: [0, 0, 1], q: [25, 120, 1] },
};
const ROLE = ["data", "param", "target"] as const;

function Bars({ bars, discrete }: { bars: { y: number; p: number }[]; discrete: boolean }) {
  const { layout } = usePlane();
  if (!discrete) return <Polyline points={bars.map((b) => [b.y, b.p] as [number, number])} role="param" />;
  return (
    <g aria-hidden="true">
      {bars.map((b) => {
        const x0 = layout.sx(b.y - 0.35);
        const top = layout.sy(b.p);
        return <rect key={b.y} className="glm-builder__bar" x={x0} y={top} width={layout.sx(b.y + 0.35) - x0} height={layout.sy(0) - top} />;
      })}
    </g>
  );
}

export default function GlmBuilder() {
  const [d, setD] = useState<Dist>("poisson");
  const [theta, setTheta] = useState<number[]>(() => fitted("poisson"));
  const [canonical, setCanonical] = useState(true);
  const [q, setQ] = useState(8);
  const v = VIEW[d];
  const choose = (next: Dist) => {
    setD(next);
    setCanonical(true);
    setTheta(fitted(next));
    setQ(next === "poisson" ? 8 : 70);
  };
  const toggleCanonical = (c: boolean) => {
    setCanonical(c);
    setTheta(c ? fitted("poisson") : [-1, 0.45]);
  };
  const xs = Array.from({ length: 161 }, (_, i) => v.x[0] + ((v.x[1] - v.x[0]) * i) / 160);
  const clampY = (y: number) => Math.max(v.y[0] - 5, Math.min(v.y[1] + 5, y));
  const curves = d === "categorical" ? [0, 1, 2].map((j) => xs.map((x) => [x, categoricalProbs(x)[j]!] as [number, number])) : [xs.map((x) => [x, clampY(predict(d, theta, x, canonical))] as [number, number])];
  const ll = meanLogLik(d, theta, canonical);
  const bars = distribution(d, theta, q, canonical);
  const discrete = d !== "normal";
  const row = TABLE[d];
  const { x, y } = DATA[d];
  const h = d === "categorical" ? null : predict(d, theta, q, canonical);
  const negative = d === "poisson" && !canonical && xs.some((t) => predict(d, theta, t, false) < 0);
  const live = useLiveText(`${row.name}: ${LABELS[d].story}. ${h === null ? "" : `Прогноз в точке ${fmt(q, 0)}: ${fmt(h)}. `}${ll === null ? (d === "categorical" ? "" : "Правдоподобие не определено: λ < 0.") : `ℓ/n = ${fmt(ll, 3)}.`}`);
  return (
    <div className="glm-builder">
      <div className="glm-builder__actions" role="group" aria-label="Распределение ответа">
        {DISTS.map((k) => (
          <button key={k} type="button" className="btn btn--sm" aria-pressed={d === k} onClick={() => choose(k)}>
            {TABLE[k].name}
          </button>
        ))}
      </div>
      <table className="glm-builder__table">
        <caption className="visually-hidden">Экспоненциальное семейство: {row.name}</caption>
        <tbody>
          <tr><th scope="row">T(y)</th><td>{row.T}</td></tr>
          <tr><th scope="row">естественный параметр</th><td>{row.eta}</td></tr>
          <tr><th scope="row">нормировка</th><td>{row.a}, {row.b}</td></tr>
          <tr><th scope="row">отклик</th><td>{d === "poisson" && !canonical ? "h = η (тождественный, неканонический)" : row.response}</td></tr>
          <tr><th scope="row">градиент на объекте</th><td>{d === "poisson" && !canonical ? "не (h − y)x: отклик не канонический" : "(h(x) − y) x — у всех канонических GLM"}</td></tr>
        </tbody>
      </table>
      <div className="glm-builder__plots">
        <Plane x={v.x} y={v.y} xStep={v.xStep} yStep={v.yStep} xLabel={LABELS[d].x} yLabel={LABELS[d].y} height={{ ratio: 0.62, min: 220, max: 340 }} initialWidth={440} label={`${LABELS[d].story}: ${x.length} объектов и кривая E[y | x]`}>
          {x.map((xi, i) => {
            const jitter = d === "poisson" ? (((i * 37) % 23) / 22 - 0.5) * 0.5 : 0;
            const yy = d === "categorical" ? (y[i]! === 2 ? 1 : y[i]! === 1 ? 0.5 : 0) + (((i * 37) % 23) / 22 - 0.5) * 0.06 : d === "bernoulli" ? y[i]! + (((i * 37) % 23) / 22 - 0.5) * 0.06 : y[i]!;
            return <Point key={i} x={xi + jitter} y={yy} role={d === "categorical" ? ROLE[y[i]!]! : "data"} r={2.25} />;
          })}
          {curves.map((pts, j) => <Polyline key={j} points={pts} role={d === "categorical" ? ROLE[j]! : "param"} />)}
          <Line from={[q, v.y[0]]} to={[q, v.y[1]]} role="aux" />
        </Plane>
        <Plane x={d === "normal" ? [(h ?? 0) - 4, (h ?? 0) + 4] : d === "poisson" ? [-0.5, 15.5] : [-0.5, d === "bernoulli" ? 1.5 : 2.5]} y={[0, d === "normal" ? 0.45 : 1]} xStep={d === "normal" ? 2 : d === "poisson" ? 3 : 1} yStep={d === "normal" ? 0.1 : 0.25} xLabel="y" yLabel="p(y | x)" height={{ ratio: 0.62, min: 220, max: 340 }} initialWidth={440} label={`Распределение ответа при x = ${fmt(q, 0)}`}>
          {bars.length > 0 && <Bars bars={bars} discrete={discrete} />}
        </Plane>
      </div>
      <p className="glm-builder__legend">
        слева — данные и прогноз E[y | x]{d === "categorical" ? " трёх сегментов (эконом, комфорт, бизнес снизу вверх)" : ""}, вертикаль — точка запроса; справа — распределение ответа в ней
      </p>
      <div className="glm-builder__controls">
        {d === "categorical" ? (
          <p className="glm-builder__note">Веса здесь — оптимальные: у трёх классов шесть весов, а softmax-регрессия подробно — в уроке 1.5.</p>
        ) : (
          <>
            <ParamSlider name="θ_0" value={theta[0]!} min={v.t0[0]} max={v.t0[1]} step={v.t0[2]} digits={v.t0[2] < 0.05 ? 2 : 1} role="param" onChange={(t) => setTheta((th) => [t, th[1]!])} />
            <ParamSlider name="θ_1" value={theta[1]!} min={v.t1[0]} max={v.t1[1]} step={v.t1[2]} digits={3} role="param" onChange={(t) => setTheta((th) => [th[0]!, t])} />
          </>
        )}
        <ParamSlider name="запрос x" value={q} min={v.q[0]} max={v.q[1]} step={v.q[2]} digits={0} role="aux" onChange={setQ} />
        <div className="glm-builder__actions">
          <button type="button" className="btn btn--sm" onClick={() => setTheta(fitted(d))} disabled={d === "categorical" || (d === "poisson" && !canonical)}>
            К максимуму ℓ
          </button>
          {d === "poisson" && (
            <label className="glm-builder__check">
              <input type="checkbox" checked={!canonical} onChange={(e) => toggleCanonical(!e.target.checked)} /> тождественный отклик λ = θᵀx
            </label>
          )}
        </div>
        <div className="glm-builder__readouts">
          {h !== null && <Readout name="прогноз E[y | x]" value={h} digits={2} />}
          {ll !== null && <Readout name="ℓ/n" value={ll} digits={3} />}
          {negative && <p className="glm-builder__warn">λ &lt; 0 при части x: такого пуассоновского распределения нет, правдоподобие не определено.</p>}
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
