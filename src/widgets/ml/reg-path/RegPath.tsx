// Виджет «Путь регуляризации» (урок 2.3 «Основ ML»): слева — плоскость весов площади и комнат, эллипсы уровня J,
// круг (L2) или ромб (L1) ограничения радиуса t, решение и его след при сжатии ограничения. Справа — путь пяти весов
// «Квартир» от lg λ и RMSE на обучении и валидации. Ручки: тип штрафа, t, lg λ, стандартизация.
import { useMemo, useState } from "react";
import { Ellipse, Line, ParamSlider, Plane, Point, Polyline, Readout, fmt, useLiveText, type Role } from "../../_kit";
import { constrained, design, NAMES, path, quadratic, type Penalty } from "./model";

const ROLES: { role: Role; dashed?: boolean }[] = [{ role: "data" }, { role: "param" }, { role: "target" }, { role: "aux" }, { role: "aux", dashed: true }];

const d2 = design(true, [0, 1]);
const Q = quadratic(d2);
const inv = (() => {
  const [[a, b], [, c]] = Q.H;
  const det = a * c - b * b;
  return [[c / det, -b / det], [-b / det, a / det]] as [[number, number], [number, number]];
})();
const T_MAX = Math.abs(Q.ols[0]!) + Math.abs(Q.ols[1]!);

export default function RegPath() {
  const [pen, setPen] = useState<Penalty>("l1");
  const [t, setT] = useState(1.5);
  const [lg, setLg] = useState(-1);
  const [standardize, setStd] = useState(true);
  const sol = useMemo(() => constrained(d2, pen, t), [pen, t]);
  const trail = useMemo(() => Array.from({ length: 41 }, (_, k) => constrained(d2, pen, (T_MAX * k) / 40)).map((v) => [v[0]!, v[1]!] as [number, number]), [pen]);
  const full = useMemo(() => design(standardize), [standardize]);
  const p = useMemo(() => path(full, pen), [full, pen]);
  const k = Math.round((lg + 3) * 20);
  const cur = p[k]!;
  const ys = p.flatMap((q) => q.theta);
  const yLo = Math.min(0, ...ys) * 1.1 - 0.05;
  const yHi = Math.max(0, ...ys) * 1.1 + 0.05;
  const eHi = Math.max(...p.map((q) => q.val), ...p.map((q) => q.train)) * 1.05;
  const shape: [number, number][] = pen === "l1" ? [[t, 0], [0, t], [-t, 0], [0, -t], [t, 0]] : [];
  const live = useLiveText(`${pen === "l1" ? "Лассо" : "Гребневая"}: при ограничении ${fmt(t)} веса площади и комнат ${fmt(sol[0]!)} и ${fmt(sol[1]!)}; при lg λ = ${fmt(lg, 1)} ненулевых весов ${cur.theta.filter((v) => v !== 0).length} из 5, RMSE на валидации ${fmt(cur.val, 3)}`);
  return (
    <div className="reg-path">
      <div className="reg-path__actions" role="group" aria-label="Штраф">
        <button type="button" className="btn btn--sm" aria-pressed={pen === "l1"} onClick={() => setPen("l1")}>
          L1 (лассо)
        </button>
        <button type="button" className="btn btn--sm" aria-pressed={pen === "l2"} onClick={() => setPen("l2")}>
          L2 (гребневая)
        </button>
      </div>
      <div className="reg-path__plots">
        <Plane x={[-0.5, 3.5]} y={[-1, 1.5]} xStep={0.5} yStep={0.5} equal xLabel="θ_{площадь}" yLabel="θ_{комнат}" height={{ ratio: 0.7, min: 200, max: 320 }} initialWidth={340} label={`Плоскость весов площади и комнат: линии уровня J, ${pen === "l1" ? "ромб" : "круг"} ограничения радиуса ${fmt(t)}, решение (${fmt(sol[0]!)}, ${fmt(sol[1]!)})`}>
          {[0.02, 0.08, 0.25, 0.6, 1.2].map((c, i) => (
            <Ellipse key={i} center={[Q.ols[0]!, Q.ols[1]!]} cov={[[2 * c * inv[0][0], 2 * c * inv[0][1]], [2 * c * inv[1][0], 2 * c * inv[1][1]]]} role="aux" />
          ))}
          {pen === "l2" ? <Ellipse center={[0, 0]} radii={[t, t]} role="param" /> : <Polyline points={shape} role="param" />}
          <Polyline points={trail} role="target" dashed />
          <Point x={Q.ols[0]!} y={Q.ols[1]!} role="aux" r={3} />
          <Point x={sol[0]!} y={sol[1]!} role="target" r={5} />
        </Plane>
        <div className="reg-path__right">
          <Plane x={[-3, 1]} y={[yLo, yHi]} xStep={1} yStep={yHi - yLo > 3 ? 1 : 0.5} xLabel="lg λ" yLabel="вес" height={{ ratio: 0.55, min: 180, max: 230 }} initialWidth={360} label={`Путь весов пяти признаков от lg λ; при lg λ = ${fmt(lg, 1)}: ${NAMES.map((n, j) => `${n} ${fmt(cur.theta[j]!)}`).join(", ")}`}>
            {NAMES.map((_, j) => <Polyline key={j} points={p.map((q) => [q.lg, q.theta[j]!] as [number, number])} role={ROLES[j]!.role} dashed={ROLES[j]!.dashed} />)}
            <Line from={[lg, yLo]} to={[lg, yHi]} role="aux" />
          </Plane>
          <Plane x={[-3, 1]} y={[0, eHi]} xStep={1} yStep={eHi > 2 ? 1 : 0.5} xLabel="lg λ" yLabel="RMSE" height={{ ratio: 0.4, min: 150, max: 190 }} initialWidth={360} label={`RMSE на обучении и на валидации от lg λ; при lg λ = ${fmt(lg, 1)} — ${fmt(cur.train, 3)} и ${fmt(cur.val, 3)}`}>
            <Polyline points={p.map((q) => [q.lg, q.train] as [number, number])} role="data" />
            <Polyline points={p.map((q) => [q.lg, q.val] as [number, number])} role="target" dashed />
            <Line from={[lg, 0]} to={[lg, eHi]} role="aux" />
          </Plane>
        </div>
      </div>
      <p className="reg-path__legend">слева: эллипсы — линии уровня J, {pen === "l1" ? "ромб" : "круг"} — ограничение, крупная точка — решение, штрих — его путь при сжатии ограничения. Справа: веса — площадь (бирюзовый), комнат (оранжевый), этаж (пурпурный), до метро (серый), возраст (серый штрих); внизу RMSE на обучении (сплошная) и валидации (штрих)</p>
      <div className="reg-path__controls">
        <ParamSlider name="ограничение t" value={t} min={0.05} max={Math.ceil(T_MAX * 10) / 10} step={0.05} role="param" onChange={setT} />
        <ParamSlider name="lg λ" value={lg} min={-3} max={1} step={0.05} digits={2} role="aux" onChange={setLg} />
        <label className="reg-path__check">
          <input type="checkbox" checked={!standardize} onChange={(e) => setStd(!e.target.checked)} /> площадь в см² без стандартизации
        </label>
        <div className="reg-path__readouts">
          <Readout name="ненулевых весов" value={cur.theta.filter((v) => v !== 0).length} digits={0} />
          <Readout name="RMSE обуч." value={cur.train} digits={3} />
          <Readout name="RMSE вал." value={cur.val} digits={3} />
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
