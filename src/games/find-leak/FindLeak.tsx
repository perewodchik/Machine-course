// Представление «Найди утечку»: на поле — описание задачи и подозрительная валидация; справа — варианты (признаки с
// моментом, когда они известны, шаги конвейера, разбиение, «утечки нет»). Выбранные варианты отмечены. Логика — model.ts.
import type { ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { DEBRIEF_LINE, findLeak, LEVEL_NAMES, LEVELS, type Action, type Level, type State } from "./model";

function Board({ state }: { state: State }) {
  const l = state.level;
  return (
    <figure className="game__figure find-leak__board">
      <p className="find-leak__story">{l.story}</p>
      <p className="find-leak__validation">
        <b>Подозрительно:</b> {l.validation}
      </p>
      <figcaption className="game__legend">выберите источник утечки — признак, шаг конвейера или разбиение — или «утечки нет»</figcaption>
    </figure>
  );
}

function Controls({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const done = findLeak.solved(state);
  return (
    <div className="find-leak__options" role="group" aria-label="Где утечка">
      {state.level.candidates.map((c) => {
        const picked = state.picked.includes(c.id);
        const right = picked && c.id === state.level.answer;
        return (
          <button key={c.id} type="button" className={["find-leak__option", picked && (right ? "is-right" : "is-wrong")].filter(Boolean).join(" ")} aria-pressed={picked} disabled={done || picked} onClick={() => dispatch({ type: "pick", id: c.id })}>
            <span className="find-leak__kind">{c.kind}</span>
            <span className="find-leak__text">{c.text}</span>
            {c.known && <span className="find-leak__known">известно: {c.known}</span>}
          </button>
        );
      })}
    </div>
  );
}

const view: ShellView<State, Action, Level> = {
  reset: { type: "reset" },
  hint: { type: "hint" },
  levelName: (l) => LEVEL_NAMES[l.kind],
  feedback: (s) => findLeak.feedback(s),
  stats: (s) => [
    ["Попыток", s.picked.length],
    ["Вариантов", s.level.candidates.length],
  ],
  actions: (s) => s.picked.length,
  hints: (s) => s.hints,
  debrief: (l) => DEBRIEF_LINE(l),
  board: (s) => <Board state={s} />,
  controls: (s, dispatch) => <Controls state={s} dispatch={dispatch} />,
  keys: [
    ["Tab и Enter", "выбрать вариант"],
    ["Подсказка", "сначала что проверять, потом тип источника"],
  ],
};

export function FindLeak({ seed = 1, children }: { seed?: number; children?: ReactNode }) {
  return (
    <GameShell spec={findLeak} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
