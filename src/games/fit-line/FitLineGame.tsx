// Представление «Подгони прямую»: точки «Квартир», прямая ученика цветом θ, остатки карандашом;
// бегунки θ₀ и θ₁ (_kit/ParamSlider), J сейчас и «Сдать прямую». Логика — model.ts, оболочка — GameShell.
import type { ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { Line, ParamSlider, Plane, Point, Readout } from "../../widgets/_kit";
import { DEBRIEF, fitLine, fmt, KIND_NAMES, LEVELS, RANGE, STEP, type Action, type Level, type State } from "./model";

function Board({ state }: { state: State }) {
  const { level, theta } = state;
  const yMax = Math.max(...level.y) > 18 ? 24 : 20;
  return (
    <figure className="game__figure">
      <Plane
        x={[20, 120]}
        y={[0, yMax]}
        xStep={20}
        yStep={4}
        height={{ ratio: 0.7, min: 240, max: 480 }}
        initialWidth={560}
        xLabel="площадь, м²"
        yLabel="цена, млн ₽"
        label={`Квартиры: ${level.x.length} точек «площадь — цена», прямая ученика и вертикальные отрезки от точек до неё.`}
      >
        {level.x.map((x, i) => (
          <Line key={`r${i}`} from={[x, level.y[i]!]} to={[x, theta.t0 + theta.t1 * x]} role="aux" />
        ))}
        <Line intercept={theta.t0} slope={theta.t1} role="param" />
        {level.x.map((x, i) => (
          <Point key={i} x={x} y={level.y[i]!} role="data" />
        ))}
      </Plane>
      <figcaption className="game__legend">
        <span className="key"><span className="game__swatch game__swatch--s1" aria-hidden="true" />квартира</span>
        <span className="key"><span className="game__swatch game__swatch--s2" aria-hidden="true" />ваша прямая</span>
        <span className="key"><span className="game__swatch game__swatch--target" aria-hidden="true" />ошибка — отрезок до прямой</span>
      </figcaption>
    </figure>
  );
}

function Controls({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const done = fitLine.status(state) === "solved";
  const slopeOnly = state.level.kind === "slope";
  return (
    <div className="game-fit">
      <p className="game-fit__model">
        цена = <i>θ</i>
        <sub>0</sub> + <i>θ</i>
        <sub>1</sub> · площадь
      </p>
      <ParamSlider name="θ_0" value={state.theta.t0} min={RANGE.t0[0]} max={RANGE.t0[1]} step={STEP.t0} digits={1} disabled={done || slopeOnly} onChange={(v) => dispatch({ type: "set", which: "t0", value: v })} />
      <ParamSlider name="θ_1" value={state.theta.t1} min={RANGE.t1[0]} max={RANGE.t1[1]} step={STEP.t1} digits={3} disabled={done} onChange={(v) => dispatch({ type: "set", which: "t1", value: v })} />
      {slopeOnly && <p className="game-fit__note">На этом уровне прямая проходит через ноль: θ₀{"\u00a0"}={"\u00a0"}0.</p>}
      <Readout name="J" value={fitLine.loss(state)} digits={1} />
      <button type="button" className="btn btn--sm btn--primary" disabled={done} onClick={() => dispatch({ type: "submit" })}>
        Сдать прямую
      </button>
    </div>
  );
}

const view: ShellView<State, Action, Level> = {
  reset: { type: "reset" },
  hint: { type: "hint" },
  levelName: (l) => KIND_NAMES[l.kind],
  feedback: (s) => fitLine.feedback(s),
  stats: (s) => [
    ["Сдано", s.submits],
    ["Точность", fitLine.status(s) === "solved" ? `${fmt(100 * fitLine.score(s), 0)} %` : "—"],
  ],
  actions: (s) => s.moves + s.submits,
  hints: (s) => s.hints,
  debrief: (l) => DEBRIEF[l.kind],
  board: (s) => <Board state={s} />,
  controls: (s, dispatch) => <Controls state={s} dispatch={dispatch} />,
  keys: [
    ["Стрелки на бегунке", "сдвинуть на шаг; Page Up и Page Down — на десять шагов"],
    ["Tab", "перейти к следующему бегунку или кнопке"],
    ["Подсказка", "сначала на что смотреть, потом в какую сторону двигать, потом где минимум"],
  ],
};

export function FitLineGame({ seed = 1, children }: { seed?: number; children?: ReactNode }) {
  return (
    <GameShell spec={fitLine} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
