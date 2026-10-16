// Виджет «Сжать картинку SVD» (урок I.11): картинка 48 × 48 и её приближение ранга k рядом, бегунок k,
// столбики сингулярных чисел (оставленные — цветом данных) и итог: сколько чисел хранить и какая ошибка.
// Картинки — canvas в цветах токенов туши и бумаги, перерисовываются при смене темы. Логика — model.ts.
import { useEffect, useMemo, useRef, useState } from "react";
import { plural } from "../../../i18n/ru";
import { ParamSlider, fmt, useLiveText } from "../../_kit";
import { lowRank, numericRank, picture, relError, SIZE, storage, svdOf, type Matrix } from "./model";

export interface LowRankProps {
  k?: number;
}

/** Тема могла смениться (кнопка в шапке или системная): счётчик, по которому картинки перерисовываются. */
function useThemeTick(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    const obs = new MutationObserver(bump);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", bump);
    return () => {
      obs.disconnect();
      mq.removeEventListener("change", bump);
    };
  }, []);
  return tick;
}

/**
 * Картинка на canvas: пиксель в пиксель 48 × 48, растягивается CSS без сглаживания. Тушь и бумага — токены
 * --ink и --paper из CSS; тысячи прямоугольников SVG замедляли страницу и проверку доступности.
 */
function Picture({ M, label, tick }: { M: Matrix; label: string; tick: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const css = getComputedStyle(canvas);
    ctx.globalAlpha = 1;
    ctx.fillStyle = css.getPropertyValue("--paper").trim();
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = css.getPropertyValue("--ink").trim();
    M.forEach((row, i) =>
      row.forEach((v, j) => {
        const a = Math.min(1, Math.max(0, v));
        if (a <= 0.004) return;
        ctx.globalAlpha = a;
        ctx.fillRect(j, i, 1, 1);
      }),
    );
  }, [M, tick]);
  return <canvas ref={ref} className="low-rank__img" width={SIZE} height={SIZE} role="img" aria-label={label} />;
}

export default function LowRank({ k: k0 = 5 }: LowRankProps) {
  const A = useMemo(() => picture(), []);
  const { s, V } = useMemo(() => svdOf(A), [A]);
  const r = numericRank(s);
  const [k, setK] = useState(k0);
  const Ak = useMemo(() => lowRank(A, V, k), [A, V, k]);
  const tick = useThemeTick();
  const err = relError(s, k) * 100;
  const nums = storage(SIZE, SIZE, k);
  const word = (n: number) => `${n} ${plural(n, "число", "числа", "чисел")}`;
  const text = `Ранг ${k}: ${word(nums)} вместо ${SIZE * SIZE}, ошибка ${fmt(err, 1)}\u00a0%.`;
  const live = useLiveText(text);
  const W = 4; // ширина столбика в единицах viewBox
  return (
    <div className="low-rank">
      <div className="low-rank__pics">
        <figure className="low-rank__pic">
          <Picture M={A} tick={tick} label={`Исходная картинка ${SIZE} × ${SIZE}: домик, солнце и земля.`} />
          <figcaption>
            исходная, {word(SIZE * SIZE)}
          </figcaption>
        </figure>
        <figure className="low-rank__pic">
          <Picture M={Ak} tick={tick} label={`Приближение ранга ${k}.`} />
          <figcaption>
            ранг {k}, {word(nums)}
          </figcaption>
        </figure>
      </div>
      <svg className="low-rank__bars" viewBox={`0 0 ${r * W} 40`} preserveAspectRatio="none" role="img" aria-label={`Сингулярные числа картинки, σ₁ = ${fmt(s[0]!, 1)}, всего ${r} ненулевых; оставлены первые ${k}.`}>
        {s.slice(0, r).map((x, i) => {
          const h = Math.max(0.6, (x / s[0]!) * 40);
          return <rect key={i} className={i < k ? "low-rank__bar is-kept" : "low-rank__bar"} x={i * W + 0.5} y={40 - h} width={W - 1} height={h} />;
        })}
      </svg>
      <p className="low-rank__axis">сингулярные числа σ₁ ≥ σ₂ ≥ … ≥ σ{String(r).replace(/\d/g, (d) => "₀₁₂₃₄₅₆₇₈₉"[+d]!)}; цветом — оставленные</p>
      <div className="low-rank__controls">
        <ParamSlider name="k" value={k} min={1} max={r} step={1} digits={0} onChange={setK} />
        <p className="low-rank__fact">
          Хранить {k}({SIZE} + {SIZE} + 1) = {word(nums)} из {SIZE * SIZE}, относительная ошибка ‖A − A<sub>k</sub>‖<sub>F</sub> / ‖A‖<sub>F</sub> = {fmt(err, 1)}{"\u00a0"}%.
        </p>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
