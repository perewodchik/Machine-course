// Виджет «События как области» (урок III.1): сетка 6 × 6 исходов двух кубиков. Клетки события A залиты, клетки B
// обведены, у каждой — буквы A и B (цвет не единственный носитель смысла); результат операции отмечен точкой.
// Выбор A, B и операции; показания — числа клеток и проверка включений-исключений. Логика — model.ts.
import { Fragment, useState } from "react";
import { fmt, useLiveText } from "../../_kit";
import { combine, count, EVENT_IDS, EVENTS, independent, OMEGA, OP_NAMES, prob, type EventId, type Op } from "./model";

export interface EventsProps {
  initial?: { a?: EventId; b?: EventId; op?: Op };
  /** Какие операции показывать; по умолчанию — объединение, пересечение и дополнение (урок III.1). */
  ops?: Op[];
  /** Показывать проверку независимости P(A ∩ B) = P(A) P(B) (урок III.2). */
  showIndependence?: boolean;
}

const frac = (k: number) => `${k}/36`;

export default function Events({ initial = {}, ops = ["union", "intersection", "complementA"], showIndependence = false }: EventsProps) {
  const [aId, setA] = useState<EventId>(initial.a ?? "sum8");
  const [bId, setB] = useState<EventId>(initial.b ?? "evenFirst");
  const [op, setOp] = useState<Op>(initial.op ?? "union");
  const [a, b] = [EVENTS[aId], EVENTS[bId]];
  const res = combine(op, a, b);
  const [na, nb, nab, nr] = [count(a.has), count(b.has), count(combine("intersection", a, b)), count(res)];
  const check =
    op === "union" ? `${frac(na)} + ${frac(nb)} − ${frac(nab)} = ${frac(na + nb - nab)}` : op === "complementA" ? `1 − ${frac(na)} = ${frac(36 - na)}` : op === "given" ? `${nab}/${nb} ≈ ${fmt(nab / nb, 3)}` : `${frac(nab)}`;
  const indep = independent(a, b);
  const live = useLiveText(`A — ${a.name}, ${na} исходов; B — ${b.name}, ${nb}; A ∩ B — ${nab}. ${op === "given" ? `P(A | B) = ${nab}/${nb}` : `${OP_NAMES[op]}: ${nr} из 36, вероятность ${fmt(prob(res), 3)}`}.${showIndependence ? (indep ? " A и B независимы." : " A и B зависимы.") : ""}`);

  return (
    <div className="events">
      <div className="events__grid" role="img" aria-label={`Сетка 36 исходов двух кубиков: событие A (${a.name}) — ${na} клеток, B (${b.name}) — ${nb}, ${OP_NAMES[op]} — ${nr}`}>
        <span className="events__corner" aria-hidden="true" />
        {[1, 2, 3, 4, 5, 6].map((v) => (
          <span key={`c${v}`} className="events__head" aria-hidden="true">
            {v}
          </span>
        ))}
        {OMEGA.map((o, i) => (
          <Fragment key={`${o[0]}${o[1]}`}>
            {i % 6 === 0 && (
              <span className="events__head" aria-hidden="true">
                {o[0]}
              </span>
            )}
            <span className={["events__cell", a.has(o) && "is-a", b.has(o) && "is-b", res(o) && "is-res", op === "given" && !b.has(o) && "is-out"].filter(Boolean).join(" ")} aria-hidden="true">
              <span className="events__tags">{`${a.has(o) ? "A" : ""}${b.has(o) ? "B" : ""}`}</span>
            </span>
          </Fragment>
        ))}
      </div>
      <div className="events__controls">
        <div className="events__group" role="group" aria-label="Событие A">
          <span className="events__label">A:</span>
          {EVENT_IDS.map((id) => (
            <button key={id} type="button" className="btn btn--sm" aria-pressed={aId === id} onClick={() => setA(id)}>
              {EVENTS[id].name}
            </button>
          ))}
        </div>
        <div className="events__group" role="group" aria-label="Событие B">
          <span className="events__label">B:</span>
          {EVENT_IDS.map((id) => (
            <button key={id} type="button" className="btn btn--sm" aria-pressed={bId === id} onClick={() => setB(id)}>
              {EVENTS[id].name}
            </button>
          ))}
        </div>
        <div className="events__group" role="group" aria-label="Операция">
          {ops.map((k) => (
            <button key={k} type="button" className="btn btn--sm" aria-pressed={op === k} onClick={() => setOp(k)}>
              {OP_NAMES[k]}
            </button>
          ))}
        </div>
        <p className="events__facts">
          <span>
            |A| = <b>{na}</b>
          </span>
          <span>
            |B| = <b>{nb}</b>
          </span>
          <span>
            |A ∩ B| = <b>{nab}</b>
          </span>
          <span>
            P({OP_NAMES[op]}) = <b>{check}</b>
          </span>
        </p>
        {showIndependence && (
          <p className="events__facts">
            <span>
              P(A ∩ B) = <b>{`${frac(nab)} ≈ ${fmt(nab / 36, 4)}`}</b>
            </span>
            <span>
              P(A) · P(B) = <b>{fmt((na * nb) / 1296, 4)}</b>
            </span>
            <span className="events__verdict">{indep ? "A и B независимы" : "A и B зависимы"}</span>
          </p>
        )}
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
