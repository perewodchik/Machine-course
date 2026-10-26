// Представление «Честная вероятность»: на поле — объекты с метками 0 и 1 на высотах 0 и 1 и сигмоида p(x) = g(k(x − b));
// ошибки уверенной модели (p(y | x) < 0.2) крупнее. Справа — сначала догадка о границе, потом бегунки b и k, средний
// log p и «Сдать». Логика — model.ts.
import { useState, type ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { Line, ParamSlider, Plane, Point, Polyline, Readout } from "../../widgets/_kit";
import { sigmoid } from "../../lib/math/logistic";
import { B_STEP, DEBRIEF, honest, K_MAX, K_STEP, LEVEL_NAMES, LEVELS, meanLogp, type Action, type Level, type State } from "./model";

const f = (x: number) => String(Math.round(x * 100) / 100).replace("-", "−");
const XS = Array.from({ length: 161 }, (_, i) => -4 + i / 20);

function Board({ state }: { state: State }) {
  const l = state.level;
  const shown = state.guess !== null;
  const p = (x: number) => sigmoid(state.k * (x - state.b));
  return (
    <figure className="game__figure">
      <Plane x={[-4, 4]} y={[-0.15, 1.15]} xStep={1} yStep={0.5} xLabel="x" yLabel="p" height={{ ratio: 0.55, min: 220, max: 340 }} initialWidth={480} label={`${l.x.length} объектов: метка 1 — сверху, 0 — снизу${shown ? `; сигмоида с границей ${f(state.b)} и крутизной ${f(state.k)}` : ""}`}>
        {l.x.map((x, i) => {
          const jitter = (((i * 37) % 23) / 22 - 0.5) * 0.08;
          const py = l.y[i] ? p(x) : 1 - p(x);
          const bad = shown && py < 0.2;
          return <Point key={i} x={x} y={l.y[i]! + jitter} role={bad ? "target" : "data"} r={bad ? 4 : 2.75} />;
        })}
        {shown && <Polyline points={XS.map((x) => [x, p(x)] as [number, number])} role="param" />}
        {shown && <Line from={[state.b, -0.15]} to={[state.b, 1.15]} role="param" label="b" />}
        {state.guess !== null && Math.abs(state.guess - state.b) > 0.4 && <Line from={[state.guess, -0.15]} to={[state.guess, 1.15]} role="aux" label="догадка" />}
      </Plane>
      <figcaption className="game__legend">сверху — метка 1, снизу — 0; кривая — вероятность метки 1; крупные точки — уверенные ошибки</figcaption>
    </figure>
  );
}

function Controls({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const [guess, setGuess] = useState(0);
  const done = state.submitted;
  if (state.guess === null)
    return (
      <div className="game-eigen">
        <p className="game-matrix__facts">
          <span>Где, по-вашему, проходит лучшая граница — точка, где p = 0.5?</span>
        </p>
        <ParamSlider name="догадка" value={guess} min={-4} max={4} step={B_STEP} role="aux" onChange={setGuess} />
        <div className="game-eigen__actions">
          <button type="button" className="btn btn--sm btn--primary" onClick={() => dispatch({ type: "guess", b: guess })}>
            Отметить догадку
          </button>
        </div>
      </div>
    );
  return (
    <div className="game-eigen">
      <ParamSlider name="граница b" value={state.b} min={-4} max={4} step={B_STEP} role="param" disabled={done} onChange={(b) => dispatch({ type: "set", b })} />
      <ParamSlider name="крутизна k" value={state.k} min={K_STEP} max={K_MAX} step={K_STEP} digits={1} role="param" disabled={done} onChange={(k) => dispatch({ type: "set", k })} />
      <div className="game-range__readouts">
        <Readout name="средний log p" value={meanLogp(state.level, state.b, state.k)} digits={3} />
      </div>
      <div className="game-eigen__actions">
        <button type="button" className="btn btn--sm btn--primary" disabled={done} onClick={() => dispatch({ type: "submit" })}>
          Сдать модель
        </button>
      </div>
    </div>
  );
}

const view: ShellView<State, Action, Level> = {
  reset: { type: "reset" },
  hint: { type: "hint" },
  levelName: (l) => LEVEL_NAMES[l.kind],
  feedback: (s) => honest.feedback(s),
  stats: (s) => [
    ["Сдач", s.misses + (s.submitted ? 1 : 0)],
    ["Объектов", s.level.x.length],
  ],
  actions: (s) => s.misses + (s.submitted ? 1 : 0) + (s.guess === null ? 0 : 1),
  hints: (s) => s.hints,
  debrief: (l) => DEBRIEF[l.kind],
  board: (s) => <Board state={s} />,
  controls: (s, dispatch) => <Controls state={s} dispatch={dispatch} />,
  keys: [
    ["← → на бегунках", "граница — шаг 0.05, крутизна — 0.1; Page Up и Page Down — крупнее"],
    ["Enter на «Сдать модель»", "проверить, близок ли средний log p к максимуму"],
    ["Подсказка", "сначала с чего начать, потом лучшая граница и крутизна"],
  ],
};

export function HonestProbability({ seed = 1, children }: { seed?: number; children?: ReactNode }) {
  return (
    <GameShell spec={honest} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
