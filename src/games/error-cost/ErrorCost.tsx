// Представление «Цена ошибки»: на поле — объекты на оси вероятности p (сверху положительные, снизу отрицательные)
// и вертикаль порога t; ошибки крупнее и цвета ответа. Справа — цена каждой ошибки, бегунок t, счёт ошибок и цена.
// Логика — model.ts.
import type { ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { Line, ParamSlider, Plane, Point, Readout } from "../../widgets/_kit";
import { confusion } from "../../lib/math/classification";
import { costAt, DEBRIEF, errorCost, LEVEL_NAMES, LEVELS, STORY, T_STEP, type Action, type Level, type State } from "./model";

const f = (x: number) => (Math.round(x * 1000) / 1000).toFixed(3);
const storyOf = (l: Level) => Object.values(STORY).find((s) => s.cFp === l.cFp && s.cFn === l.cFn)!;

function Board({ state }: { state: State }) {
  const l = state.level;
  const s = storyOf(l);
  const c = confusion(l.scores, l.y, state.t);
  return (
    <figure className="game__figure">
      <Plane x={[0, 1]} y={[0, 2]} xStep={0.2} yStep={4} xLabel="p" yLabel="" height={{ ratio: 0.5, min: 220, max: 320 }} initialWidth={480} label={`${l.scores.length} объектов на оси вероятности p; порог t = ${f(state.t)}: ложных тревог ${c.fp}, пропусков ${c.fn}`}>
        {l.scores.map((p, i) => {
          const err = (p >= state.t) !== Boolean(l.y[i]);
          const jitter = (((i * 37) % 23) / 22 - 0.5) * 0.7;
          return <Point key={i} x={p} y={(l.y[i] ? 1.5 : 0.5) + jitter} role={err ? "target" : l.y[i] ? "data" : "aux"} r={err ? 3.5 : 2.25} />;
        })}
        <Line from={[state.t, 0]} to={[state.t, 2]} role="param" label="t" />
      </Plane>
      <figcaption className="game__legend">сверху — {s.pos}, снизу — нет; справа от порога объект отмечаем; крупные точки — ошибки</figcaption>
    </figure>
  );
}

function Controls({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const l = state.level;
  const s = storyOf(l);
  const c = confusion(l.scores, l.y, state.t);
  const done = state.submitted !== null;
  return (
    <div className="game-eigen">
      <p className="game-matrix__facts">
        <span>
          {s.fp} стоит <b>{l.cFp}</b>, {s.fn} — <b>{l.cFn}</b>
        </span>
      </p>
      <ParamSlider name="t" value={state.t} min={0} max={1} step={T_STEP} digits={3} role="param" disabled={done} onChange={(t) => dispatch({ type: "set", t })} />
      <div className="game-range__readouts">
        <Readout name="ложных тревог" value={c.fp} digits={0} />
        <Readout name="пропусков" value={c.fn} digits={0} />
        <Readout name="цена" value={costAt(l, state.t)} digits={0} />
      </div>
      <div className="game-eigen__actions">
        <button type="button" className="btn btn--sm btn--primary" disabled={done} onClick={() => dispatch({ type: "submit" })}>
          Сдать порог
        </button>
      </div>
      {state.misses.length > 0 && (
        <ol className="game-diverge__runs" aria-label="Непринятые пороги">
          {state.misses.map((t, i) => (
            <li key={i}>
              t = {f(t)}: цена {costAt(l, t)}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const view: ShellView<State, Action, Level> = {
  reset: { type: "reset" },
  hint: { type: "hint" },
  levelName: (l) => LEVEL_NAMES[l.kind],
  feedback: (s) => errorCost.feedback(s),
  stats: (s) => [
    ["Сдач", s.misses.length + (s.submitted === null ? 0 : 1)],
    ["Объектов", s.level.scores.length],
  ],
  actions: (s) => s.misses.length + (s.submitted === null ? 0 : 1),
  hints: (s) => s.hints,
  debrief: (l) => DEBRIEF[l.kind],
  board: (s) => <Board state={s} />,
  controls: (s, dispatch) => <Controls state={s} dispatch={dispatch} />,
  keys: [
    ["← → на бегунке t", "шаг 0.005; Page Up и Page Down — крупнее"],
    ["Enter на «Сдать порог»", "проверить, близка ли цена к минимуму"],
    ["Подсказка", "сначала как сравнить два решения, потом формула порога"],
  ],
};

export function ErrorCost({ seed = 1, children }: { seed?: number; children?: ReactNode }) {
  return (
    <GameShell spec={errorCost} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
