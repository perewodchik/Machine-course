// Представление «Порог расходимости»: на поле — линии уровня ½ xᵀAx (на первом уровне — парабола ½ a x²) и
// траектория последнего запуска спуска. Справа — матрица A, бегунок η, «Запустить спуск», «Сдать шаг» и список
// попыток. Логика — model.ts.
import type { ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { ParamSlider, Plane, Point, Polyline } from "../../widgets/_kit";
import { levelCurves } from "../../lib/math/conics";
import { DEBRIEF, divergence, ETA_STEP, LEVEL_NAMES, LEVELS, STEPS, type Action, type Level, type State } from "./model";

const f = (x: number) => String(Math.round(x * 100) / 100).replace("-", "−");

/** Траектория до первой точки далеко за полем: расходящийся спуск уходит в миллиарды, рисовать их незачем. */
function visible(path: [number, number][], far = 20): [number, number][] {
  const out: [number, number][] = [];
  for (const p of path) {
    out.push(p);
    if (Math.hypot(p[0], p[1]) > far) break;
  }
  return out;
}

function Board({ state }: { state: State }) {
  const { A, kind } = state.level;
  const [a, b, c] = A;
  const run = state.runs[state.runs.length - 1];
  const one = kind === "one-d";
  const path = run ? visible(run.path) : [];
  const label = `${one ? "Парабола ½ a x²" : "Линии уровня ½ xᵀAx"} и ${run ? `траектория спуска с шагом ${f(run.eta)}` : "стартовая точка"}`;
  if (one) {
    const curve: [number, number][] = Array.from({ length: 121 }, (_, i) => {
      const x = -3 + (6 * i) / 120;
      return [x, (a * x * x) / 2];
    });
    const yMax = Math.ceil((a * 9) / 2);
    const pts = path.map(([x]) => [x, (a * x * x) / 2] as [number, number]);
    return (
      <figure className="game__figure">
        <Plane x={[-3, 3]} y={[0, yMax]} xStep={1} yStep={yMax > 12 ? 5 : 2} height={{ ratio: 0.8, min: 240, max: 420 }} initialWidth={480} label={label}>
          <Polyline points={curve} role="data" />
          {pts.length > 1 && <Polyline points={pts} role="param" />}
          {pts.map(([x, y], i) => (
            <Point key={i} x={x} y={y} role="param" r={i === 0 ? 5 : 3} />
          ))}
          {!run && <Point x={state.level.x0[0]} y={(a * state.level.x0[0] ** 2) / 2} role="param" label="x₀" />}
        </Plane>
      </figure>
    );
  }
  return (
    <figure className="game__figure">
      <Plane x={[-3, 3]} y={[-3, 3]} xStep={1} yStep={1} equal height={{ ratio: 1, min: 240, max: 480 }} margin={{ l: 12, r: 12, t: 12, b: 12 }} initialWidth={480} label={label}>
        {[0.25, 1, 2.25, 4, 6.25, 9].flatMap((k) => levelCurves(a, b, c, 2 * k, 8, 96).map((pts, i) => <Polyline key={`${k}-${i}`} points={pts} role="data" />))}
        {path.length > 1 && <Polyline points={path} role="param" />}
        {path.map(([x, y], i) => (
          <Point key={i} x={x} y={y} role="param" r={i === 0 ? 5 : 3} />
        ))}
        {!run && <Point x={state.level.x0[0]} y={state.level.x0[1]} role="param" label="x₀" />}
        <Point x={0} y={0} role="aux" label="минимум" />
      </Plane>
    </figure>
  );
}

function Controls({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const one = state.level.kind === "one-d";
  const [a, b, c] = state.level.A;
  const done = state.submitted !== null;
  return (
    <div className="game-eigen">
      {one ? (
        <p className="game-matrix__facts">
          <span>
            <i>f</i>(<i>x</i>) = ½ · <b>{f(a)}</b> · <i>x</i>²
          </span>
        </p>
      ) : (
        <p className="game-saddle__matrix game-diverge__matrix" aria-label={`Матрица A: строки (${f(a)}, ${f(b)}) и (${f(b)}, ${f(c)}).`}>
          <i>A</i> = <span className="game-saddle__grid" aria-hidden="true"><span>{f(a)}</span><span>{f(b)}</span><span>{f(b)}</span><span>{f(c)}</span></span>
        </p>
      )}
      <ParamSlider name="η" value={state.eta} min={ETA_STEP} max={state.level.etaMax} step={ETA_STEP} digits={2} disabled={done} onChange={(v) => dispatch({ type: "set", eta: v })} />
      <div className="game-eigen__actions">
        <button type="button" className="btn btn--sm" disabled={done} onClick={() => dispatch({ type: "run" })}>
          Запустить спуск
        </button>
        <button type="button" className="btn btn--sm btn--primary" disabled={!divergence.canSubmit(state)} onClick={() => dispatch({ type: "submit" })}>
          Сдать шаг
        </button>
      </div>
      {state.runs.length > 0 && (
        <ol className="game-diverge__runs" aria-label="Попытки">
          {state.runs.map((r, i) => (
            <li key={i}>
              η = {f(r.eta)}: {r.converged ? "сходится" : "расходится"}
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
  feedback: (s) => divergence.feedback(s),
  stats: (s) => [
    ["Запусков", s.runs.length],
    ["Шагов спуска в запуске", STEPS],
  ],
  actions: (s) => s.runs.length + (s.submitted === null ? 0 : 1),
  hints: (s) => s.hints,
  debrief: (l) => DEBRIEF[l.kind],
  board: (s) => <Board state={s} />,
  controls: (s, dispatch) => <Controls state={s} dispatch={dispatch} />,
  keys: [
    ["← → на бегунке η", "шаг 0.01; Page Up и Page Down — крупнее"],
    ["Enter на «Запустить спуск»", `${STEPS} шагов x := x − ηAx`],
    ["Подсказка", "сначала что искать, потом собственные значения и порог"],
  ],
};

export function Divergence({ seed = 1, children }: { seed?: number; children?: ReactNode }) {
  return (
    <GameShell spec={divergence} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
