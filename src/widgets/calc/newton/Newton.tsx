// Виджет «Касательные Ньютона» (урок II.7): график g = f′, касательная в θₖ и её ноль θₖ₊₁. Бегунок θ₀, кнопки
// «Шаг Ньютона» и «Сначала», выбор функции; таблица итераций с числом верных знаков. Логика — model.ts.
import { useState } from "react";
import { Line, ParamSlider, Plane, Point, Polyline, fmt, useLiveText } from "../../_kit";
import { curve, digits, FN_IDS, FNS, newtonPath, type FnId } from "./model";

export interface NewtonProps {
  initial?: { fn?: FnId; x0?: number };
  /** Какие функции можно выбрать; одна — кнопок выбора нет. */
  fns?: FnId[];
}

const MAX_STEPS = 6;
const SUB = "₀₁₂₃₄₅₆₇₈₉";
/** «θ₃»: номер итерации подстрочными цифрами. */
const th = (i: number) => `θ${String(i).replace(/\d/g, (c) => SUB[Number(c)]!)}`;

export default function Newton({ initial = {}, fns = FN_IDS }: NewtonProps) {
  const [fnId, setFnId] = useState<FnId>(initial.fn ?? fns[0] ?? "logistic");
  const fn = FNS[fnId];
  const [x0, setX0] = useState(initial.x0 ?? fn.x0);
  const [k, setK] = useState(0);
  const setFn = (id: FnId) => {
    setFnId(id);
    setX0(FNS[id].x0);
    setK(0);
  };
  const path = newtonPath(fn, x0, k);
  const t = path[path.length - 1]!;
  const out = t < fn.x[0] || t > fn.x[1] || !Number.isFinite(t);
  const fact = out
    ? "Итерация ушла за пределы рисунка: вдали от минимума касательная почти горизонтальна, и шаг огромный."
    : Math.abs(t - fn.root) < 1e-10
      ? `Минимум найден: θ* = ${fmt(fn.root, 6)}.`
      : `Ноль касательной — следующая точка ${th(k + 1)}.`;
  const live = useLiveText(`${fn.name}: шаг ${k}, θ = ${fmt(t, 6)}, g(θ) = ${fmt(fn.g(t), 4)}. ${fact}`);
  const pts = curve(fn);

  return (
    <div className="newton">
      <Plane x={fn.x} y={fn.y} xLabel="θ" yLabel="g" xStep={1} yStep={fn.y[1] - fn.y[0] > 20 ? 10 : fn.y[1] - fn.y[0] > 6 ? 2 : 0.5} label={`График производной g = f′ для ${fn.name} и касательные метода Ньютона из θ₀ = ${fmt(x0, 2)}`}>
        <Polyline points={pts} role="data" />
        {path.slice(0, -1).map((a, i) => {
          const b = path[i + 1]!;
          return [<Line key={`t${i}`} from={[a, fn.g(a)]} to={[b, 0]} role="param" />, <Line key={`v${i}`} from={[b, 0]} to={[b, fn.g(b)]} role="aux" />];
        })}
        {path.map((a, i) => (Number.isFinite(a) ? <Point key={i} x={a} y={fn.g(a)} role="param" label={i === 0 || i === path.length - 1 ? th(i) : undefined} /> : null))}
      </Plane>
      <div className="newton__controls">
        <ParamSlider name="θ₀" value={x0} min={fn.x[0]} max={fn.x[1]} step={0.1} digits={1} onChange={(v) => { setX0(v); setK(0); }} />
        <div className="newton__group">
          <button type="button" className="btn btn--sm btn--primary" disabled={k >= MAX_STEPS || out} onClick={() => setK(k + 1)}>
            Шаг Ньютона
          </button>
          <button type="button" className="btn btn--sm" disabled={k === 0} onClick={() => setK(0)}>
            Сначала
          </button>
        </div>
        {fns.length > 1 && (
          <div className="newton__group" role="group" aria-label="Что минимизируем">
            {fns.map((id) => (
              <button key={id} type="button" className="btn btn--sm" aria-pressed={fnId === id} onClick={() => setFn(id)}>
                {FNS[id].name}
              </button>
            ))}
          </div>
        )}
        <table className="newton__table">
          <caption className="visually-hidden">Итерации метода Ньютона</caption>
          <thead>
            <tr>
              <th scope="col">шаг</th>
              <th scope="col">θ</th>
              <th scope="col">g(θ)</th>
              <th scope="col">верных знаков</th>
            </tr>
          </thead>
          <tbody>
            {path.map((a, i) => (
              <tr key={i}>
                <td>{i}</td>
                <td>{Number.isFinite(a) && Math.abs(a) < 1e6 ? fmt(a, 6) : "—"}</td>
                <td>{Number.isFinite(a) && Math.abs(a) < 1e6 ? fmt(fn.g(a), 4) : "—"}</td>
                <td>{Number.isFinite(a) ? digits(fn, a) : 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="newton__fact">{fact}</p>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
