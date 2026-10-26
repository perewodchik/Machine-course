// Представление «Угадай корреляцию»: на поле — облако точек в стандартизованных координатах; справа — кнопки
// вариантов корреляции, после ответа — разбор и «Дальше». Логика — model.ts.
import type { ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { Plane, Point } from "../../widgets/_kit";
import { moments } from "../../lib/math/correlation";
import { DEBRIEF, guessCorrelation, LEVEL_NAMES, LEVELS, optionText, type Action, type Level, type State } from "./model";

function Board({ state }: { state: State }) {
  const round = guessCorrelation.current(state) ?? state.level.rounds[state.level.rounds.length - 1]!;
  // стандартизуем оси: корреляцию не видно по наклону, только по форме облака
  const { mx, my, vx, vy } = moments(round.points);
  const pts = round.points.map(([x, y]) => [(x - mx) / Math.sqrt(vx), (y - my) / Math.sqrt(vy)] as const);
  const lim = Math.max(3, Math.ceil(Math.max(...pts.flat().map(Math.abs)) + 0.3));
  return (
    <figure className="game__figure">
      <Plane x={[-lim, lim]} y={[-lim, lim]} xStep={1} yStep={1} equal xLabel="x" yLabel="y" height={{ ratio: 1, min: 240, max: 400 }} initialWidth={400} label={`Облако из ${pts.length} точек; оси стандартизованы`}>
        {pts.map(([x, y], i) => (
          <Point key={i} x={x} y={y} role="data" r={4} />
        ))}
      </Plane>
      <figcaption className="game__legend">оси стандартизованы: среднее 0, разброс 1</figcaption>
    </figure>
  );
}

function Controls({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const solved = guessCorrelation.status(state) === "solved";
  const round = guessCorrelation.current(state);
  return (
    <div className="game-eigen">
      <p className="game-matrix__facts">
        <span>
          облако <b>{Math.min(state.index + 1, state.level.rounds.length)}</b> из {state.level.rounds.length}
        </span>
      </p>
      {state.last === null ? (
        <div className="game-eigen__actions" role="group" aria-label="Выборочная корреляция">
          {(round?.options ?? []).map((o) => (
            <button key={o} type="button" className="btn btn--sm num" disabled={solved} onClick={() => dispatch({ type: "answer", option: o })}>
              {optionText(o)}
            </button>
          ))}
        </div>
      ) : (
        <div className="game-eigen__actions">
          <button type="button" className="btn btn--sm" onClick={() => dispatch({ type: "next" })}>
            {state.index + 1 < state.level.rounds.length ? "Дальше" : "Закончить уровень"}
          </button>
        </div>
      )}
    </div>
  );
}

const view: ShellView<State, Action, Level> = {
  reset: { type: "reset" },
  hint: { type: "hint" },
  levelName: (l) => LEVEL_NAMES[l.kind],
  feedback: (s) => guessCorrelation.feedback(s),
  stats: (s) => [
    ["Верно с первого раза", `${s.answers.filter(Boolean).length} из ${s.answers.length}`],
    ["Облаков на уровне", s.level.rounds.length],
  ],
  actions: (s) => s.answers.length,
  hints: (s) => s.hints,
  debrief: (l) => DEBRIEF[l.kind],
  board: (s) => <Board state={s} />,
  controls: (s, dispatch) => <Controls state={s} dispatch={dispatch} />,
  keys: [
    ["Tab", "перейти к вариантам"],
    ["Enter или пробел", "выбрать вариант или нажать «Дальше»"],
    ["Подсказка", "сначала как читать облако, потом знак корреляции"],
  ],
};

export function GuessCorrelation({ seed = 1, children }: { seed?: number; children?: ReactNode }) {
  return (
    <GameShell spec={guessCorrelation} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
