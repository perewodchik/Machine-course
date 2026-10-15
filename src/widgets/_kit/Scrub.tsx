// «Живое число» в тексте (идея A4): потяните вбок или нажмите стрелки — значение меняется, рисунок следом.
// Для скринридера — spinbutton со значением; Shift + стрелка — десять шагов (как PageUp/PageDown).
import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { fmt, plainLabel } from "./format";
import { useLit } from "./hooks";
import { roleClass, type Role } from "./roles";
import { dragValue, keyValue, type StepOptions } from "./scrub";

interface Props extends StepOptions {
  /** Что меняется: «наклон θ_1». */
  label: string;
  value: number;
  onChange: (v: number) => void;
  role?: Role;
  sym?: string;
  digits?: number;
}

export function Scrub({ label, value, onChange, min, max, step, role = "param", sym, digits = 2 }: Props) {
  const drag = useRef<{ x: number; start: number } | null>(null);
  const lit = useLit(sym);
  const o = { min, max, step };

  const onKeyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
    const key = e.shiftKey && e.key.startsWith("Arrow") ? (e.key === "ArrowUp" || e.key === "ArrowRight" ? "PageUp" : "PageDown") : e.key;
    const next = keyValue(key, value, o);
    if (next === null) return;
    e.preventDefault();
    if (next !== value) onChange(next);
  };
  const onPointerDown = (e: PointerEvent<HTMLSpanElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, start: value };
  };
  const onPointerMove = (e: PointerEvent<HTMLSpanElement>) => {
    if (!drag.current) return;
    const next = dragValue(drag.current.start, e.clientX - drag.current.x, o);
    if (next !== value) onChange(next);
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  return (
    <span
      role="spinbutton"
      tabIndex={0}
      aria-label={plainLabel(label)}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={fmt(value, digits)}
      data-sym={sym}
      className={["kit-scrub", roleClass(role), lit && "is-lit"].filter(Boolean).join(" ")}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {fmt(value, digits)}
    </span>
  );
}
