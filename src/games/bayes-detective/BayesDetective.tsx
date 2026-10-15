// Представление «Байес-детектива»: дело (гипотеза, априорная вероятность, улики по одной) и шкала 0–100 % у каждой
// отвеченной улики — синяя ручка: ответ ученика, зелёная: байесовский ответ. Логика — model.ts, оболочка — GameShell.
import { useId, type ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { DEBRIEF, detective, KIND_NAMES, LEVELS, pct, points, posterior, type Action, type Level, type State } from "./model";

const num = (v: number) => String(Math.round(v * 1000) / 1000);

function Scale({ you, bayes }: { you: number; bayes: number }) {
  return (
    <div className="detective__scale" aria-hidden="true">
      <span className="detective__mark detective__mark--you" style={{ left: `${you * 100}%` }} />
      <span className="detective__mark detective__mark--bayes" style={{ left: `${bayes * 100}%` }} />
    </div>
  );
}

function Board({ state }: { state: State }) {
  const { level, answers } = state;
  const shown = level.evidence.slice(0, Math.min(level.evidence.length, answers.length + 1));
  return (
    <section className="detective__case" aria-label="Материалы дела">
      <p className="detective__hypothesis">
        Гипотеза: <b>{level.hypothesis}</b>
      </p>
      <p className="detective__prior">
        До улик: <b>{pct(level.prior)}</b> — так часто гипотеза верна в похожих делах.
      </p>
      <ol className="detective__evidence">
        {shown.map((e, k) => {
          const q = answers[k];
          const p = posterior(level, k + 1);
          return (
            <li key={k} className={q === undefined ? "is-current" : undefined}>
              <p className="detective__fact">{e.text}</p>
              <p className="detective__lik">
                P(улика | {level.hypothesis}) = <b>{num(e.pH)}</b>, P(улика | нет) = <b>{num(e.pNotH)}</b>
              </p>
              {q !== undefined && (
                <>
                  <Scale you={q} bayes={p} />
                  <p className="detective__result">
                    Ваш ответ <b className="is-you">{pct(q)}</b>, по Байесу <b className="is-bayes">{pct(p)}</b> — {points(p, q)} очков
                  </p>
                </>
              )}
            </li>
          );
        })}
      </ol>
      <p className="detective__legend">
        <span className="detective__key detective__key--you" aria-hidden="true" />
        ваш ответ <span className="detective__key detective__key--bayes" aria-hidden="true" />
        байесовский ответ
      </p>
    </section>
  );
}

function Controls({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const id = useId();
  const done = detective.status(state) === "solved";
  const k = state.answers.length + 1;
  const current = state.level.evidence[k - 1];
  return (
    <div className="detective__answer">
      {/* на узком экране дело выше бегунка — текущая улика повторяется здесь, чтобы не листать назад */}
      {current && (
        <p className="detective__current" aria-hidden="true">
          Улика {k}: {current.text}. P(улика | {state.level.hypothesis}) = {num(current.pH)}, P(улика | нет) = {num(current.pNotH)}.
        </p>
      )}
      <label htmlFor={id}>
        Вероятность гипотезы с учётом улики {done ? "" : k}, %
      </label>
      <div className="detective__input">
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          step={1}
          value={state.draft}
          disabled={done}
          aria-valuetext={`${state.draft} %`}
          onChange={(e) => dispatch({ type: "set", value: Number(e.currentTarget.value) })}
          onKeyDown={(e) => {
            if (e.key === "Enter") dispatch({ type: "answer" });
          }}
        />
        <output htmlFor={id}>{state.draft}&nbsp;%</output>
        <button type="button" className="btn btn--sm btn--primary" disabled={done} onClick={() => dispatch({ type: "answer" })}>
          Ответить
        </button>
      </div>
    </div>
  );
}

const view: ShellView<State, Action, Level> = {
  reset: { type: "reset" },
  hint: { type: "hint" },
  levelName: (l) => KIND_NAMES[l.kind],
  feedback: (s) => detective.feedback(s),
  stats: (s) => [
    ["Очки", `${detective.totalPoints(s)} из ${100 * s.level.evidence.length}`],
    ["Улик", `${s.answers.length} из ${s.level.evidence.length}`],
  ],
  actions: (s) => s.answers.length,
  hints: (s) => s.hints,
  debrief: (l) => DEBRIEF[l.kind],
  board: (s) => <Board state={s} />,
  controls: (s, dispatch) => <Controls state={s} dispatch={dispatch} />,
  keys: [
    ["Стрелки", "изменить оценку на 1 %; Page Up и Page Down — на 10 %"],
    ["Enter", "ответить (на бегунке)"],
    ["Подсказка", "сначала шансы, потом отношение правдоподобия, потом ответ"],
  ],
};

export function BayesDetective({ seed = 1, children }: { seed?: number; children?: ReactNode }) {
  return (
    <GameShell spec={detective} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
