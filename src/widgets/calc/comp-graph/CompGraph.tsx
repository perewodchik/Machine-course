// Виджет «Вычислительный граф» (урок II.2): L = (θᵀx − y)², разложенная на операции. Кнопки ведут по шагам:
// прямой проход заполняет значения узлов снизу вверх, обратный — производные ∂L/∂(узел) от L к θ.
// Бегунки θ₁, θ₂ меняют входы, всё пересчитывается. Узлы — прямоугольники SVG; текущий шаг выделен ручкой.
import { useState } from "react";
import { ParamSlider, useLiveText } from "../../_kit";
import { EDGES, known, run, STEPS, type NodeId } from "./model";

export interface CompGraphProps {
  x?: readonly [number, number];
  y?: number;
}

const W = 360;
const POS: Record<NodeId, readonly [number, number]> = {
  t1: [34, 34], x1: [102, 34], t2: [180, 34], x2: [248, 34], y: [324, 34],
  p1: [68, 120], p2: [214, 120], s: [141, 200], r: [232, 270], L: [232, 340],
};
const NAME: Record<NodeId, string> = { t1: "θ₁", x1: "x₁", t2: "θ₂", x2: "x₂", y: "y", p1: "p₁", p2: "p₂", s: "s", r: "r", L: "L" };
const BW = 62;
const BH = 42;
const num = (v: number) => (Math.abs(v) < 1e-12 ? "0" : Number.isInteger(v) ? String(v) : v.toFixed(2)).replace("-", "−");

export default function CompGraph({ x = [2, 1], y = 3 }: CompGraphProps) {
  const [theta, setTheta] = useState<readonly [number, number]>([0.5, 1]);
  const [k, setK] = useState(0);
  const pass = run({ theta, x, y });
  const { values, grads } = known(k);
  const cur = k > 0 ? STEPS[k - 1]! : null;
  const curNodes = new Set<NodeId>(cur ? (cur.node === "p1" && cur.phase === "backward" ? ["p1", "p2"] : [cur.node]) : []);
  const text = cur ? `${cur.phase === "forward" ? "Прямой проход" : "Обратный проход"}, шаг ${k} из ${STEPS.length}: ${cur.text(pass)}` : "Входы заданы. Нажмите «Шаг вперёд», чтобы начать прямой проход.";
  const live = useLiveText(text);
  return (
    <div className="comp-graph">
      <svg className="comp-graph__svg" viewBox={`0 0 ${W} 370`} role="img" aria-label={`Вычислительный граф L = (θᵀx − y)². ${text}`}>
        {EDGES.map(([a, b]) => (
          <line key={`${a}-${b}`} className={["comp-graph__edge", grads.has(b) && grads.has(a) && "is-back"].filter(Boolean).join(" ")} x1={POS[a][0]} y1={POS[a][1] + BH / 2} x2={POS[b][0]} y2={POS[b][1] - BH / 2} />
        ))}
        {(Object.keys(POS) as NodeId[]).map((id) => {
          const [cx, cy] = POS[id];
          return (
            <g key={id} className={["comp-graph__node", values.has(id) && "is-known", curNodes.has(id) && "is-current", ["t1", "x1", "t2", "x2", "y"].includes(id) && "is-input"].filter(Boolean).join(" ")}>
              <rect x={cx - BW / 2} y={cy - BH / 2} width={BW} height={BH} rx={6} />
              <text x={cx} y={cy - 4} textAnchor="middle" className="comp-graph__value">
                {NAME[id]} = {values.has(id) ? num(pass.value[id]) : "?"}
              </text>
              {grads.has(id) && (
                <text x={cx} y={cy + 13} textAnchor="middle" className="comp-graph__grad">
                  ∂L: {num(pass.grad[id])}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="comp-graph__controls">
        <div className="comp-graph__group" role="group" aria-label="Шаги прохода">
          <button type="button" className="btn btn--sm" onClick={() => setK(0)} disabled={k === 0}>
            Сначала
          </button>
          <button type="button" className="btn btn--sm" onClick={() => setK(Math.max(0, k - 1))} disabled={k === 0}>
            Шаг назад
          </button>
          <button type="button" className="btn btn--sm" onClick={() => setK(Math.min(STEPS.length, k + 1))} disabled={k === STEPS.length}>
            Шаг вперёд
          </button>
        </div>
        <ParamSlider name="θ_1" value={theta[0]} min={-2} max={2} step={0.1} digits={1} role="param" onChange={(v) => setTheta([v, theta[1]])} />
        <ParamSlider name="θ_2" value={theta[1]} min={-2} max={2} step={0.1} digits={1} role="param" onChange={(v) => setTheta([theta[0], v])} />
        <p className="comp-graph__fact">{text}</p>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
