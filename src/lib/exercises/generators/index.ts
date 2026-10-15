// Реестр генераторов: <Exercise gen="la.det2" /> находит генератор по ID.
import type { Generator } from "../types";
import { argmin, bilinear, chainRule, cs229Reading, derivative, geometric, indicatorSum, integralLinear, notation, numpyShapes, readNotation, sigmoidSymmetry, sse, sumSquare } from "./basics";
import { composeOrder, det2, dot, fromImages, independence, inSpan, lincomb, matmul2, shapes, slope3 } from "./la";
import { bayesTest, conditionalTable, totalProbability, union } from "./prob";

export const generators: ReadonlyMap<string, Generator> = new Map(
  [
    ...[sse, readNotation, argmin, sumSquare, bilinear, indicatorSum, geometric, sigmoidSymmetry, derivative, chainRule, integralLinear, numpyShapes, notation, cs229Reading],
    ...[det2, matmul2, slope3, shapes, fromImages, composeOrder, lincomb, inSpan, independence, dot],
    ...[totalProbability, bayesTest, union, conditionalTable],
  ].map((g) => [g.id, g]),
);

export function generator(id: string): Generator {
  const g = generators.get(id);
  if (!g) throw new Error(`нет генератора задач «${id}» (src/lib/exercises/generators)`);
  return g;
}
