// Ссылки на конспект CS229 для людей: издание словами, раздел — «Глава → подраздел» (docs/conventions/sources.md).
import type { CS229Ref } from "./types";

const EDITIONS: Record<string, string> = {
  "main-notes-2026-spring": "конспект, весна 2026",
};

/** «Конспект, весна 2026: «Linear regression → The normal equations», «… → Probabilistic interpretation».» */
export function cs229Text(refs: readonly CS229Ref[]): string {
  const byEdition = new Map<string, string[]>();
  for (const r of refs) byEdition.set(r.edition, [...(byEdition.get(r.edition) ?? []), r.section]);
  return [...byEdition]
    .map(([edition, sections]) => {
      const name = EDITIONS[edition] ?? edition;
      const list = sections.map((s) => `«${s.split(/\s*\/\s*/).join(" → ")}»`).join(", ");
      return `${name[0]!.toUpperCase()}${name.slice(1)}: ${list}.`;
    })
    .join(" ");
}
