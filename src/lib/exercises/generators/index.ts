// Реестр генераторов: <Exercise gen="la.det2" /> находит генератор по ID.
import type { Generator } from "../types";
import { argmin, bilinear, chainRule, cs229Reading, derivative, geometric, indicatorSum, integralLinear, notation, numpyShapes, readNotation, sigmoidSymmetry, sse, sumSquare } from "./basics";
import { angle, composeOrder, det2, detArea, detRules, dot, eigenPower, eigvals2, eigvecCheck, fromImages, hyperplaneDistance, independence, inSpan, inverse2, lincomb, matmul2, matmulColumn, norms, orthogonalMatrix, outer, projectOrthogonal, projection, psdCheck, rayleigh, lowrankError, minNorm, normalEq, singularValues, shapeProduct, shapes, slope3, solutionsCount, kernelVector, rankNullity, symPart, traceSwap, transposeChain } from "./la";
import { backprop, classifyPoint, convexForm, convexOps, criticalPoint, directional, gdStep, gradientPoint, hessian, jacobian, jacobianOrder, lrThreshold, matrixGrad, newton1d, newtonLogistic, partial, lagrangeLine, lagrangeEig, categoricalMle, kktAlpha } from "./calc";
import { bayesTest, conditionalTable, totalProbability, union } from "./prob";

export const generators: ReadonlyMap<string, Generator> = new Map(
  [
    ...[sse, readNotation, argmin, sumSquare, bilinear, indicatorSum, geometric, sigmoidSymmetry, derivative, chainRule, integralLinear, numpyShapes, notation, cs229Reading],
    ...[det2, matmul2, slope3, shapes, fromImages, composeOrder, lincomb, inSpan, independence, dot, norms, projection, angle, matmulColumn, outer, shapeProduct, transposeChain, symPart, traceSwap, solutionsCount, kernelVector, rankNullity, inverse2, detArea, detRules, orthogonalMatrix, hyperplaneDistance, projectOrthogonal, eigvals2, eigvecCheck, eigenPower, psdCheck, rayleigh, singularValues, lowrankError, minNorm, normalEq],
    ...[partial, gradientPoint, directional, criticalPoint, jacobian, jacobianOrder, backprop, matrixGrad, hessian, classifyPoint, convexForm, convexOps, gdStep, lrThreshold, newton1d, newtonLogistic, lagrangeLine, lagrangeEig, categoricalMle, kktAlpha],
    ...[totalProbability, bayesTest, union, conditionalTable],
  ].map((g) => [g.id, g]),
);

export function generator(id: string): Generator {
  const g = generators.get(id);
  if (!g) throw new Error(`нет генератора задач «${id}» (src/lib/exercises/generators)`);
  return g;
}
