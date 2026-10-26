// Представление «Зоопарк распределений»: на поле — сюжет карточки или столбики функции вероятности с описанием
// значений; справа — кнопки семейств уровня, после ответа — разбор и «Дальше». Логика — model.ts.
import type { ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { Line, Plane, Point } from "../../widgets/_kit";
import { cardPmf, DEBRIEF, distZoo, FAMILY_NAMES, LEVEL_NAMES, LEVELS, type Action, type Level, type State } from "./model";

function Board({ state }: { state: State }) {
  const card = distZoo.current(state) ?? state.level.cards[state.level.cards.length - 1]!;
  if (card.kind === "story")
    return (
      <figure className="game__figure game-zoo__story">
        <blockquote className="game-zoo__text">{card.text}</blockquote>
        <figcaption className="game-zoo__ask">Какое распределение у этой величины?</figcaption>
      </figure>
    );
  const ks = Array.from({ length: 16 }, (_, k) => k).filter((k) => cardPmf(card, k) > 1e-3 || (card.family === "binomial" && k <= (card.params.n ?? 0)));
  const yMax = Math.ceil(Math.max(...ks.map((k) => cardPmf(card, k))) * 10) / 10 + 0.05;
  return (
    <figure className="game__figure">
      <Plane x={[-0.5, Math.max(6, ks[ks.length - 1]! + 1)]} y={[0, yMax]} xStep={1} yStep={0.1} xLabel="k" yLabel="P(X = k)" height={{ ratio: 0.7, min: 220, max: 400 }} initialWidth={480} label={`Функция вероятности неизвестного распределения; значения: ${card.values}`}>
        {ks.flatMap((k) => [<Line key={`s${k}`} from={[k, 0]} to={[k, cardPmf(card, k)]} role="data" />, <Point key={`p${k}`} x={k} y={cardPmf(card, k)} role="data" />])}
      </Plane>
      <figcaption className="game__legend">значения: {card.values}</figcaption>
    </figure>
  );
}

function Controls({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const solved = distZoo.status(state) === "solved";
  return (
    <div className="game-eigen">
      <p className="game-matrix__facts">
        <span>
          карточка <b>{Math.min(state.index + 1, state.level.cards.length)}</b> из {state.level.cards.length}
        </span>
      </p>
      {state.last === null ? (
        <div className="game-eigen__actions" role="group" aria-label="Семейство распределения">
          {state.level.families.map((f) => (
            <button key={f} type="button" className="btn btn--sm" disabled={solved} onClick={() => dispatch({ type: "answer", family: f })}>
              {FAMILY_NAMES[f]}
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
  feedback: (s) => distZoo.feedback(s),
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
    ["Tab", "перейти к кнопкам семейств"],
    ["Enter или пробел", "выбрать семейство или нажать «Дальше»"],
    ["Подсказка", "сначала какой вопрос задать, потом признак семейства"],
  ],
};

export function DistZoo({ seed = 1, children }: { seed?: number; children?: ReactNode }) {
  return (
    <GameShell spec={distZoo} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
