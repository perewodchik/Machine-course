// Реестр генераторов: <Exercise gen="la.det2" /> находит генератор по ID.
import type { Generator } from "../types";
import { det2, matmul2, shapes, slope3 } from "./la";

export const generators: ReadonlyMap<string, Generator> = new Map([det2, matmul2, slope3, shapes].map((g) => [g.id, g]));

export function generator(id: string): Generator {
  const g = generators.get(id);
  if (!g) throw new Error(`нет генератора задач «${id}» (src/lib/exercises/generators)`);
  return g;
}
