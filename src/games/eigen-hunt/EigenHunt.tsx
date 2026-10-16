// Представление «Охоты на собственные векторы»: на поле — прямая через v карандашом, v цветом параметра, Av цветом
// ответа и образ единичной окружности — эллипс, в который A переводит все единичные векторы. Найденные направления
// остаются на поле. Справа — бегунок угла, «Поймать», выбор λ и «Таких направлений нет». Логика — model.ts.
import type { ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { Ellipse, Line, ParamSlider, Plane, Vector } from "../../widgets/_kit";
import { apply, DEBRIEF, eigenHunt, KIND_NAMES, lambdaOptions, LEVELS, lineAngle, unit, type Action, type Level, type State } from "./model";

const f = (x: number) => String(Math.round(x * 100) / 100).replace("-", "−");

function Board({ state }: { state: State }) {
  const { level, angle } = state;
  const v = unit(angle);
  const w = apply(level.A, v);
  // поле вмещает образ единичной окружности: его большая полуось не длиннее нормы Фробениуса A
  const fro = Math.hypot(level.A[0][0], level.A[0][1], level.A[1][0], level.A[1][1]);
  const R = Math.min(6, Math.max(2.5, Math.ceil(fro) + 0.5));
  const cov = [
    [level.A[0][0] ** 2 + level.A[0][1] ** 2, level.A[0][0] * level.A[1][0] + level.A[0][1] * level.A[1][1]],
    [level.A[0][0] * level.A[1][0] + level.A[0][1] * level.A[1][1], level.A[1][0] ** 2 + level.A[1][1] ** 2],
  ] as const;
  const det = level.A[0][0] * level.A[1][1] - level.A[0][1] * level.A[1][0];
  return (
    <figure className="game__figure">
      <Plane x={[-R, R]} y={[-R, R]} xStep={1} yStep={1} equal height={{ ratio: 1, min: 240, max: 520 }} margin={{ l: 12, r: 12, t: 12, b: 12 }} initialWidth={520} label={`Поле игры: v под углом ${angle}°, Av = (${f(w[0])}, ${f(w[1])}); угол между прямыми v и Av — ${f(lineAngle(level.A, angle))}°.`}>
        {Math.abs(det) > 1e-9 && <Ellipse center={[0, 0]} cov={cov} role="aux" />}
        {state.found.map((x) => {
          const u = unit(x.angle);
          return <Line key={x.angle} from={[-10 * u[0], -10 * u[1]]} to={[10 * u[0], 10 * u[1]]} role="data" />;
        })}
        <Line from={[-10 * v[0], -10 * v[1]]} to={[10 * v[0], 10 * v[1]]} role="aux" />
        <Vector to={w} role="target" label="Av" />
        <Vector to={v} role="param" label="v" />
      </Plane>
      <figcaption className="game__legend">
        <span className="key"><span className="game__swatch game__swatch--s2" aria-hidden="true" /><i>v</i></span>
        <span className="key"><span className="game__swatch game__swatch--s3" aria-hidden="true" /><i>Av</i></span>
        <span className="key"><span className="game__swatch game__swatch--s1" aria-hidden="true" />найденные направления</span>
        <span className="key"><span className="game__swatch game__swatch--target" aria-hidden="true" />образ единичной окружности</span>
      </figcaption>
    </figure>
  );
}

function Controls({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const solved = eigenHunt.status(state) === "solved";
  const options = lambdaOptions(state);
  const A = state.level.A;
  return (
    <div className="game-eigen">
      <p className="game-eigen__matrix">
        <i>A</i> = ({f(A[0][0])} {f(A[0][1])}; {f(A[1][0])} {f(A[1][1])})
      </p>
      <ParamSlider name="φ" value={state.angle} min={0} max={180} step={1} digits={0} role="param" disabled={solved} onChange={(angle) => dispatch({ type: "set", angle })} />
      <div className="game-matrix__facts">
        <span>
          <i>v</i> под углом <i>φ</i> к оси <i>x</i>; угол между прямыми <i>v</i> и <i>Av</i> — <b>{f(lineAngle(A, state.angle))}°</b>
        </span>
        <span>
          найдено направлений — <b>{state.found.length}</b>
          {state.level.eigen.length ? ` из ${state.level.eigen.length}` : ""}
        </span>
      </div>
      {state.pending === null ? (
        <div className="game-eigen__actions">
          <button type="button" className="btn btn--sm" disabled={solved} onClick={() => dispatch({ type: "catch" })}>
            Поймать
          </button>
          <button type="button" className="btn btn--sm" disabled={solved} onClick={() => dispatch({ type: "none" })}>
            Таких направлений нет
          </button>
        </div>
      ) : (
        <div className="game-eigen__actions" role="group" aria-label="Собственное значение λ">
          {options.map((o) => (
            <button key={o} type="button" className="btn btn--sm" onClick={() => dispatch({ type: "lambda", value: o })}>
              λ = {f(o)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const view: ShellView<State, Action, Level> = {
  reset: { type: "reset" },
  hint: { type: "hint" },
  levelName: (l) => KIND_NAMES[l.kind],
  feedback: (s) => eigenHunt.feedback(s),
  stats: (s) => [
    ["Промахи", s.misses],
    ["Направлений на уровне", s.level.eigen.length],
  ],
  actions: (s) => s.moves + s.misses,
  hints: (s) => s.hints,
  debrief: (l) => DEBRIEF[l.kind],
  board: (s) => <Board state={s} />,
  controls: (s, dispatch) => <Controls state={s} dispatch={dispatch} />,
  keys: [
    ["Стрелки на бегунке φ", "повернуть v на 1°; PageUp и PageDown — на 18°, Home и End — к 0° и 180°"],
    ["Enter или пробел", "нажать кнопку: «Поймать», выбрать λ или «Таких направлений нет»"],
    ["Подсказка", "сначала что искать, потом характеристическое уравнение, потом ответ"],
  ],
};

export function EigenHunt({ seed = 1, children }: { seed?: number; children?: ReactNode }) {
  return (
    <GameShell spec={eigenHunt} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
