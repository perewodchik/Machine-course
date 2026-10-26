// Представление «Приор против монеты»: на поле — описание партии и таблица монет (увиденные броски, прогноз бота
// и прогноз игрока, после партии — потери); справа — бегунки α и β, среднее и сила приора, «Сыграть партию»
// и список партий. Логика — model.ts.
import type { ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { ParamSlider, Readout } from "../../widgets/_kit";
import {
  COINS,
  DEBRIEF,
  FUTURE,
  heads,
  LEVEL_NAMES,
  LEVELS,
  logLoss,
  mlePredict,
  POPULATION,
  posteriorMean,
  PRIOR,
  priorVsCoin,
  type Action,
  type Level,
  type State,
} from "./model";

const f = (x: number, k = 2) => (Math.round(x * 10 ** k) / 10 ** k).toFixed(k);

function Board({ state }: { state: State }) {
  const played = state.plays.length > 0;
  return (
    <figure className="game__figure">
      <p className="game-like__data">{POPULATION[state.level.kind]}</p>
      {/* на узком экране таблица прокручивается: область фокусируемая, чтобы листать её и с клавиатуры */}
      <div
        className="game-prior"
        role="region"
        aria-label="Таблица монет"
        tabIndex={0}
      >
        <table className="game-prior__table">
          <caption className="visually-hidden">
            Монеты партии: увиденные броски и прогнозы вероятности орла
          </caption>
          <thead>
            <tr>
              <th scope="col">Монета</th>
              <th scope="col">Броски</th>
              <th scope="col">Бот k/n</th>
              <th scope="col">Вы</th>
              {played && <th scope="col">Потеря бота</th>}
              {played && <th scope="col">Ваша потеря</th>}
            </tr>
          </thead>
          <tbody>
            {state.level.coins.map((c, i) => {
              const mine = posteriorMean(c, state.alpha, state.beta);
              return (
                <tr key={i}>
                  <th scope="row">{i + 1}</th>
                  <td className="game-prior__tosses">
                    {c.seen.length > 8
                      ? `${heads(c)} из ${c.seen.length}`
                      : c.seen.map((t) => (t ? "О" : "Р")).join("")}
                  </td>
                  <td>{f(mlePredict(c))}</td>
                  <td>{f(mine)}</td>
                  {played && <td>{f(logLoss(c, mlePredict(c)), 3)}</td>}
                  {played && <td>{f(logLoss(c, mine), 3)}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <figcaption className="game__legend">
        О — орёл, Р — решка. Потеря — средняя кросс-энтропия на {FUTURE}{" "}
        следующих бросках; меньше — лучше.
      </figcaption>
    </figure>
  );
}

function Controls({
  state,
  dispatch,
}: {
  state: State;
  dispatch: (a: Action) => void;
}) {
  const last = state.plays[state.plays.length - 1];
  return (
    <div className="game-eigen">
      <ParamSlider
        name="α"
        value={state.alpha}
        min={PRIOR.min}
        max={PRIOR.max}
        step={PRIOR.step}
        digits={1}
        role="param"
        disabled={state.solved}
        onChange={(v) => dispatch({ type: "set", alpha: v })}
      />
      <ParamSlider
        name="β"
        value={state.beta}
        min={PRIOR.min}
        max={PRIOR.max}
        step={PRIOR.step}
        digits={1}
        role="param"
        disabled={state.solved}
        onChange={(v) => dispatch({ type: "set", beta: v })}
      />
      <div className="game-range__readouts">
        <Readout
          name="α/(α + β)"
          value={state.alpha / (state.alpha + state.beta)}
          digits={2}
          hint="среднее приора"
        />
        <Readout
          name="α + β"
          value={state.alpha + state.beta}
          digits={1}
          hint="воображаемых бросков"
        />
      </div>
      <div className="game-eigen__actions">
        <button
          type="button"
          className="btn btn--sm btn--primary"
          disabled={state.solved}
          onClick={() => dispatch({ type: "play" })}
        >
          Сыграть партию
        </button>
      </div>
      {last && (
        <ol className="game-diverge__runs" aria-label="Партии">
          {state.plays.map((p, i) => (
            <li key={i}>
              Beta({p.alpha}, {p.beta}): вы {f(p.player, 3)}, бот {f(p.bot, 3)}
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
  feedback: (s) => priorVsCoin.feedback(s),
  stats: (s) => [
    ["Партий", s.plays.length],
    ["Монет в партии", COINS],
  ],
  actions: (s) => s.plays.length,
  hints: (s) => s.hints,
  debrief: (l) => DEBRIEF[l.kind],
  board: (s) => <Board state={s} />,
  controls: (s, dispatch) => <Controls state={s} dispatch={dispatch} />,
  keys: [
    ["← → на бегунках α и β", "шаг 0.5"],
    [
      "Enter на «Сыграть партию»",
      `прогнозы на ${FUTURE} бросков каждой монеты`,
    ],
    ["Подсказка", "сначала что значат α и β, потом какая партия"],
  ],
};

export function PriorVsCoin({
  seed = 1,
  children,
}: {
  seed?: number;
  children?: ReactNode;
}) {
  return (
    <GameShell spec={priorVsCoin} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
