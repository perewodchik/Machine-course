// Представление «Попади в точку»: на поле — векторы a и b карандашом, цепочка c₁a → c₂b цветами коэффициентов и цель;
// под полем — счётчики c₁ и c₂ и кнопка «Невозможно». После уровня с параллельными a и b видна их оболочка — прямая.
// Логика — model.ts, оболочка — GameShell.
import type { ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { Line, Plane, Point, Vector } from "../../widgets/_kit";
import { combo, DEBRIEF, det2, fmtNum, fmtVec, KIND_NAMES, LEVELS, spanHit, type Action, type Level, type State, viewport } from "./model";

function Board({ state }: { state: State }) {
  const { level, c } = state;
  const v = viewport(level);
  const first = combo(level.a, level.b, [c[0], 0]);
  const end = combo(level.a, level.b, c);
  const done = spanHit.status(state) === "solved";
  const par = det2(level.a, level.b) === 0;
  const dir = Math.hypot(...level.a) > 0 ? level.a : level.b;
  return (
    <figure className="game__figure">
      <Plane
        x={v.x}
        y={v.y}
        xStep={v.step}
        yStep={v.step}
        height={{ ratio: 1, min: 240, max: 560 }}
        margin={{ l: 12, r: 12, t: 12, b: 12 }}
        initialWidth={560}
        label={`Поле игры: векторы a ${fmtVec(level.a)} и b ${fmtVec(level.b)}, цель ${fmtVec(level.target)}, ваша комбинация приходит в ${fmtVec(end)}.`}
      >
        {done && par && <Line from={[-20 * dir[0], -20 * dir[1]]} to={[20 * dir[0], 20 * dir[1]]} role="aux" />}
        <Line from={[0, 0]} to={level.a} role="aux" label="a" labelAbove />
        <Line from={[0, 0]} to={level.b} role="aux" label="b" labelAbove />
        <Point x={level.target[0]} y={level.target[1]} role="target" label="цель" r={7} />
        <Vector to={first} role="data" />
        <Vector from={first} to={end} role="param" />
      </Plane>
      <figcaption className="game__legend">
        <span className="key"><span className="game__swatch game__swatch--target" aria-hidden="true" />векторы <i>a</i> и <i>b</i></span>
        <span className="key"><span className="game__swatch game__swatch--s1" aria-hidden="true" /><span><i>c</i><sub>1</sub><i>a</i></span></span>
        <span className="key"><span className="game__swatch game__swatch--s2" aria-hidden="true" /><span><i>c</i><sub>2</sub><i>b</i></span></span>
        <span className="key"><span className="game__swatch game__swatch--s3" aria-hidden="true" />цель</span>
      </figcaption>
    </figure>
  );
}

function Controls({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const { level, c } = state;
  const solved = spanHit.status(state) === "solved";
  const stepper = (k: 0 | 1) => {
    const name = k === 0 ? "c₁" : "c₂";
    const value = fmtNum(c[k]);
    return (
      <div className={`stepper stepper--col${k + 1}`} role="group" aria-label={name}>
        <button type="button" aria-label={`Уменьшить ${name}, сейчас ${value}`} disabled={solved} onClick={() => dispatch({ type: "nudge", k, dir: -1 })}>
          −
        </button>
        <output aria-hidden="true">{value}</output>
        <button type="button" aria-label={`Увеличить ${name}, сейчас ${value}`} disabled={solved} onClick={() => dispatch({ type: "nudge", k, dir: 1 })}>
          +
        </button>
      </div>
    );
  };
  return (
    <div className="game-span">
      <div className="game-span__row" role="group" aria-label={`Коэффициенты, шаг ${fmtNum(level.step)}`}>
        {stepper(0)}
        <span className="game-span__op" aria-hidden="true">
          · <i>a</i> +
        </span>
        {stepper(1)}
        <span className="game-span__op" aria-hidden="true">
          · <i>b</i>
        </span>
      </div>
      <div className="game-matrix__facts">
        <span>
          <i>c</i>
          <sub>1</sub>
          <i>a</i> + <i>c</i>
          <sub>2</sub>
          <i>b</i> = <b>{fmtVec(combo(level.a, level.b, c))}</b>
        </span>
        <span>
          цель — <b>{fmtVec(level.target)}</b>
        </span>
      </div>
      <button type="button" className="btn btn--sm" disabled={solved} onClick={() => dispatch({ type: "impossible" })}>
        Невозможно
      </button>
    </div>
  );
}

const view: ShellView<State, Action, Level> = {
  reset: { type: "reset" },
  hint: { type: "hint" },
  levelName: (l) => KIND_NAMES[l.kind],
  feedback: (s) => spanHit.feedback(s),
  stats: (s) => [
    ["Ходы", s.moves],
    ["Минимум на уровне", spanHit.optimal(s)],
  ],
  actions: (s) => s.moves + s.wrongClaims + (s.claimed ? 1 : 0),
  hints: (s) => s.hints,
  debrief: (l) => DEBRIEF[l.kind],
  board: (s) => <Board state={s} />,
  controls: (s, dispatch) => <Controls state={s} dispatch={dispatch} />,
  keys: [
    ["Tab, Shift + Tab", "перейти к следующей или предыдущей кнопке"],
    ["Enter или пробел", "нажать кнопку: «−» и «+» меняют коэффициент на шаг"],
    ["Подсказка", "сначала идея, потом уравнения, потом ответ"],
  ],
};

export function SpanHit({ seed = 1, children }: { seed?: number; children?: ReactNode }) {
  return (
    <GameShell spec={spanHit} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
