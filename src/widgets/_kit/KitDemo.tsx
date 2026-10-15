// Витрина набора на /lab: все элементы на одной плоскости. Прямая управляется ползунками и «живым числом»;
// при крайних значениях она обрезается областью графика, а подпись прячется, если прямая ушла целиком.
import { useState } from "react";
import { Ellipse, Line, ParamSlider, Plane, Point, Readout, Scrub, Vector, fmt, useLiveText } from "./index";

// те же двенадцать точек, что в прототипе рисунка регрессии (seed = 7)
const XS = [6.126, 8.575, 7.481, 2.527, 3.201, 8.362, 0.547, 7.891, 7.674, 4.711, 3.227, 3.006];
const YS = [4.632, 5.358, 5.297, 3.007, 2.154, 5.525, 0.36, 4.766, 4.315, 3.65, 2.215, 3.016];
const loss = (t0: number, t1: number) => 0.5 * XS.reduce((a, x, i) => a + (t0 + t1 * x - YS[i]!) ** 2, 0);

export default function KitDemo() {
  const [t0, setT0] = useState(2.5);
  const [t1, setT1] = useState(0.25);
  const J = loss(t0, t1);
  const live = useLiveText(`θ0 = ${fmt(t0)}, θ1 = ${fmt(t1)}, J = ${fmt(J)}`);
  return (
    <figure className="figure kit-demo">
      <Plane x={[0, 10]} y={[0, 7]} xStep={2} yStep={2} label="Двенадцать точек, прямая модели, эллипс и вектор на клетчатой плоскости">
        <Ellipse center={[2.2, 5.4]} cov={[[0.9, 0.35], [0.35, 0.4]]} k={1} role="target" sym="y" />
        <Vector from={[5.6, 0.7]} to={[8.6, 1.9]} role="aux" label="v" />
        <Line intercept={t0} slope={t1} label="ŷ = θ_0 + θ_1 x" sym="theta" />
        {XS.map((x, i) => (
          <Point key={i} x={x} y={YS[i]!} role="data" sym="X" />
        ))}
      </Plane>
      <div className="kit-demo__controls">
        <ParamSlider name="θ_0" value={t0} min={-2} max={8} step={0.05} onChange={setT0} sym="theta" />
        <ParamSlider name="θ_1" value={t1} min={-1} max={1.5} step={0.05} onChange={setT1} sym="theta" />
        <Readout name="J" value={J} meter={{ max: 40, best: loss(0.798, 0.548) }} />
      </div>
      <figcaption className="figure__caption">
        <b>Рисунок.</b> Наклон прямой&nbsp;—{" "}
        <Scrub label="наклон θ_1" value={t1} min={-1} max={1.5} step={0.05} onChange={setT1} sym="theta" />: потяните число вбок или нажмите стрелки. Прямая не выходит за&nbsp;оси при любых значениях.
        <span className="visually-hidden" aria-live="polite">
          {live}
        </span>
      </figcaption>
    </figure>
  );
}
