// Представление «Матрицы-пазла»: поле на _kit (цель пунктиром, фигура ученика синей ручкой, стрелки Ae₁ и Ae₂
// цветами столбцов) и матрица из четырёх счётчиков «− значение +». Логика — model.ts, оболочка — GameShell.
import type { ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { Plane, Polygon, Vector } from "../../widgets/_kit";
import {
  apply,
  column,
  DEBRIEF,
  det,
  FAMILY_NAMES,
  fmtNum,
  LEVELS,
  matrixPuzzle,
  SHAPE,
  type Action,
  type Level,
  type State,
  viewport,
} from "./model";

const NAMES = [["a₁₁", "a₁₂"], ["a₂₁", "a₂₂"]] as const;

function Board({ state }: { state: State }) {
  const { A, level } = state;
  const v = viewport(level);
  return (
    <figure className="game__figure">
      <Plane
        x={v.x}
        y={v.y}
        xStep={v.step}
        yStep={v.step}
        height={{ ratio: 1, min: 240, max: 620 }}
        margin={{ l: 12, r: 12, t: 12, b: 12 }}
        initialWidth={560}
        label="Поле игры: пунктирный контур — цель, закрашенная буква F — ваша фигура, стрелки — образы базисных векторов Ae₁ и Ae₂."
      >
        <Polygon points={SHAPE.map((p) => apply(level.target, p))} tone="aux" />
        <Polygon points={SHAPE.map((p) => apply(A, p))} tone="pen" />
        <Vector to={column(A, 0)} role="data" label="Ae_1" />
        <Vector to={column(A, 1)} role="param" label="Ae_2" />
      </Plane>
      <figcaption className="game__legend">
        <span className="key"><span className="game__swatch game__swatch--target" aria-hidden="true" />цель</span>
        <span className="key"><span className="game__swatch game__swatch--pen" aria-hidden="true" />ваша фигура</span>
        <span className="key"><span className="game__swatch game__swatch--s1" aria-hidden="true" /><span>куда ушёл <i>e</i><sub>1</sub></span></span>
        <span className="key"><span className="game__swatch game__swatch--s2" aria-hidden="true" /><span>куда ушёл <i>e</i><sub>2</sub></span></span>
      </figcaption>
    </figure>
  );
}

function Controls({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const { A, level } = state;
  const solved = matrixPuzzle.status(state) === "solved";
  const cell = (i: 0 | 1, j: 0 | 1) => {
    const name = NAMES[i][j];
    const value = fmtNum(A[i][j]);
    return (
      <div key={`${i}${j}`} className={`stepper stepper--col${j + 1}`} role="group" aria-label={name}>
        <button type="button" aria-label={`Уменьшить ${name}, сейчас ${value}`} disabled={solved} onClick={() => dispatch({ type: "nudge", i, j, dir: -1 })}>
          −
        </button>
        <output aria-hidden="true">{value}</output>
        <button type="button" aria-label={`Увеличить ${name}, сейчас ${value}`} disabled={solved} onClick={() => dispatch({ type: "nudge", i, j, dir: 1 })}>
          +
        </button>
      </div>
    );
  };
  return (
    <div className="game-matrix">
      <span className="game-matrix__name" aria-hidden="true">
        <i>A</i> =
      </span>
      <div className="game-matrix__grid" role="group" aria-label={`Матрица A, шаг ${fmtNum(level.step)}`}>
        {cell(0, 0)}
        {cell(0, 1)}
        {cell(1, 0)}
        {cell(1, 1)}
      </div>
      <div className="game-matrix__facts">
        <span>
          det <i>A</i> = <b>{fmtNum(det(A))}</b>
        </span>
        <span>
          Первый столбец — это <i>Ae</i>
          <sub>1</sub>, второй — <i>Ae</i>
          <sub>2</sub>
        </span>
      </div>
    </div>
  );
}

const view: ShellView<State, Action, Level> = {
  reset: { type: "reset" },
  hint: { type: "hint" },
  levelName: (l) => FAMILY_NAMES[l.family],
  feedback: (s) => matrixPuzzle.feedback(s),
  stats: (s) => [
    ["Ходы", s.moves],
    ["Минимум на уровне", matrixPuzzle.optimal(s)],
  ],
  actions: (s) => s.moves,
  hints: (s) => s.hints,
  debrief: (l) => DEBRIEF[l.family],
  board: (s) => <Board state={s} />,
  controls: (s, dispatch) => <Controls state={s} dispatch={dispatch} />,
  keys: [
    ["Tab, Shift + Tab", "перейти к следующей или предыдущей кнопке"],
    ["Enter или пробел", "нажать кнопку: «−» и «+» меняют элемент матрицы на шаг"],
    ["Подсказка", "сначала идея, потом как найти столбец, потом сам столбец"],
  ],
};

export function MatrixPuzzle({ seed = 1, children }: { seed?: number; children?: ReactNode }) {
  return (
    <GameShell spec={matrixPuzzle} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
