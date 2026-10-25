// Представление «Минимум, максимум или седло»: на поле — линии уровня ½ hᵀHh вокруг критической точки (сплошные —
// уровни выше значения в точке, пунктир — ниже) или, на уровнях «по числам», только матрица H. Справа — четыре
// ответа, после ответа — разбор и «Дальше». Логика — model.ts.
import type { ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { Plane, Point, Polyline } from "../../widgets/_kit";
import { levelCurves } from "../../lib/math/conics";
import { DEBRIEF, eigs, KIND_NAMES, LEVEL_NAMES, LEVELS, minMaxSaddle, type Action, type Kind, type Level, type State } from "./model";

const f = (x: number) => String(Math.round(x * 100) / 100).replace("-", "−");
const KINDS: readonly Kind[] = ["min", "max", "saddle", "degenerate"];

function Board({ state }: { state: State }) {
  const card = minMaxSaddle.current(state) ?? state.level.cards[state.level.cards.length - 1]!;
  const [a, b, c] = card.H;
  const reveal = state.last !== null || !minMaxSaddle.current(state);
  return (
    <figure className="game__figure">
      {card.picture ? (
        <Plane x={[-3, 3]} y={[-3, 3]} xStep={1} yStep={1} equal height={{ ratio: 1, min: 240, max: 480 }} margin={{ l: 12, r: 12, t: 12, b: 12 }} initialWidth={480} label={`Линии уровня функции ½ hᵀHh около критической точки, ${minMaxSaddle.describe(state)}`}>
          {[0.5, 2, 4.5].flatMap((k) => [k, -k]).flatMap((k) => levelCurves(a, b, c, 2 * k, 8, 96).map((pts, i) => <Polyline key={`${k}-${i}`} points={pts} role={k > 0 ? "data" : "target"} dashed={k < 0} />))}
          <Point x={0} y={0} role="aux" label="x*" />
        </Plane>
      ) : (
        <p className="game-saddle__matrix" aria-label={`Гессиан: строки (${f(a)}, ${f(b)}) и (${f(b)}, ${f(c)}).`}>
          <i>H</i> = <span className="game-saddle__grid" aria-hidden="true"><span>{f(a)}</span><span>{f(b)}</span><span>{f(b)}</span><span>{f(c)}</span></span>
        </p>
      )}
      {reveal && (
        <p className="game-saddle__eigs">
          собственные значения <i>H</i>: {eigs(card.H).map(f).join(" и ")}
        </p>
      )}
      {card.picture && (
        <figcaption className="game__legend">
          <span className="key"><span className="game__swatch game__swatch--s1" aria-hidden="true" />уровни выше f(x*)</span>
          <span className="key"><span className="game__swatch game__swatch--s3 game__swatch--dashed" aria-hidden="true" />уровни ниже f(x*)</span>
        </figcaption>
      )}
    </figure>
  );
}

function Controls({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const solved = minMaxSaddle.status(state) === "solved";
  return (
    <div className="game-eigen">
      <p className="game-matrix__facts">
        <span>
          карточка <b>{Math.min(state.index + 1, state.level.cards.length)}</b> из {state.level.cards.length}
        </span>
      </p>
      {state.last === null ? (
        <div className="game-eigen__actions" role="group" aria-label="Тип критической точки">
          {KINDS.map((k) => (
            <button key={k} type="button" className="btn btn--sm" disabled={solved} onClick={() => dispatch({ type: "answer", kind: k })}>
              {KIND_NAMES[k]}
            </button>
          ))}
        </div>
      ) : (
        <div className="game-eigen__actions">
          <button type="button" className="btn btn--sm" onClick={() => dispatch({ type: "next" })}>
            {state.index + 1 < state.level.cards.length ? "Дальше" : "Закончить уровень"}
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
  feedback: (s) => minMaxSaddle.feedback(s),
  stats: (s) => [
    ["Верно с первого раза", `${s.answers.filter(Boolean).length} из ${s.answers.length}`],
    ["Карточек на уровне", s.level.cards.length],
  ],
  actions: (s) => s.answers.length,
  hints: (s) => s.hints,
  debrief: (l) => DEBRIEF[l.kind],
  board: (s) => <Board state={s} />,
  controls: (s, dispatch) => <Controls state={s} dispatch={dispatch} />,
  keys: [
    ["Tab", "перейти к кнопкам ответа"],
    ["Enter или пробел", "выбрать ответ или нажать «Дальше»"],
    ["Подсказка", "сначала что смотреть, потом полный разбор карточки"],
  ],
};

export function MinMaxSaddle({ seed = 1, children }: { seed?: number; children?: ReactNode }) {
  return (
    <GameShell spec={minMaxSaddle} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
