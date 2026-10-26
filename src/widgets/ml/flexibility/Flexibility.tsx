// Виджет «Гибкость модели» (урок 1.3 «Основ ML»): цена м² от пути до метро, две ручки сложности. Полином — степень
// p от 1 до 15. LWR — ширина окна τ (логарифмическая шкала) и точка запроса x: размер обучающей точки — её вес w⁽ⁱ⁾,
// у x — локальная прямая θ(x), штриховая — вся кривая LWR. Справа внизу — RMSE на обучении и на валидации.
import { useMemo, useState } from "react";
import { Line, ParamSlider, Plane, Point, Polyline, Readout, fmt, useLiveText } from "../../_kit";
import { localLine, loadData, lwrModel, polyModel } from "./model";

export interface FlexibilityProps {
  mode?: "poly" | "lwr";
}

const data = loadData();
const XS = Array.from({ length: 157 }, (_, i) => 1 + i / 4);
const clampY = (v: number) => Math.max(150, Math.min(350, v));

export default function Flexibility({ mode: mode0 = "poly" }: FlexibilityProps) {
  const [mode, setMode] = useState(mode0);
  const [p, setP] = useState(2);
  const [logTau, setLogTau] = useState(0.5);
  const [q, setQ] = useState(20);
  const tau = 10 ** logTau;
  const fit = useMemo(() => (mode === "poly" ? polyModel(data, p) : lwrModel(data, tau)), [mode, p, tau]);
  const curve = useMemo(() => XS.map((x) => [x, clampY(fit.predict(x))] as [number, number]), [fit]);
  const local = mode === "lwr" ? localLine(data.train, q, tau) : null;
  const half = Math.min(8, Math.max(1.5, 2 * tau));
  const at = (x: number) => local!.theta[0] + local!.theta[1] * x;
  const knob = mode === "poly" ? `степень ${p}` : `τ = ${fmt(tau)} мин`;
  const live = useLiveText(`${mode === "poly" ? "Полином" : "LWR"}, ${knob}: RMSE на обучении ${fmt(fit.train)}, на валидации ${fmt(fit.val)}`);
  return (
    <div className="flexibility">
      <div className="flexibility__actions" role="group" aria-label="Модель">
        <button type="button" className="btn btn--sm" aria-pressed={mode === "poly"} onClick={() => setMode("poly")}>
          полином
        </button>
        <button type="button" className="btn btn--sm" aria-pressed={mode === "lwr"} onClick={() => setMode("lwr")}>
          локально взвешенная
        </button>
      </div>
      <Plane x={[0, 41]} y={[160, 340]} xStep={5} yStep={20} xLabel="до метро, мин" yLabel="цена м²" height={{ ratio: 0.6, min: 240, max: 380 }} initialWidth={660} label={`Цена квадратного метра от пути до метро: 56 обучающих точек, 24 валидационных, ${mode === "poly" ? `полином степени ${p}` : `кривая LWR при τ = ${fmt(tau)} мин и локальная прямая в точке ${fmt(q, 1)} мин`}`}>
        {data.val.map(([x, y], i) => <Point key={`v${i}`} x={x} y={y} role="aux" r={2.5} />)}
        {data.train.map(([x, y], i) => <Point key={`t${i}`} x={x} y={y} role="data" r={local ? 2.5 + 3.5 * local.w[i]! : 3.5} />)}
        <Polyline points={curve} role="target" dashed={mode === "lwr"} />
        {local && <Line from={[q - half, at(q - half)]} to={[q + half, at(q + half)]} role="param" />}
        {local && <Point x={q} y={at(q)} role="param" r={5} />}
      </Plane>
      <p className="flexibility__legend">
        {mode === "poly" ? "крупные точки — обучение, мелкие — валидация; кривая — полином" : "размер точки — её вес в точке запроса; отрезок — локальная прямая θ(x), штриховая — кривая LWR"}
      </p>
      <div className="flexibility__controls">
        {mode === "poly" ? (
          <ParamSlider name="степень p" value={p} min={1} max={15} step={1} digits={0} role="param" onChange={setP} />
        ) : (
          <>
            <ParamSlider name="lg τ" value={logTau} min={-0.5} max={2} step={0.05} role="param" onChange={setLogTau} />
            <ParamSlider name="запрос x" value={q} min={1} max={40} step={0.5} digits={1} role="aux" onChange={setQ} />
          </>
        )}
        <div className="flexibility__readouts">
          {mode === "lwr" && <Readout name="τ, мин" value={tau} digits={tau < 10 ? 2 : 0} />}
          <Readout name="RMSE обуч." value={fit.train} digits={2} />
          <Readout name="RMSE вал." value={fit.val} digits={2} />
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
