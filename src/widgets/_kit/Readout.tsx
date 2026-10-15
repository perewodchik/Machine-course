// Показание: «J = 5.23» с необязательной шкалой «сколько до минимума». Цифры моноширинные (tabular-nums).
import { fmt, labelParts } from "./format";

interface Props {
  name: string;
  value: number;
  digits?: number;
  /** Шкала: доля от max и отметка лучшего значения. */
  meter?: { max: number; best?: number };
  hint?: string;
}

export function Readout({ name, value, digits = 2, meter, hint }: Props) {
  const pct = (v: number) => `${Math.min(100, Math.max(0, (v / (meter?.max ?? 1)) * 100))}%`;
  return (
    <div className="kit-readout">
      <span className="kit-readout__name">
        {labelParts(name).map((p, i) => (p.sub ? <sub key={i}>{p.text}</sub> : <span key={i}>{p.text}</span>))}
      </span>
      <span className="kit-readout__eq"> = </span>
      <b className="kit-readout__value">{fmt(value, digits)}</b>
      {meter && (
        <span className="kit-meter" aria-hidden="true">
          <span style={{ width: pct(value) }} />
          {meter.best !== undefined && <i style={{ left: pct(meter.best) }} />}
        </span>
      )}
      {hint && <span className="kit-readout__hint">{hint}</span>}
    </div>
  );
}
