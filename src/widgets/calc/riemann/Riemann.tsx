// Виджет «Сумма прямоугольников → площадь» (урок 0.7): площадь под графиком приближается суммой n прямоугольников.
// Бегунок n и выбор точки (левая, средняя, правая) — у ученика; сумма и интеграл — в показаниях. Логика — model.ts.
import { useState } from "react";
import { Line, ParamSlider, Plane, Polygon, Readout, fmt, useLiveText } from "../../_kit";
import { curve, FNS, rects, riemann, RULE_NAMES, type FnId, type Rule } from "./model";

export interface RiemannProps {
  initial?: { fn?: FnId; n?: number; rule?: Rule };
  /** Какие функции можно выбрать; одна — кнопок выбора нет. */
  fns?: FnId[];
  /** Показывать точное значение интеграла и ошибку суммы. */
  show?: { exact?: boolean };
}

const N_MAX = 64;
/** «ошибка 0.0123»; меньше 10⁻⁴ при четырёх знаках выглядело бы нулём. */
const errorText = (e: number) => (e < 1e-4 ? "ошибка меньше 0.0001" : `ошибка ${fmt(e, 4)}`);
const AT: Record<Rule, string> = { left: "левой", mid: "средней", right: "правой" };

function FnLabel({ id }: { id: FnId }) {
  const [base, sup] = FNS[id].label;
  return (
    <span className="riemann__fn" aria-hidden="true">
      <i>{base}</i>
      <sup>{sup}</sup>
    </span>
  );
}

export default function Riemann({ initial = {}, fns = ["square", "exp", "gauss"], show = {} }: RiemannProps) {
  const { exact: showExact = true } = show;
  const [fnId, setFn] = useState<FnId>(initial.fn ?? fns[0] ?? "square");
  const [n, setN] = useState(initial.n ?? 4);
  const [rule, setRule] = useState<Rule>(initial.rule ?? "left");
  const fn = FNS[fnId];
  const sum = riemann(fn, n, rule);
  const pts = curve(fn);
  const live = useLiveText(`${fn.name} от ${fn.a} до ${fn.b}: ${n} прямоугольников, высота в ${AT[rule]} точке; сумма площадей ${fmt(sum, 4)}${showExact ? `, интеграл ${fmt(fn.exact, 4)}` : ""}`);

  return (
    <div className="riemann">
      <Plane x={[fn.a, fn.b]} y={[0, fn.yMax]} xStep={fn.b - fn.a > 4 ? 2 : 1} yStep={fn.yMax > 2 ? 1 : 0.5} label={`График ${fn.name} на отрезке от ${fn.a} до ${fn.b} и ${n} прямоугольников под ним`}>
        {rects(fn, n, rule).map((r, i) => (
          <Polygon
            key={i}
            tone="pen"
            points={[
              [r.x0, 0],
              [r.x0, r.h],
              [r.x1, r.h],
              [r.x1, 0],
            ]}
          />
        ))}
        {pts.slice(1).map((p, i) => (
          <Line key={`c${i}`} from={pts[i]!} to={p} role="data" />
        ))}
      </Plane>
      <div className="riemann__controls">
        <ParamSlider name="n" value={n} min={1} max={N_MAX} step={1} digits={0} onChange={(v) => setN(Math.round(v))} />
        <div className="riemann__group" role="group" aria-label="Высота прямоугольника — значение функции в точке">
          {(["left", "mid", "right"] as const).map((r) => (
            <button key={r} type="button" className="btn btn--sm" aria-pressed={rule === r} onClick={() => setRule(r)}>
              {RULE_NAMES[r]}
            </button>
          ))}
        </div>
        {fns.length > 1 && (
          <div className="riemann__group" role="group" aria-label="Функция">
            {fns.map((id) => (
              <button key={id} type="button" className="btn btn--sm" aria-pressed={fnId === id} aria-label={FNS[id].name} onClick={() => setFn(id)}>
                <FnLabel id={id} />
              </button>
            ))}
          </div>
        )}
        <Readout name="S_n" value={sum} digits={4} />
        {showExact && <Readout name="∫" value={fn.exact} digits={4} hint={errorText(Math.abs(sum - fn.exact))} />}
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
