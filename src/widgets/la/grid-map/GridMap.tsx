// Виджет «Деформация сетки» (урок I.4): матрица A 2 × 2 переводит клетку плоскости в сетку параллелограммов.
// Неподвижная клетка Plane — исходная плоскость, карандашные линии — её образ, синяя ручка — образ единичного
// квадрата (площадь |det A|), стрелки Ae₁ и Ae₂ — столбцы A тех же цветов, что и бегунки столбцов.
// Режим compose: две заданные матрицы и выбор порядка — «сначала B, потом A» это AB, а не BA.
import { useId, useState } from "react";
import { ParamSlider, Plane, Polygon, Readout, Vector, useLiveText, usePlane } from "../../_kit";
import { column, compose as product, describe, det, fmtNum, gridImage, IDENTITY, PRESETS, unitSquare, type Mat2 } from "./model";

export interface GridMapProps {
  /** Начальная матрица; по умолчанию — единичная. */
  initial?: Mat2;
  /** Какие готовые матрицы показать кнопками (id из PRESETS); [] — без кнопок. */
  presets?: string[];
  /** Только готовые матрицы, без бегунков. */
  lock?: boolean;
  /** Режим композиции: две матрицы с именами и выбор порядка. */
  compose?: { A: Mat2; B: Mat2; nameA: string; nameB: string };
}

const N = 4; // сетка [−4, 4]²
const LIMIT = 2; // элементы A — от −2 до 2

function Grid({ A }: { A: Mat2 }) {
  const { layout } = usePlane();
  return (
    <g className="grid-map__grid" aria-hidden="true">
      {gridImage(A, N + 2).map((s, i) => (
        <line
          key={i}
          className={s.axis ? "grid-map__axis" : "grid-map__line"}
          x1={layout.sx(s.from[0])}
          y1={layout.sy(s.from[1])}
          x2={layout.sx(s.to[0])}
          y2={layout.sy(s.to[1])}
        />
      ))}
    </g>
  );
}

function matrixText(A: Mat2) {
  return `(${fmtNum(A[0][0])} ${fmtNum(A[0][1])}; ${fmtNum(A[1][0])} ${fmtNum(A[1][1])})`;
}

export default function GridMap({ initial = IDENTITY, presets, lock = false, compose }: GridMapProps) {
  const [A, setA] = useState<Mat2>(initial);
  const [order, setOrder] = useState<"AB" | "BA">("AB");
  const group = useId(); // имя группы радиокнопок: на странице может быть несколько виджетов
  const shown = compose ? (order === "AB" ? product(compose.A, compose.B) : product(compose.B, compose.A)) : A;
  const live = useLiveText(describe(shown));
  const buttons = PRESETS.filter((p) => (presets ? presets.includes(p.id) : true));

  const set = (i: 0 | 1, j: 0 | 1) => (v: number) =>
    setA((m) => {
      const rows = m.map((r) => [...r]) as [number, number][];
      rows[i]![j] = v;
      return [rows[0]!, rows[1]!] as unknown as Mat2;
    });
  const slider = (i: 0 | 1, j: 0 | 1) => (
    <ParamSlider
      key={`${i}${j}`}
      name={`a_{${i + 1}${j + 1}}`}
      value={A[i][j]}
      min={-LIMIT}
      max={LIMIT}
      step={0.1}
      digits={1}
      role={j === 0 ? "data" : "param"}
      onChange={set(i, j)}
    />
  );

  return (
    <div className="grid-map">
      <Plane
        x={[-N, N]}
        y={[-N, N]}
        xStep={1}
        yStep={1}
        height={{ ratio: 1, min: 240, max: 440 }}
        initialWidth={440}
        label="Клетчатая плоскость и её образ: карандашные линии — образ сетки, закрашенный параллелограмм — образ единичного квадрата, стрелки — Ae₁ и Ae₂."
      >
        <Grid A={shown} />
        <Polygon points={unitSquare(shown)} tone="pen" />
        <Vector to={column(shown, 0)} role="data" label="Ae_1" />
        <Vector to={column(shown, 1)} role="param" label="Ae_2" />
      </Plane>
      <div className="grid-map__controls">
        {compose ? (
          <div className="grid-map__order" role="radiogroup" aria-label="Порядок отображений">
            {(["AB", "BA"] as const).map((o) => {
              const [first, second] = o === "AB" ? [compose.nameB, compose.nameA] : [compose.nameA, compose.nameB];
              return (
                <label key={o} className="grid-map__choice">
                  <input type="radio" name={group} checked={order === o} onChange={() => setOrder(o)} />
                  <span>
                    сначала {first}, потом {second}: <b>{o === "AB" ? `${compose.nameA}${compose.nameB}` : `${compose.nameB}${compose.nameA}`}</b>
                  </span>
                </label>
              );
            })}
            <p className="grid-map__matrix">
              Матрица: <b>{matrixText(shown)}</b>
            </p>
          </div>
        ) : (
          <>
            {!lock && (
              <div className="grid-map__sliders" role="group" aria-label="Элементы матрицы A по строкам">
                {slider(0, 0)}
                {slider(0, 1)}
                {slider(1, 0)}
                {slider(1, 1)}
              </div>
            )}
            {buttons.length > 0 && (
              <div className="grid-map__presets" role="group" aria-label="Готовые матрицы">
                {buttons.map((p) => (
                  <button key={p.id} type="button" className="btn btn--sm" aria-pressed={matrixText(A) === matrixText(p.matrix)} onClick={() => setA(p.matrix)}>
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        <Readout name={compose ? `det ${order === "AB" ? compose.nameA + compose.nameB : compose.nameB + compose.nameA}` : "det A"} value={det(shown)} digits={2} />
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
