// Виджет «Сетка из 1000 человек» (урок III.3): каждый квадрат — человек. Цвет — болен (пурпур, роль «ответ»)
// или здоров (карандаш), заливка — тест положителен, контур — отрицателен. «По тесту» собирает положительных
// вместе: видно, что среди них больных меньшинство, хотя тест «точный». Эталонные числа — model.test.ts.
// conceal: рисунок стоит под вопросом «Предскажите» — доля больных среди положительных скрыта до первого действия.
import { useId, useRef, useState } from "react";
import { ParamSlider, Readout, useLiveText } from "../../_kit";
import { arrange, counts, DEFAULT, describe, evidence, pct, posterior, POPULATION, type Group, type Order, type Params } from "./model";

export interface BayesGridProps {
  initial?: Partial<Params>;
  /** Какие параметры можно менять; по умолчанию — все. */
  controls?: (keyof Params)[];
  order?: Order;
  /** Скрыть ответ P(болен | +), пока ученик не тронет рисунок или не нажмёт «Показать долю». */
  conceal?: boolean;
}

const GROUP_TEXT: Record<Group, string> = {
  tp: "болен, тест +",
  fn: "болен, тест −",
  fp: "здоров, тест +",
  tn: "здоров, тест −",
};

const CELL = 10; // единица viewBox на человека

function Board({ cells, cols, label, variant }: { cells: Group[]; cols: number; label: string; variant: "wide" | "tall" }) {
  const rows = POPULATION / cols;
  return (
    <svg className={`bayes-grid__svg bayes-grid__svg--${variant}`} viewBox={`0 0 ${cols * CELL} ${rows * CELL}`} role="img" aria-label={label}>
      {cells.map((g, i) => (
        <rect key={i} className={`bayes-grid__cell bayes-grid__cell--${g}`} x={(i % cols) * CELL + 1} y={Math.floor(i / cols) * CELL + 1} width={CELL - 2} height={CELL - 2} rx={1} />
      ))}
    </svg>
  );
}

export default function BayesGrid({ initial, controls = ["prevalence", "sensitivity", "falsePositive"], order: initialOrder = "disease", conceal = false }: BayesGridProps) {
  const [p, setP] = useState<Params>({ ...DEFAULT, ...initial });
  const [order, setOrder] = useState<Order>(initialOrder);
  const [concealed, setConcealed] = useState(conceal);
  const summary = useRef<HTMLParagraphElement>(null);
  const group = useId();
  const c = counts(p);
  const cells = arrange(c, order);
  const text = describe(p, concealed);
  const live = useLiveText(text);
  const set = (key: keyof Params) => (v: number) => {
    setP((q) => ({ ...q, [key]: v }));
    setConcealed(false);
  };
  const pos = c.tp + c.fp;

  return (
    <div className="bayes-grid">
      <div className="bayes-grid__board">
        {/* две раскладки с постоянным viewBox, выбор — CSS по ширине: разметка не прыгает при гидратации */}
        <Board cells={cells} cols={40} label={text} variant="wide" />
        <Board cells={cells} cols={25} label={text} variant="tall" />
      </div>
      <ul className="bayes-grid__legend">
        {(["tp", "fn", "fp", "tn"] as const).map((g) => (
          <li key={g}>
            <span className={`bayes-grid__swatch bayes-grid__cell--${g}`} aria-hidden="true" />
            {GROUP_TEXT[g]}: <b>{c[g]}</b>
          </li>
        ))}
      </ul>
      {concealed ? (
        <p className="bayes-grid__summary">
          Положительных: <b>{pos}</b>. Какая доля из них больна? Сначала ответьте на вопрос выше.{" "}
          <button
            type="button"
            className="btn btn--sm btn--quiet"
            onClick={() => {
              setConcealed(false);
              // кнопка исчезает — фокус переходит на открывшийся ответ, а не теряется
              requestAnimationFrame(() => summary.current?.focus());
            }}
          >
            Показать долю
          </button>
        </p>
      ) : (
        <p className="bayes-grid__summary" ref={summary} tabIndex={-1}>
          Положительных: <b>{pos}</b>, из них больны <b>{c.tp}</b> — это {pos ? pct(c.tp / pos) : "—"} положительных.
        </p>
      )}
      <div className="bayes-grid__controls">
        {controls.includes("prevalence") && (
          <ParamSlider name="P(болен)" value={p.prevalence} min={0.001} max={0.5} step={0.001} digits={3} role="target" onChange={set("prevalence")} />
        )}
        {controls.includes("sensitivity") && (
          <ParamSlider name="P(+ | болен)" value={p.sensitivity} min={0.5} max={1} step={0.01} digits={2} role="aux" onChange={set("sensitivity")} />
        )}
        {controls.includes("falsePositive") && (
          <ParamSlider name="P(+ | здоров)" value={p.falsePositive} min={0} max={0.3} step={0.01} digits={2} role="aux" onChange={set("falsePositive")} />
        )}
        <div className="bayes-grid__order" role="radiogroup" aria-label="Как расставить людей">
          {(
            [
              ["disease", "по болезни"],
              ["test", "по результату теста"],
            ] as const
          ).map(([o, text]) => (
            <label key={o} className="bayes-grid__choice">
              <input
                type="radio"
                name={group}
                checked={order === o}
                onChange={() => {
                  setOrder(o);
                  setConcealed(false);
                }}
              />
              {text}
            </label>
          ))}
        </div>
        <div className="bayes-grid__readouts">
          <Readout name="P(+)" value={evidence(p)} digits={4} />
          {!concealed && <Readout name="P(болен | +)" value={posterior(p)} digits={3} />}
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
