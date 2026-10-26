// Представление «Скульптор Σ»: на поле — облако точек и эллипсы уровня 1 и 2 догадки игрока; после победы —
// пунктиром эллипс выборочных оценок. Справа — бегунки доступных параметров, «Проверить» и список проверок.
// Логика — model.ts.
import type { ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { Ellipse, ParamSlider, Plane, Point } from "../../widgets/_kit";
import { DEBRIEF, guessSigma, LEVEL_NAMES, LEVELS, RANGES, sigmaSculptor, TOL, type Action, type Level, type Param, type State } from "./model";

const f = (x: number) => (Math.round(x * 100) / 100).toFixed(2).replace("-", "−");
const NAMES: Record<Param, string> = { m1: "μ_1", m2: "μ_2", s1: "σ_1", s2: "σ_2", rho: "ρ" };

function Board({ state }: { state: State }) {
  const S = guessSigma(state.guess);
  const cov = [
    [S[0], S[1]],
    [S[1], S[2]],
  ] as const;
  const T = state.level.S;
  const target = [
    [T[0], T[1]],
    [T[1], T[2]],
  ] as const;
  const c: [number, number] = [state.guess.m1, state.guess.m2];
  return (
    <figure className="game__figure">
      <Plane x={[-6, 6]} y={[-6, 6]} xStep={1} yStep={1} equal height={{ ratio: 1, min: 240, max: 460 }} margin={{ l: 12, r: 12, t: 12, b: 12 }} initialWidth={460} xLabel="x₁" yLabel="x₂" label={`Облако из ${state.level.points.length} точек и эллипсы догадки: σ₁ = ${f(state.guess.s1)}, σ₂ = ${f(state.guess.s2)}, ρ = ${f(state.guess.rho)}`}>
        {state.level.points.map(([x, y], i) => (
          <Point key={i} x={x} y={y} role="data" r={2.5} />
        ))}
        {state.solved && <Ellipse center={state.level.mu} cov={target} k={2} role="aux" />}
        <Ellipse center={c} cov={cov} k={1} role="param" />
        <Ellipse center={c} cov={cov} k={2} role="param" />
      </Plane>
      <figcaption className="game__legend">{"эллипсы догадки: уровень 1 (внутри около 39\u00a0% точек) и\u00a0уровень 2 (около 86\u00a0%)"}</figcaption>
    </figure>
  );
}

function Controls({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  return (
    <div className="game-eigen">
      {state.level.params.map((p) => (
        <ParamSlider key={p} name={NAMES[p]} value={state.guess[p]} min={RANGES[p].min} max={RANGES[p].max} step={RANGES[p].step} digits={2} role="param" disabled={state.solved} onChange={(v) => dispatch({ type: "set", param: p, value: v })} />
      ))}
      <div className="game-eigen__actions">
        <button type="button" className="btn btn--sm btn--primary" disabled={state.solved} onClick={() => dispatch({ type: "check" })}>
          Проверить
        </button>
      </div>
      {state.checks.length > 0 && (
        <ol className="game-diverge__runs" aria-label="Проверки">
          {state.checks.map((k, i) => (
            <li key={i}>
              KL = {f(k)}: {k <= TOL ? "совпало" : "ещё нет"}
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
  feedback: (s) => sigmaSculptor.feedback(s),
  stats: (s) => [
    ["Проверок", s.checks.length],
    ["Порог KL", TOL],
  ],
  actions: (s) => s.checks.length,
  hints: (s) => s.hints,
  debrief: (l) => DEBRIEF[l.kind],
  board: (s) => <Board state={s} />,
  controls: (s, dispatch) => <Controls state={s} dispatch={dispatch} />,
  keys: [
    ["← → на бегунке", "мелкий шаг; Page Up и Page Down — крупнее"],
    ["Enter на «Проверить»", "посчитать KL между облаком и эллипсом"],
    ["Подсказка", "сначала как читать эллипс, потом худший параметр"],
  ],
};

export function SigmaSculptor({ seed = 1, children }: { seed?: number; children?: ReactNode }) {
  return (
    <GameShell spec={sigmaSculptor} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
