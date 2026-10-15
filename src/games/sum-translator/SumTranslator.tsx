// Представление «Переводчика сумм»: задание — индексная запись, ниже — запись ученика и её перевод обратно в индексы
// (или место, где множители не стыкуются). Справа — плитки множителей и цепочка с кнопками ⊤ и «Убрать».
// Формулы собираются из HTML шрифтами KaTeX: запись ученика меняется на каждом ходе, а KaTeX в клиенте не грузим.
import type { ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { chainShape, DEBRIEF, formSpeech, indexForm, isMismatch, KIND_NAMES, LEVELS, MAX_CHAIN, mismatchText, sizeText, sumTranslator as game, type Action, type Factor, type IndexForm, type Level, type State, type Tile } from "./model";

function Name({ tile }: { tile: Tile }) {
  return tile.ones ? <b className="ix__one">1</b> : <i>{tile.name}</i>;
}

function Chain({ level, chain }: { level: Level; chain: readonly Factor[] }) {
  return (
    <span className="ix">
      {chain.map((f, k) => (
        <span key={k} className="ix__factor">
          <Name tile={level.tiles[f.tile]!} />
          {f.t && <sup>⊤</sup>}
        </span>
      ))}
    </span>
  );
}

/** Индексная запись: знаки суммы с пределами, множители с индексами; без множителей — единица. */
function Form({ form }: { form: IndexForm }) {
  return (
    <span className="ix">
      {form.sums.map((s) => (
        <span key={s.letter} className="ix__sum">
          <span className="ix__limit">{s.to}</span>
          <span className="ix__sigma">∑</span>
          <span className="ix__limit">
            <i>{s.letter}</i>=1
          </span>
        </span>
      ))}
      {form.terms.length ? (
        form.terms.map((t, k) => (
          <span key={k} className="ix__term">
            <i>{t.name}</i>
            <sub>
              {t.sub.map((l) => (
                <i key={l}>{l}</i>
              ))}
            </sub>
          </span>
        ))
      ) : (
        <span className="ix__term">1</span>
      )}
    </span>
  );
}

/** «i = 1, …, 3» или «j, k = 1, …, 3»: свободные индексы — номера элементов результата. */
function Free({ form }: { form: IndexForm }) {
  if (!form.free.length) return null;
  const same = form.free.every((v) => v.to === form.free[0]!.to);
  const range = (letters: ReactNode, to: number) => (
    <>
      {letters} = 1, …, {to}
    </>
  );
  return (
    <span className="ix-free">
      {same
        ? range(
            form.free.map((v, k) => (
              <span key={v.letter}>
                {k > 0 && ", "}
                <i>{v.letter}</i>
              </span>
            )),
            form.free[0]!.to,
          )
        : form.free.map((v, k) => (
            <span key={v.letter}>
              {k > 0 && "; "}
              {range(<i>{v.letter}</i>, v.to)}
            </span>
          ))}
    </span>
  );
}

function Board({ state }: { state: State }) {
  const { level, chain } = state;
  const target = indexForm(level, level.answer)!;
  const mine = indexForm(level, chain);
  const shape = chainShape(level, chain);
  return (
    <figure className="game__figure game-sum">
      <div className="game-sum__row">
        <p className="game-sum__label">Задание</p>
        <p className="game-sum__math">
          <span className="visually-hidden">{formSpeech(target)}</span>
          <span aria-hidden="true">
            <Form form={target} />
            <Free form={target} />
          </span>
        </p>
      </div>
      <div className="game-sum__row game-sum__row--mine">
        <p className="game-sum__label">Ваша запись</p>
        {chain.length ? (
          <p className="game-sum__math">
            <span className="visually-hidden">{`${chain.map((f) => `${level.tiles[f.tile]!.name}${f.t ? " транспонированное" : ""}`).join(", ")}${mine ? ` равно ${formSpeech(mine)}` : ""}`}</span>
            <span aria-hidden="true">
              <Chain level={level} chain={chain} />
              {mine && (
                <>
                  <span className="ix__eq">=</span>
                  <Form form={mine} />
                  <Free form={mine} />
                </>
              )}
            </span>
          </p>
        ) : (
          <p className="game-sum__empty">Пока пусто: добавьте множители справа.</p>
        )}
        {chain.length > 0 && <p className={shape.ok ? "game-sum__size" : "game-sum__size is-error"}>{shape.ok ? `Получается ${sizeText(shape.shape)}.` : isMismatch(shape) ? mismatchText(level, chain, shape) : ""}</p>}
      </div>
      <figcaption className="game__legend">
        {level.tiles.map((t, i) => (
          <span key={i} className="key">
            <span className="ix">
              <Name tile={t} />
            </span>
            {t.ones ? ` — столбец из ${t.rows} единиц` : ` — ${sizeText({ rows: t.rows, cols: t.cols })}`}
          </span>
        ))}
        {level.tiles.some((t) => t.name === "X") && (
          <span className="key">
            строка{"\u00a0"}
            <span className="ix">
              <i>i</i>
            </span>{" "}
            — признаки объекта{"\u00a0"}
            <span className="ix">
              <i>i</i>
            </span>
          </span>
        )}
      </figcaption>
    </figure>
  );
}

function Controls({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const { level, chain } = state;
  const done = game.status(state) === "solved";
  const full = chain.length >= MAX_CHAIN;
  return (
    <div className="game-sum__controls">
      <div role="group" aria-labelledby="sum-add">
        <p id="sum-add" className="game-sum__label">Добавить множитель</p>
        <div className="game-sum__tiles">
          {level.tiles.map((t, i) => (
            <button key={i} type="button" className="btn btn--sm game-sum__tile" disabled={done || full} onClick={() => dispatch({ type: "add", tile: i })} aria-label={`Добавить ${t.ones ? "вектор из единиц" : t.name}`}>
              <span className="ix" aria-hidden="true">
                <Name tile={t} />
              </span>
            </button>
          ))}
        </div>
      </div>
      {chain.length > 0 && (
        <ol className="game-sum__chain" aria-label="Множители записи по порядку">
          {chain.map((f, k) => {
            const t = level.tiles[f.tile]!;
            const name = t.ones ? "вектор из единиц" : t.name;
            return (
              <li key={k}>
                <span className="ix" aria-hidden="true">
                  <Name tile={t} />
                  {f.t && <sup>⊤</sup>}
                </span>
                <button type="button" className="btn btn--sm game-sum__t" aria-pressed={f.t} aria-label={`Транспонировать ${name}`} disabled={done} onClick={() => dispatch({ type: "toggle", at: k })}>
                  ⊤
                </button>
                <button type="button" className="btn btn--sm btn--quiet" aria-label={`Убрать ${name}`} disabled={done} onClick={() => dispatch({ type: "remove", at: k })}>
                  Убрать
                </button>
              </li>
            );
          })}
        </ol>
      )}
      <div className="game-sum__actions">
        <button type="button" className="btn btn--sm btn--primary" disabled={done} onClick={() => dispatch({ type: "check" })}>
          Проверить
        </button>
        <button type="button" className="btn btn--sm btn--quiet" disabled={done || !chain.length} onClick={() => dispatch({ type: "clear" })}>
          Очистить
        </button>
      </div>
    </div>
  );
}

const view: ShellView<State, Action, Level> = {
  reset: { type: "reset" },
  hint: { type: "hint" },
  levelName: (l) => KIND_NAMES[l.kind],
  feedback: (s) => game.feedback(s),
  stats: (s) => [["Проверок", s.checks]],
  actions: (s) => s.checks,
  hints: (s) => s.hints,
  debrief: (l) => DEBRIEF[l.kind],
  board: (s) => <Board state={s} />,
  controls: (s, dispatch) => <Controls state={s} dispatch={dispatch} />,
  keys: [
    ["Tab", "перейти к следующей кнопке"],
    ["Enter или пробел", "добавить множитель, транспонировать его (⊤) или убрать"],
    ["Подсказка", "сначала общее правило, потом что сделать на этом уровне, потом ответ"],
  ],
};

export function SumTranslator({ seed = 1, children }: { seed?: number; children?: ReactNode }) {
  return (
    <GameShell spec={game} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
