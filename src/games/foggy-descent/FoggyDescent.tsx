// Представление «Спуск в тумане»: на поле — только пройденный путь и стрелка градиента в текущей точке; линии
// уровня и оптимум открываются, когда цель найдена. Справа — значение f, восемь кнопок направления и переключатель
// короткого шага. Логика — model.ts.
import { useState, type ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { Plane, Point, Polyline, Vector } from "../../widgets/_kit";
import { levelCurves } from "../../lib/math/conics";
import { BOX, DEBRIEF, DIRS, foggyDescent, LEVEL_NAMES, LEVELS, MAX_MOVES, SHORT, STEP, value, type Action, type Level, type State } from "./model";

const f = (x: number) => String(Math.round(x * 100) / 100).replace("-", "−");

function Board({ state }: { state: State }) {
  const { level } = state;
  const p = state.path[state.path.length - 1]!;
  const g = foggyDescent.arrow(state);
  const len = Math.hypot(g[0], g[1]);
  // стрелка не длиннее 1.5: направление важнее длины, а длина растёт с удалением от оптимума
  const k = len > 1.5 ? 1.5 / len : 1;
  const solved = foggyDescent.status(state) === "solved";
  const [a, b, c] = level.A;
  return (
    <figure className="game__figure">
      <Plane x={[-BOX, BOX]} y={[-BOX, BOX]} xStep={1} yStep={1} equal height={{ ratio: 1, min: 240, max: 480 }} margin={{ l: 12, r: 12, t: 12, b: 12 }} initialWidth={480} label={`Пройденный путь и стрелка ${level.noise ? "оценки " : ""}градиента в текущей точке. ${foggyDescent.describe(state)}`}>
        {solved &&
          [0.25, 1, 2.25, 4, 6.25, 9].flatMap((v) =>
            levelCurves(a, b, c, 2 * v, 12, 96).map((pts, i) => <Polyline key={`${v}-${i}`} points={pts.map(([x, y]) => [x + level.m[0], y + level.m[1]] as [number, number])} role="data" />),
          )}
        {state.path.length > 1 && <Polyline points={state.path.map(([x, y]) => [x, y] as [number, number])} role="param" />}
        {state.path.map(([x, y], i) => (
          <Point key={i} x={x} y={y} role="param" r={i === state.path.length - 1 ? 5 : 3} />
        ))}
        {!solved && len > 1e-9 && <Vector from={p} to={[p[0] + k * g[0], p[1] + k * g[1]]} role="target" label={level.noise ? "оценка ∇f" : "∇f"} />}
        {solved && <Point x={level.m[0]} y={level.m[1]} role="aux" label={level.sign > 0 ? "минимум" : "максимум"} />}
      </Plane>
      <figcaption className="game__legend">
        <span className="key"><span className="game__swatch game__swatch--s2" aria-hidden="true" />пройденный путь</span>
        <span className="key"><span className="game__swatch game__swatch--s3" aria-hidden="true" />стрелка {level.noise ? "оценки " : ""}градиента</span>
      </figcaption>
    </figure>
  );
}

// порядок кнопок в сетке 3 × 3: верхний ряд ↖ ↑ ↗, средний ← · →, нижний ↙ ↓ ↘
const GRID = [3, 2, 1, 4, -1, 0, 5, 6, 7];

function Controls({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const [short, setShort] = useState(false);
  const p = state.path[state.path.length - 1]!;
  const g = foggyDescent.arrow(state);
  const over = foggyDescent.status(state) === "solved" || foggyDescent.moves(state) >= MAX_MOVES;
  return (
    <div className="game-eigen">
      <p className="game-matrix__facts">
        <span>
          <i>f</i> = <b>{f(value(state.level, p))}</b>
        </span>
        <span>
          длина {state.level.noise ? "оценки " : ""}∇<i>f</i>: <b>{f(Math.hypot(g[0], g[1]))}</b>
        </span>
        <span>
          цель — <b>{state.level.sign > 0 ? "минимум" : "максимум"}</b>
        </span>
      </p>
      <div className="game-fog__pad" role="group" aria-label={`Направление шага длиной ${short ? SHORT : STEP}`}>
        {GRID.map((i, cell) =>
          i < 0 ? (
            <button key={cell} type="button" className="btn btn--sm game-fog__short" aria-pressed={short} onClick={() => setShort(!short)}>
              {short ? SHORT : STEP}
            </button>
          ) : (
            <button key={cell} type="button" className="btn btn--sm" disabled={over} aria-label={`Шаг ${DIRS[i]!.name}`} onClick={() => dispatch({ type: "move", dir: i, short })}>
              <span aria-hidden="true">{DIRS[i]!.arrow}</span>
            </button>
          ),
        )}
      </div>
      <p className="game-fog__note">Кнопка в центре меняет длину шага: {STEP} или {SHORT}.</p>
    </div>
  );
}

const view: ShellView<State, Action, Level> = {
  reset: { type: "reset" },
  hint: { type: "hint" },
  levelName: (l) => LEVEL_NAMES[l.kind],
  feedback: (s) => foggyDescent.feedback(s),
  stats: (s) => [
    ["Шагов", `${foggyDescent.moves(s)} из ${MAX_MOVES}`],
  ],
  actions: (s) => foggyDescent.moves(s),
  hints: (s) => s.hints,
  debrief: (l) => DEBRIEF[l.kind],
  board: (s) => <Board state={s} />,
  controls: (s, dispatch) => <Controls state={s} dispatch={dispatch} />,
  keys: [
    ["Tab", "перейти к кнопкам направления"],
    ["Enter или пробел", "шагнуть; на кнопке в центре — сменить длину шага"],
    ["Подсказка", "сначала правило, потом лучшее из восьми направлений"],
  ],
};

export function FoggyDescent({ seed = 1, children }: { seed?: number; children?: ReactNode }) {
  return (
    <GameShell spec={foggyDescent} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
