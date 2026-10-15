// Ползунок параметра: бегунок цвета роли (что двигаем — того цвета и бегунок), значение с десятичной точкой.
// Клавиатура — у нативного range: стрелки, PageUp/PageDown, Home/End; значение для скринридера — aria-valuetext.
import { useId } from "react";
import { fmt, labelParts, plainLabel } from "./format";
import { useLit } from "./hooks";
import { roleClass, type Role } from "./roles";

interface Props {
  /** Имя величины: «θ_1» — с индексом. */
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  role?: Role;
  sym?: string;
  digits?: number;
  disabled?: boolean;
}

export function ParamSlider({ name, value, min, max, step, onChange, role = "param", sym, digits = 2, disabled }: Props) {
  const id = useId();
  const lit = useLit(sym);
  return (
    <div className={["kit-slider", roleClass(role), lit && "is-lit"].filter(Boolean).join(" ")} data-sym={sym}>
      <label htmlFor={id} className="kit-slider__name">
        {labelParts(name).map((p, i) => (p.sub ? <sub key={i}>{p.text}</sub> : <span key={i}>{p.text}</span>))}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={`${plainLabel(name)} = ${fmt(value, digits)}`}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
      />
      <output htmlFor={id} className="kit-slider__value">
        {fmt(value, digits)}
      </output>
    </div>
  );
}
