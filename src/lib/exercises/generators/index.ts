// Реестр генераторов: <Exercise gen="la.det2" /> находит генератор по ID.
import type { Generator } from "../types";
import { composeOrder, det2, fromImages, matmul2, shapes, slope3 } from "./la";
import { bayesTest, totalProbability } from "./prob";

export const generators: ReadonlyMap<string, Generator> = new Map([det2, matmul2, slope3, shapes, fromImages, composeOrder, totalProbability, bayesTest].map((g) => [g.id, g]));

export function generator(id: string): Generator {
  const g = generators.get(id);
  if (!g) throw new Error(`нет генератора задач «${id}» (src/lib/exercises/generators)`);
  return g;
}
