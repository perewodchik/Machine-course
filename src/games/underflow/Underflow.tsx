// Представление «Underflow»: график десятичного порядка произведения (уровни 1–3) или суммы логарифмов (4–5)
// по числу объектов. Прогноз ученика — линия цвета параметра, ответ появляется после «Перемножить».
// Логика — model.ts, оболочка — GameShell.
import { useMemo, type ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { Line, ParamSlider, Plane, Point } from "../../widgets/_kit";
import { answer, COMPARE_N, DEBRIEF, fmt, KIND_NAMES, LEVELS, LOG_N, underflow as game, underflowAt, type Action, type Level, type State } from "./model";

/** Наименьшее обычное и наименьшее положительное число float64 — десятичные порядки. */
const NORMAL = -308;
const ZERO = -324;
const SAMPLES = 60;

/** Накопленная сумма f(pᵢ) в SAMPLES + 1 точках от 0 до n: ломаная для графика. */
function curve(probs: readonly number[], n: number, f: (p: number) => number): [number, number][] {
  const pts: [number, number][] = [[0, 0]];
  let sum = 0;
  let next = 1;
  for (let i = 1; i <= n; i++) {
    sum += f(probs[i - 1]!);
    if (i >= (next * n) / SAMPLES || i === n) {
      pts.push([i, sum]);
      next++;
    }
  }
  return pts;
}

function Polyline({ pts, role }: { pts: [number, number][]; role: "data" | "target" }) {
  return (
    <>
      {pts.slice(1).map((p, i) => (
        <Line key={i} from={pts[i]!} to={p} role={role} />
      ))}
    </>
  );
}

function Board({ state }: { state: State }) {
  const { level } = state;
  const [lo, hi] = level.range;
  const source = lo === hi ? `все вероятности pᵢ = ${lo}` : `вероятности pᵢ от ${lo} до ${hi}`;
  const zeroAt = useMemo(() => underflowAt(level.probs), [level]);
  const product = useMemo(() => (level.kind === "logsum" || level.kind === "compare" ? [] : curve(level.probs, zeroAt, Math.log10)), [level, zeroAt]);
  const logs = useMemo(() => (level.kind === "logsum" || level.kind === "compare" ? curve(level.probs, level.probs.length, Math.log) : []), [level]);
  const logsB = useMemo(() => (level.probsB ? curve(level.probsB, level.probsB.length, Math.log) : []), [level]);

  if (level.kind === "logsum" || level.kind === "compare") {
    const n = level.kind === "logsum" ? LOG_N : COMPARE_N;
    const yMin = level.kind === "logsum" ? -3000 : -2500;
    const show = level.kind === "logsum" ? state.revealed : state.logs;
    return (
      <figure className="game__figure">
        <Plane
          x={[0, n]}
          y={[yMin, 0]}
          yStep={500}
          height={{ ratio: 0.7, min: 240, max: 440 }}
          initialWidth={560}
          xLabel="объектов n"
          yLabel="Σ ln pᵢ"
          label={`Сумма натуральных логарифмов вероятностей по числу объектов, ${n} объектов.${show ? " Кривые построены." : ""}`}
        >
          {level.kind === "logsum" && <Line from={[0, state.guess]} to={[n, state.guess]} role="param" label="прогноз" labelAbove />}
          {show && <Polyline pts={logs} role="data" />}
          {show && level.kind === "compare" && <Polyline pts={logsB} role="target" />}
          {show && level.kind === "logsum" && <Point x={n} y={answer(level)} role="data" />}
        </Plane>
        <figcaption className="game__legend">
          {level.kind === "logsum" ? (
            <>
              <span className="key">{n} объектов, {source}</span>
              <span className="key"><span className="game__swatch game__swatch--s2" aria-hidden="true" />ваш прогноз</span>
              {show && <span className="key"><span className="game__swatch game__swatch--s1" aria-hidden="true" />сумма логарифмов</span>}
            </>
          ) : (
            <>
              <span className="key">{n} объектов; ∏ pᵢ во float: у A — 0, у B — 0</span>
              {show && <span className="key"><span className="game__swatch game__swatch--s1" aria-hidden="true" />модель A</span>}
              {show && <span className="key"><span className="game__swatch game__swatch--s3" aria-hidden="true" />модель B</span>}
            </>
          )}
        </figcaption>
      </figure>
    );
  }

  return (
    <figure className="game__figure">
      <Plane
        x={[0, level.xMax]}
        y={[-340, 0]}
        yStep={50}
        height={{ ratio: 0.7, min: 240, max: 440 }}
        initialWidth={560}
        xLabel="объектов n"
        yLabel="порядок ∏ pᵢ"
        label={`Десятичный порядок произведения вероятностей по числу объектов, ${source}.${state.revealed ? ` Произведение стало нулём на объекте ${zeroAt}.` : ""}`}
      >
        <Line from={[0, NORMAL]} to={[level.xMax, NORMAL]} role="aux" label="10^{−308}" labelAbove />
        <Line from={[0, ZERO]} to={[level.xMax, ZERO]} role="aux" label="ноль" />
        <Line from={[state.guess, 0]} to={[state.guess, -340]} role="param" label="прогноз" />
        {state.revealed && <Polyline pts={product} role="data" />}
        {state.revealed && <Point x={zeroAt} y={ZERO} role="target" />}
      </Plane>
      <figcaption className="game__legend">
        <span className="key">{source}</span>
        <span className="key"><span className="game__swatch game__swatch--s2" aria-hidden="true" />ваш прогноз</span>
        {state.revealed && <span className="key"><span className="game__swatch game__swatch--s1" aria-hidden="true" />порядок произведения</span>}
        <span className="key"><span className="game__swatch game__swatch--target" aria-hidden="true" />пределы float64</span>
      </figcaption>
    </figure>
  );
}

function Controls({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const { level } = state;
  const done = game.status(state) === "solved";
  if (level.kind === "compare") {
    return (
      <div className="game-under">
        <p className="game-under__task">У обеих моделей произведение вероятностей во float — ноль. Какая лучше объясняет данные?</p>
        <button type="button" className="btn btn--sm" disabled={done || state.logs} onClick={() => dispatch({ type: "logs" })}>
          Посчитать суммы логарифмов
        </button>
        <div className="game-under__picks" role="group" aria-label="Выбор модели">
          <button type="button" className="btn btn--sm" disabled={done} onClick={() => dispatch({ type: "pick", pick: "A" })}>
            Лучше A
          </button>
          <button type="button" className="btn btn--sm" disabled={done} onClick={() => dispatch({ type: "pick", pick: "B" })}>
            Лучше B
          </button>
          <button type="button" className="btn btn--sm" disabled={done} onClick={() => dispatch({ type: "pick", pick: "same" })}>
            Не различить
          </button>
        </div>
      </div>
    );
  }
  const logsum = level.kind === "logsum";
  return (
    <div className="game-under">
      <p className="game-under__task">
        {logsum ? `Чему равна сумма натуральных логарифмов вероятностей ${LOG_N} объектов, S = Σ ln pᵢ?` : "Перемножаем вероятности объектов по одной. На каком объекте произведение во float64 станет нулём?"}
      </p>
      {logsum ? (
        <ParamSlider name="S" value={state.guess} min={-3000} max={0} step={level.step} digits={0} disabled={done} onChange={(v) => dispatch({ type: "set", value: v })} />
      ) : (
        <ParamSlider name="n" value={state.guess} min={level.step} max={level.xMax} step={level.step} digits={0} disabled={done} onChange={(v) => dispatch({ type: "set", value: v })} />
      )}
      <button type="button" className="btn btn--sm btn--primary" disabled={done} onClick={() => dispatch({ type: "reveal" })}>
        {logsum ? "Посчитать" : "Перемножить"}
      </button>
    </div>
  );
}

const view: ShellView<State, Action, Level> = {
  reset: { type: "reset" },
  hint: { type: "hint" },
  levelName: (l) => KIND_NAMES[l.kind],
  feedback: (s) => game.feedback(s),
  stats: (s) => [s.level.kind === "compare" ? ["Выборов", s.picks.length] : ["Точность", game.status(s) === "solved" ? `${fmt(100 * game.score(s))} %` : "—"]],
  actions: (s) => s.moves + s.picks.length + (s.revealed ? 1 : 0),
  hints: (s) => s.hints,
  debrief: (l) => DEBRIEF[l.kind],
  board: (s) => <Board state={s} />,
  controls: (s, dispatch) => <Controls state={s} dispatch={dispatch} />,
  keys: [
    ["Стрелки на бегунке", "сдвинуть прогноз на шаг; Page Up и Page Down — на десять шагов"],
    ["Tab", "перейти к кнопкам"],
    ["Подсказка", "сначала предел float64, потом как оценить, потом ответ"],
  ],
};

export function Underflow({ seed = 1, children }: { seed?: number; children?: ReactNode }) {
  return (
    <GameShell spec={game} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
