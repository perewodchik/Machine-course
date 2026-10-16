// Виджет «Единичные шары норм» (урок I.2): ромб ‖x‖₁ = 1, круг ‖x‖₂ = 1 и квадрат ‖x‖∞ = 1 цветами трёх норм;
// бегунки x₁, x₂ двигают точку, показания — три нормы и в каком «шаре» точка лежит. Логика — model.ts.
import { useState } from "react";
import { Ellipse, Line, ParamSlider, Plane, Point, Readout, fmt, useLiveText } from "../../_kit";
import { BALL, norm, type Vec2 } from "./model";

export interface NormBallsProps {
  initial?: Vec2;
}

function Outline({ pts, role }: { pts: Vec2[]; role: "data" | "target" }) {
  return (
    <>
      {pts.slice(1).map((p, i) => (
        <Line key={i} from={pts[i]!} to={p} role={role} />
      ))}
    </>
  );
}

export default function NormBalls({ initial = [0.6, 0.5] }: NormBallsProps) {
  const [x, setX] = useState<Vec2>(initial);
  const n = { l1: norm("l1", x), l2: norm("l2", x), linf: norm("linf", x) };
  const inside = (v: number) => (v <= 1 + 1e-9 ? "внутри" : "снаружи");
  const live = useLiveText(`x = (${fmt(x[0], 2)}, ${fmt(x[1], 2)}): ‖x‖₁ = ${fmt(n.l1, 2)}, ‖x‖₂ = ${fmt(n.l2, 2)}, ‖x‖∞ = ${fmt(n.linf, 2)}.`);
  return (
    <div className="norm-balls">
      <Plane x={[-1.6, 1.6]} y={[-1.6, 1.6]} xStep={0.5} yStep={0.5} height={{ ratio: 1, min: 240, max: 460 }} equal label="Единичные шары трёх норм: ромб — ℓ₁, круг — ℓ₂, квадрат — ℓ∞; точка x.">
        <Outline pts={BALL.linf} role="target" />
        <Ellipse center={[0, 0]} radii={[1, 1]} role="param" />
        <Outline pts={BALL.l1} role="data" />
        <Point x={x[0]} y={x[1]} role="aux" label="x" r={6} />
      </Plane>
      <div className="norm-balls__controls">
        <ParamSlider name="x_1" value={x[0]} min={-1.5} max={1.5} step={0.05} role="aux" onChange={(v) => setX([v, x[1]])} />
        <ParamSlider name="x_2" value={x[1]} min={-1.5} max={1.5} step={0.05} role="aux" onChange={(v) => setX([x[0], v])} />
      </div>
      <div className="norm-balls__readouts">
        <Readout name="‖x‖_1" value={n.l1} hint={`${inside(n.l1)} ромба`} />
        <Readout name="‖x‖_2" value={n.l2} hint={`${inside(n.l2)} круга`} />
        <Readout name="‖x‖_∞" value={n.linf} hint={`${inside(n.linf)} квадрата`} />
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
