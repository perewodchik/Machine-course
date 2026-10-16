// Представление «Тетрис размерностей»: блоки-матрицы нарисованы клетками (строки × столбцы) цветом роли;
// сверху — цепочка произведения со стыками «столбцы = строки», снизу — свободные блоки. У блока в цепочке —
// кнопки «транспонировать», «влево», «вправо», «убрать». Логика — model.ts, оболочка — GameShell.
import type { CSSProperties, ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { DEBRIEF, dimTetris, fmtShape, joints, KIND_NAMES, label, LEVELS, product, shapeOf, type Action, type Level, type Piece, type State } from "./model";

const SLOT: Record<Piece["role"], string> = { data: "s1", param: "s2", target: "s3", aux: "aux" };

/** Блок клетками: r × c квадратиков. */
function Cells({ p, t }: { p: Piece; t: boolean }) {
  const [r, c] = shapeOf(p, t);
  return (
    <span className={`game-dim__cells game-dim__cells--${SLOT[p.role]}`} style={{ "--rows": r, "--cols": c } as CSSProperties} aria-hidden="true">
      {Array.from({ length: r * c }, (_, i) => (
        <span key={i} />
      ))}
    </span>
  );
}

function Name({ p, t }: { p: Piece; t: boolean }) {
  return (
    <span className="game-dim__name">
      <span>
        <i>{p.name}</i>
        {t && <sup>⊤</sup>}
      </span>
      <span className="game-dim__shape">{fmtShape(shapeOf(p, t))}</span>
    </span>
  );
}

function Board({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const { level, chain } = state;
  const solved = dimTetris.status(state) === "solved";
  const js = joints(level, chain);
  const tray = level.pieces.filter((p) => !chain.some((s) => s.id === p.id));
  const byId = (id: string) => level.pieces.find((p) => p.id === id)!;
  return (
    <div className="game__figure game-dim">
      <p className="game-dim__story">{level.story}</p>
      <div className="game-dim__chain" role="group" aria-label="Цепочка произведения">
        {!chain.length && <p className="game-dim__empty">Цепочка пуста: добавьте блоки снизу.</p>}
        {chain.map((s, i) => {
          const p = byId(s.id);
          const name = label(p, s.t);
          return [
            i > 0 && (
              <span key={`j${i}`} className={`game-dim__joint ${js[i - 1]!.ok ? "is-ok" : "is-bad"}`}>
                {js[i - 1]!.left} {js[i - 1]!.ok ? "=" : "≠"} {js[i - 1]!.right}
              </span>
            ),
            <div key={s.id} className="game-dim__item" role="group" aria-label={`${name}, ${fmtShape(shapeOf(p, s.t))}, место ${i + 1}`}>
              <Cells p={p} t={s.t} />
              <Name p={p} t={s.t} />
              <span className="game-dim__tools">
                {level.allowT && (
                  <button type="button" className="game-dim__tool" aria-label={`Транспонировать ${name}`} disabled={solved} onClick={() => dispatch({ type: "transpose", index: i })}>
                    ⊤
                  </button>
                )}
                <button type="button" className="game-dim__tool" aria-label={`Сдвинуть ${name} влево`} disabled={solved || i === 0} onClick={() => dispatch({ type: "move", index: i, dir: -1 })}>
                  ←
                </button>
                <button type="button" className="game-dim__tool" aria-label={`Сдвинуть ${name} вправо`} disabled={solved || i === chain.length - 1} onClick={() => dispatch({ type: "move", index: i, dir: 1 })}>
                  →
                </button>
                <button type="button" className="game-dim__tool" aria-label={`Убрать ${name}`} disabled={solved} onClick={() => dispatch({ type: "remove", index: i })}>
                  ×
                </button>
              </span>
            </div>,
          ];
        })}
      </div>
      <div className="game-dim__tray" role="group" aria-label="Свободные блоки">
        {tray.map((p) => (
          <button key={p.id} type="button" className="game-dim__piece" aria-label={`Добавить ${p.name} (${fmtShape([p.rows, p.cols])}) в конец цепочки`} disabled={solved} onClick={() => dispatch({ type: "place", id: p.id })}>
            <Cells p={p} t={false} />
            <Name p={p} t={false} />
          </button>
        ))}
        {!tray.length && <p className="game-dim__empty">Все блоки в цепочке.</p>}
      </div>
    </div>
  );
}

function Controls({ state }: { state: State }) {
  const p = product(state.level, state.chain);
  return (
    <div className="game-matrix__facts game-dim__facts">
      <span>
        произведение — <b>{state.chain.length ? (p ? fmtShape(p) : "не определено") : "—"}</b>
      </span>
      <span>
        цель — <b>{fmtShape(state.level.target)}</b>
      </span>
    </div>
  );
}

const view: ShellView<State, Action, Level> = {
  reset: { type: "reset" },
  hint: { type: "hint" },
  levelName: (l) => KIND_NAMES[l.kind],
  feedback: (s) => dimTetris.feedback(s),
  stats: (s) => [
    ["Ходы", s.moves],
    ["Минимум на уровне", dimTetris.optimal(s)],
  ],
  actions: (s) => s.moves,
  hints: (s) => s.hints,
  debrief: (l) => DEBRIEF[l.kind],
  board: (s, dispatch) => <Board state={s} dispatch={dispatch} />,
  controls: (s) => <Controls state={s} />,
  keys: [
    ["Tab, Shift + Tab", "перейти к следующей или предыдущей кнопке"],
    ["Enter или пробел", "добавить блок в конец цепочки или нажать кнопку у блока: ⊤ — транспонировать, ← и → — сдвинуть, × — убрать"],
    ["Подсказка", "сначала форма ответа, потом первый блок, потом вся цепочка"],
  ],
};

export function DimTetris({ seed = 1, children }: { seed?: number; children?: ReactNode }) {
  return (
    <GameShell spec={dimTetris} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
