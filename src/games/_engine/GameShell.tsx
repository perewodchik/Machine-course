// Оболочка мини-игры: уровни, счёт ходов против минимума, подсказки лесенкой, сброс, разбор после уровня,
// справка по клавишам. Таймера нет: в играх курса очки — метрика понятия, а не скорость (docs/conventions/games.md).
// Паузы тоже нет, пока ни одна игра не использует время (действие tick); появится вместе с такой игрой.
// Партия детерминирована: уровень k строится из rng(seed · 1000 + k), поэтому ?seed= воспроизводит партию.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { rng } from "../../lib/math/rng";
import { logEvent } from "../../lib/state/journal";
import type { GameSpec } from "./types";

export interface ShellView<State, Action, Params> {
  /** Действия оболочки в терминах игры. */
  reset: Action;
  hint: Action;
  levelName(params: Params): string;
  /** Видимая обратная связь: что получилось и что дальше. */
  feedback(state: State): string;
  /** Строка счёта под управлением: «Ходы: 3», «Минимум на уровне: 2» или «Очки: 87 из 100». */
  stats(state: State): readonly (readonly [string, string | number])[];
  /** Число действий игрока — в журнал (GameResult.actions). */
  actions(state: State): number;
  hints(state: State): number;
  debrief?(params: Params): { question: string; answer: string };
  /** Поле игры (рисунок). */
  board(state: State): ReactNode;
  /** Управление игрой: кнопки, поля. */
  controls(state: State, dispatch: (action: Action) => void): ReactNode;
  /** Справка по клавишам: [клавиши, действие]. */
  keys: readonly (readonly [string, string])[];
}

interface Props<State, Action, Params> {
  spec: GameSpec<State, Action, Params>;
  view: ShellView<State, Action, Params>;
  levels: number;
  seed?: number;
  /** Блок «Чему учит игра» и ссылка на урок — статичный HTML со страницы. */
  children?: ReactNode;
}

const params = <S, A, P>(spec: GameSpec<S, A, P>, seed: number, level: number) => spec.generate(rng(seed * 1000 + level), level + 1);

export function GameShell<State, Action, Params>({ spec, view, levels, seed: initialSeed = 1, children }: Props<State, Action, Params>) {
  const [seed, setSeed] = useState(initialSeed);
  const [level, setLevel] = useState(0);
  const [state, setState] = useState<State>(() => spec.init(params(spec, initialSeed, 0), rng(initialSeed)));
  const [done, setDone] = useState<boolean[]>(() => Array(levels).fill(false));
  const [hint, setHint] = useState("");
  const [answer, setAnswer] = useState(false);
  const [live, setLive] = useState("");
  const logged = useRef(false);
  const heading = useRef<HTMLParagraphElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);

  const solved = spec.status(state) === "solved";
  const lvlParams = params(spec, seed, level);

  const start = (s: number, k: number, focus = true) => {
    setSeed(s);
    setLevel(k);
    setState(spec.init(params(spec, s, k), rng(s)));
    setHint("");
    setAnswer(false);
    logged.current = false;
    if (focus) requestAnimationFrame(() => heading.current?.focus());
  };

  // ?seed=7&level=3 — партия по ссылке (и в тестах); читается после гидратации, чтобы разметка совпала с серверной
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const s = Number(q.get("seed") ?? initialSeed);
    const k = Math.min(levels, Math.max(1, Number(q.get("level") ?? 1))) - 1;
    if (Number.isInteger(s) && (s !== initialSeed || k !== 0)) start(s, k, false);
    // зависимостей нет намеренно: один раз при монтировании
  }, []);

  // описание для скринридера — с задержкой: серия нажатий не превращается в серию объявлений
  useEffect(() => {
    const t = setTimeout(() => setLive(spec.describe(state)), 400);
    return () => clearTimeout(t);
  }, [spec, state]);

  const log = (isSolved: boolean) =>
    logEvent({ type: "game", gameId: spec.id, version: spec.version, seed, level: level + 1, solved: isSolved, hints: view.hints(state), actions: view.actions(state) });

  useEffect(() => {
    if (!solved || logged.current) return;
    logged.current = true;
    setDone((d) => d.map((v, i) => (i === level ? true : v)));
    log(true);
    // управление уровнем выключилось — фокус с него не должен потеряться: переводим на «Следующий уровень»
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (!active || active === document.body || (active as HTMLButtonElement).disabled) nextButton.current?.focus();
    });
    // зависит только от solved: журналируем переход в «решено», а не каждый рендер
  }, [solved]);

  const dispatch = (action: Action) => setState((s) => spec.step(s, action));
  const askHint = () => {
    const next = spec.step(state, view.hint);
    setState(next);
    setHint(spec.hint?.(next) ?? "");
  };
  const next = () => {
    if (!solved) log(false); // пропуск уровня — тоже в журнал
    start(seed, (level + 1) % levels);
  };
  const debrief = view.debrief?.(lvlParams);

  return (
    <>
      {/* строка уровня — над полем: на телефоне матрица идёт сразу под рисунком, и результат хода виден */}
      <div className="game__top">
        <p className="game__level" ref={heading} tabIndex={-1}>
          Уровень {level + 1} из {levels}: {view.levelName(lvlParams)}
        </p>
        <ol className="game__levels" aria-label="Уровни">
          {done.map((ok, k) => (
            <li key={k}>
              <button
                type="button"
                className={["game__level-btn", ok && "is-done"].filter(Boolean).join(" ")}
                aria-current={k === level ? "step" : undefined}
                aria-label={`Уровень ${k + 1}${ok ? ", пройден" : ""}`}
                onClick={() => start(seed, k)}
              >
                {k + 1}
              </button>
            </li>
          ))}
        </ol>
      </div>
      <div className="game__layout">
        <div className="game__board">{view.board(state)}</div>
        <section className="game__panel" aria-label="Управление игрой">
          {view.controls(state, dispatch)}

          <div className="game__status">
            {view.stats(state).map(([label, value]) => (
              <span key={label}>
                {label}: <b>{value}</b>
              </span>
            ))}
          </div>
          <p className={["game__feedback", solved && "is-solved"].filter(Boolean).join(" ")}>{view.feedback(state)}</p>
          <p className="visually-hidden" aria-live="polite">
            {live}
          </p>
          <p className="game__hint" role="status">
            {hint && (
              <>
                <b>Подсказка {view.hints(state)}.</b> {hint}
              </>
            )}
          </p>

          <div className="game__actions">
            {solved ? (
              <button type="button" className="btn btn--sm btn--primary" ref={nextButton} onClick={next}>
                {level + 1 < levels ? "Следующий уровень" : "Начать с первого уровня"}
              </button>
            ) : (
              <button type="button" className="btn btn--sm" onClick={askHint}>
                Подсказка
              </button>
            )}
            <button type="button" className="btn btn--sm" onClick={() => setState(spec.step(state, view.reset))}>
              Начать уровень заново
            </button>
            {!solved && (
              <button type="button" className="btn btn--sm btn--quiet" onClick={next}>
                Пропустить уровень
              </button>
            )}
          </div>

          {solved && debrief && (
            <div className="block block--exercise game__debrief">
              <p>
                <span className="block__title">После уровня.</span> {debrief.question}
              </p>
              {answer ? (
                <p className="game__answer">{debrief.answer}</p>
              ) : (
                <button type="button" className="btn btn--sm btn--quiet" onClick={() => setAnswer(true)}>
                  Показать ответ
                </button>
              )}
            </div>
          )}

          <details className="game__keys">
            <summary>Управление с клавиатуры</summary>
            <dl>
              {view.keys.map(([k, what]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{what}</dd>
                </div>
              ))}
            </dl>
          </details>
          {children}
        </section>
      </div>
    </>
  );
}
