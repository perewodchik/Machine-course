// Виджет «Четыре взгляда на AB» (урок I.3): одно произведение, четыре способа его посчитать. Кнопки сверху
// переключают взгляд, кнопки снизу выбирают элемент, столбец, строку или слагаемое; выбранное подсвечено
// в A, B и AB, а расчёт написан словами под матрицами. Логика — model.ts.
import { useState } from "react";
import { useLiveText } from "../../_kit";
import { dims, explain, firstPick, lit, matmul, outerTerm, partialOuter, sub, VIEWS, type Matrix, type Pick, type View } from "./model";

export interface MatmulViewsProps {
  A?: Matrix;
  B?: Matrix;
  view?: View;
}

const num = (v: number) => String(v).replace("-", "−");
const rowsText = (M: Matrix) => M.map((r) => `(${r.map(num).join(", ")})`).join(", ");

function Mat({ M, name, on, words = false }: { M: Matrix; name: string; on: (i: number, j: number) => boolean; words?: boolean }) {
  return (
    <span className="mv__mat">
      <span className="mv__grid" role="img" aria-label={`${name}: строки ${rowsText(M)}`} style={{ gridTemplateColumns: `repeat(${dims(M)[1]}, auto)` }}>
        {M.flatMap((row, i) =>
          row.map((v, j) => (
            <span key={`${i}-${j}`} className={on(i, j) ? "is-lit" : undefined} aria-hidden="true">
              {num(v)}
            </span>
          )),
        )}
      </span>
      <span className={words ? "mv__name mv__name--text" : "mv__name"} aria-hidden="true">
        {name}
      </span>
    </span>
  );
}

export default function MatmulViews({ A = [[1, 0, 3], [2, -1, 1]], B = [[2, 1], [-1, 0], [1, 4]], view = "entry" }: MatmulViewsProps) {
  const [pick, setPick] = useState<Pick>(firstPick(view));
  const [m, inner] = dims(A);
  const p = dims(B)[1];
  const C = pick.view === "outer" ? partialOuter(A, B, pick.k) : matmul(A, B);
  const on = lit(pick);
  const text = explain(A, B, pick);
  const live = useLiveText(text);
  const choices: { label: string; pick: Pick }[] =
    pick.view === "entry"
      ? Array.from({ length: m * p }, (_, t) => ({ label: `(${Math.floor(t / p) + 1}, ${(t % p) + 1})`, pick: { view: "entry", i: Math.floor(t / p), j: t % p } }))
      : pick.view === "columns"
        ? Array.from({ length: p }, (_, j) => ({ label: `столбец ${j + 1}`, pick: { view: "columns", j } }))
        : pick.view === "rows"
          ? Array.from({ length: m }, (_, i) => ({ label: `строка ${i + 1}`, pick: { view: "rows", i } }))
          : Array.from({ length: inner }, (_, k) => ({ label: `k = ${k + 1}`, pick: { view: "outer", k } }));
  const same = (a: Pick, b: Pick) => JSON.stringify(a) === JSON.stringify(b);
  return (
    <div className="mv">
      <div className="mv__views" role="group" aria-label="Взгляд на произведение">
        {VIEWS.map((v) => (
          <button key={v.id} type="button" className="btn btn--sm" aria-pressed={pick.view === v.id} onClick={() => setPick(firstPick(v.id))}>
            {v.name}
          </button>
        ))}
      </div>
      <div className="mv__eq">
        <Mat M={A} name="A" on={on.a} />
        <span className="mv__op" aria-hidden="true">·</span>
        <Mat M={B} name="B" on={on.b} />
        <span className="mv__op" aria-hidden="true">=</span>
        {pick.view === "outer" ? (
          <>
            <Mat M={C} name={pick.k + 1 === inner ? "AB" : `сумма ${pick.k + 1} из ${inner}`} words={pick.k + 1 < inner} on={() => false} />
            <span className="mv__op mv__op--aside" aria-hidden="true">
              слагаемое
            </span>
            <Mat M={outerTerm(A, B, pick.k)} name={`a${sub(pick.k + 1)}b${sub(pick.k + 1)}ᵀ`} on={() => true} />
          </>
        ) : (
          <Mat M={C} name="AB" on={on.c} />
        )}
      </div>
      <div className="mv__picks" role="group" aria-label={pick.view === "entry" ? "Элемент AB" : pick.view === "columns" ? "Столбец AB" : pick.view === "rows" ? "Строка AB" : "Слагаемое суммы"}>
        {choices.map((c) => (
          <button key={c.label} type="button" className="btn btn--sm" aria-pressed={same(c.pick, pick)} onClick={() => setPick(c.pick)}>
            {c.label}
          </button>
        ))}
      </div>
      <p className="mv__explain">{text}</p>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
