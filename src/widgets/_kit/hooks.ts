// Хуки набора: ширина контейнера (viewBox пересчитывается по ширине), подсветка символа, текст для aria-live.
import { useStore } from "@nanostores/react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { $activeSym } from "../../lib/state/highlight";

/** Ширина элемента; до первого измерения (и при сборке) — initial: разметка сервера и клиента совпадает. */
export function useWidth<T extends HTMLElement>(initial: number): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry?.contentRect.width ?? 0);
      // мелкие колебания не перерисовывают рисунок
      if (w > 0) setWidth((prev) => (Math.abs(prev - w) > 4 ? w : prev));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

/** Подсвечен ли символ: наведение на него в формуле, на легенде или на рисунке. */
export function useLit(sym: string | undefined): boolean {
  const active = useStore($activeSym);
  return sym !== undefined && active === sym;
}

/** Текст для aria-live с задержкой: во время перетаскивания скринридер не зачитывает каждое значение. */
export function useLiveText(text: string, delay = 400): string {
  const [live, setLive] = useState(text);
  useEffect(() => {
    const t = setTimeout(() => setLive(text), delay);
    return () => clearTimeout(t);
  }, [text, delay]);
  return live;
}
